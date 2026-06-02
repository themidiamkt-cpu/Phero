import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAYMENT_WEBHOOK_URL, postWithRetry, type PaymentReceiptWebhookPayload } from "@/lib/n8n";

export const RECEIPT_ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const RECEIPT_MAX_BYTES = 20 * 1024 * 1024;

export type AnalysisStatus = "approved" | "rejected";

export function validateReceiptFile(file: File) {
  if (!RECEIPT_ALLOWED_TYPES.includes(file.type)) {
    return "Formato invalido. Envie JPG, JPEG, PNG ou PDF.";
  }

  if (file.size > RECEIPT_MAX_BYTES) {
    return "Arquivo maior que 20MB.";
  }

  return null;
}

export function validateWebhookRequest(request: NextRequest) {
  const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!expectedSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("x-webhook-secret") === expectedSecret;
}

export function validateCronRequest(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("x-cron-secret") === expectedSecret || request.nextUrl.searchParams.get("secret") === expectedSecret;
}

export async function uploadPaymentReceipt(input: {
  paymentId: string;
  studentId: string;
  trainerId: string;
  studentName: string;
  trainerName: string;
  expectedAmount: number;
  dueDate: string;
  file: File;
}) {
  const fileError = validateReceiptFile(input.file);

  if (fileError) {
    return { ok: false, status: 400, error: fileError };
  }

  const uploadedAt = new Date().toISOString();
  const receiptId = crypto.randomUUID();
  const extension = input.file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const storagePath = `${input.trainerId}/${input.studentId}/${receiptId}.${extension}`;
  const supabase = createAdminClient();
  let fileUrl = `payment-receipts/${storagePath}`;

  if (supabase) {
    const { error: uploadError } = await supabase.storage.from("payment-receipts").upload(storagePath, input.file, {
      contentType: input.file.type,
      upsert: false,
    });

    if (uploadError) {
      return { ok: false, status: 500, error: uploadError.message };
    }

    const signed = await supabase.storage.from("payment-receipts").createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    fileUrl = signed.data?.signedUrl ?? fileUrl;

    const { data: receipt, error: receiptError } = await supabase
      .from("payment_receipts")
      .insert({
        payment_id: input.paymentId,
        student_id: input.studentId,
        trainer_id: input.trainerId,
        file_url: fileUrl,
        file_type: input.file.type,
        status: "waiting_analysis",
        uploaded_at: uploadedAt,
      })
      .select("id")
      .single();

    if (receiptError) {
      return { ok: false, status: 500, error: receiptError.message };
    }

    await supabase.from("payments").update({ status: "waiting_analysis" }).eq("id", input.paymentId);
    await supabase.from("student_subscriptions").update({ access_status: "blocked" }).eq("student_id", input.studentId);
    await supabase.from("students").update({ access_status: "blocked" }).eq("id", input.studentId);

    const payload = buildReceiptPayload({ ...input, receiptId: receipt.id, fileUrl, uploadedAt });
    await supabase.from("payment_analysis_logs").insert({
      payment_id: input.paymentId,
      receipt_id: receipt.id,
      webhook_payload: payload,
      status: "waiting_analysis",
      reason: "Comprovante recebido e enviado para n8n",
    });
    await supabase.from("financial_audit_logs").insert({
      actor_type: "student",
      event: "payment_receipt_uploaded",
      payment_id: input.paymentId,
      receipt_id: receipt.id,
      student_id: input.studentId,
      trainer_id: input.trainerId,
      metadata: { file_type: input.file.type, file_url: fileUrl },
    });

    const webhook = await postWithRetry(PAYMENT_WEBHOOK_URL, payload);
    await supabase.from("payment_webhook_deliveries").insert({
      payment_id: input.paymentId,
      receipt_id: receipt.id,
      event: "payment_receipt_uploaded",
      payload,
      status: webhook.ok ? "delivered" : "failed",
      attempts: webhook.attempt,
      last_error: webhook.ok ? null : webhook.error,
      delivered_at: webhook.ok ? new Date().toISOString() : null,
    });

    return { ok: true, receiptId: receipt.id, fileUrl, webhook };
  }

  const payload = buildReceiptPayload({ ...input, receiptId, fileUrl, uploadedAt });

  return {
    ok: false,
    status: 500,
    error: "Supabase service role nao configurado. O comprovante nao foi salvo.",
    receiptId,
    fileUrl,
    payload,
    webhook: { ok: false, reason: "Supabase service role nao configurado." },
  };
}

function buildReceiptPayload(input: {
  paymentId: string;
  receiptId: string;
  studentId: string;
  trainerId: string;
  studentName: string;
  trainerName: string;
  expectedAmount: number;
  dueDate: string;
  fileUrl: string;
  file: File;
  uploadedAt: string;
}): PaymentReceiptWebhookPayload {
  return {
    event: "payment_receipt_uploaded",
    payment_id: input.paymentId,
    receipt_id: input.receiptId,
    student_id: input.studentId,
    trainer_id: input.trainerId,
    student_name: input.studentName,
    trainer_name: input.trainerName,
    expected_amount: input.expectedAmount,
    due_date: input.dueDate,
    file_url: input.fileUrl,
    file_type: input.file.type,
    uploaded_at: input.uploadedAt,
  };
}

