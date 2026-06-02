import { NextRequest, NextResponse } from "next/server";
import { applyPaymentAnalysis, validateWebhookRequest } from "@/lib/finance";

export async function POST(request: NextRequest) {
  if (!validateWebhookRequest(request)) {
    return NextResponse.json({ ok: false, error: "Webhook nao autorizado." }, { status: 401 });
  }

  const body = await request.json();

  if (!body.payment_id || !body.receipt_id || !["approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Payload invalido." }, { status: 400 });
  }

  const result = await applyPaymentAnalysis({
    paymentId: body.payment_id,
    receiptId: body.receipt_id,
    status: body.status,
    confidenceScore: body.confidence_score,
    reason: body.reason,
    aiResult: body.ai_result,
    webhookPayload: body,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
