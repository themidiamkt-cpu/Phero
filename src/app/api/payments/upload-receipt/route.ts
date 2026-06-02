import { NextResponse } from "next/server";
import { uploadPaymentReceipt } from "@/lib/finance";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Arquivo obrigatorio." }, { status: 400 });
  }

  const paymentId = String(form.get("payment_id") ?? "");
  const studentId = String(form.get("student_id") ?? "");
  const trainerId = String(form.get("trainer_id") ?? "");
  const studentName = String(form.get("student_name") ?? "");
  const trainerName = String(form.get("trainer_name") ?? "");
  const expectedAmount = Number(form.get("expected_amount") ?? 0);
  const dueDate = String(form.get("due_date") ?? "");

  if (!paymentId || !studentId || !trainerId || !studentName || !trainerName || !expectedAmount || !dueDate) {
    return NextResponse.json({ ok: false, error: "Dados do pagamento incompletos." }, { status: 400 });
  }

  const result = await uploadPaymentReceipt({
    paymentId,
    studentId,
    trainerId,
    studentName,
    trainerName,
    expectedAmount,
    dueDate,
    file,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