export async function applyPaymentAnalysis(input: {
  paymentId: string;
  receiptId: string;
  status: AnalysisStatus;
  confidenceScore?: number;
  reason?: string;
  aiResult?: Record<string, unknown>;
  webhookPayload?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return { ok: false, status: 500, error: "Supabase service role nao configurado." };
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, student_id, trainer_id, subscription_id")
    .eq("id", input.paymentId)
    .single();

  if (paymentError || !payment) {
    return { ok: false, status: 404, error: paymentError?.message ?? "Pagamento nao encontrado" };
  }

  const hasReceipt = input.receiptId !== "manual-review";

  if (input.status === "approved") {
    await supabase.from("payments").update({ status: "approved", paid_at: new Date().toISOString() }).eq("id", input.paymentId);
    if (hasReceipt) {
      await supabase.from("payment_receipts").update({ status: "approved" }).eq("id", input.receiptId);
    }
    await supabase.from("student_subscriptions").update({ status: "active", access_status: "released" }).eq("id", payment.subscription_id);
    await supabase.from("students").update({ access_status: "released" }).eq("id", payment.student_id);
    await supabase
      .from("access_locks")
      .update({ status: "released", unlocked_at: new Date().toISOString() })
      .eq("student_id", payment.student_id)
      .eq("status", "active");
  } else {
    await supabase.from("payments").update({ status: "rejected" }).eq("id", input.paymentId);
    if (hasReceipt) {
      await supabase.from("payment_receipts").update({ status: "rejected" }).eq("id", input.receiptId);
    }
    await supabase.from("student_subscriptions").update({ access_status: "blocked" }).eq("id", payment.subscription_id);
    await supabase.from("students").update({ access_status: "blocked" }).eq("id", payment.student_id);
  }

  await supabase.from("payment_analysis_logs").insert({
    payment_id: input.paymentId,
    receipt_id: hasReceipt ? input.receiptId : null,
    webhook_payload: input.webhookPayload ?? null,
    ai_result: input.aiResult ?? null,
    confidence_score: input.confidenceScore ?? null,
    status: input.status,
    reason: input.reason ?? (input.status === "approved" ? "Comprovante aprovado" : "Comprovante recusado"),
  });

  await supabase.from("financial_audit_logs").insert({
    actor_type: input.aiResult?.source === "manual" ? "trainer" : "automation",
    event: `payment_${input.status}`,
    payment_id: input.paymentId,
    student_id: payment.student_id,
    trainer_id: payment.trainer_id,
    metadata: {
      receipt_id: hasReceipt ? input.receiptId : null,
      confidence_score: input.confidenceScore ?? null,
      reason: input.reason ?? null,
    },
  });

  return { ok: true, applied: input.status };
}

export async function setStudentAccess(input: {
  studentId: string;
  trainerId: string;
  action: "block" | "release";
  reason?: string;
}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return { ok: false, status: 500, error: "Supabase service role nao configurado." };
  }

  if (input.action === "release") {
    await supabase.from("students").update({ access_status: "released" }).eq("id", input.studentId);
    await supabase.from("student_subscriptions").update({ access_status: "released" }).eq("student_id", input.studentId);
    await supabase
      .from("access_locks")
      .update({ status: "released", unlocked_at: new Date().toISOString() })
      .eq("student_id", input.studentId)
      .eq("status", "active");
  } else {
    await supabase.from("students").update({ access_status: "blocked" }).eq("id", input.studentId);
    await supabase.from("student_subscriptions").update({ access_status: "blocked" }).eq("student_id", input.studentId);
    await supabase.from("access_locks").insert({
      student_id: input.studentId,
      trainer_id: input.trainerId,
      reason: input.reason ?? "Bloqueio manual",
      status: "active",
    });
  }

  await supabase.from("financial_audit_logs").insert({
    actor_type: "trainer",
    event: input.action === "release" ? "student_access_released" : "student_access_blocked",
    student_id: input.studentId,
    trainer_id: input.trainerId,
    metadata: { reason: input.reason ?? null },
  });

  return { ok: true, action: input.action };
}

export async function runDailyPaymentLock() {
  const supabase = createAdminClient();

  if (!supabase) {
    return { ok: false, status: 500, error: "Supabase service role nao configurado.", locked: 0 };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: overduePayments, error } = await supabase
    .from("payments")
    .select("id, student_id, trainer_id, subscription_id")
    .lt("due_date", today)
    .neq("status", "approved");

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  for (const payment of overduePayments ?? []) {
    await supabase.from("payments").update({ status: "overdue" }).eq("id", payment.id);
    await supabase.from("student_subscriptions").update({ access_status: "blocked" }).eq("id", payment.subscription_id);
    await supabase.from("students").update({ access_status: "blocked" }).eq("id", payment.student_id);
    await supabase.from("access_locks").insert({
      student_id: payment.student_id,
      trainer_id: payment.trainer_id,
      reason: "Inadimplência",
      status: "active",
    });
    await supabase.from("payment_analysis_logs").insert({
      payment_id: payment.id,
      status: "overdue",
      reason: "Bloqueio automatico diario por inadimplencia",
    });
    await supabase.from("financial_audit_logs").insert({
      actor_type: "automation",
      event: "daily_overdue_lock",
      payment_id: payment.id,
      student_id: payment.student_id,
      trainer_id: payment.trainer_id,
      metadata: { reason: "Inadimplência" },
    });
  }

  return { ok: true, locked: overduePayments?.length ?? 0 };
}
