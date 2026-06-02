import { NextResponse } from "next/server";
import { applyPaymentAnalysis } from "@/lib/finance";

type Props = {
  params: Promise<{ paymentId: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { paymentId } = await params;
  const body = await request.json();

  if (!["approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ ok: false, error: "Status manual invalido." }, { status: 400 });
  }

  const result = await applyPaymentAnalysis({
    paymentId,
    receiptId: body.receipt_id ?? "manual-review",
    status: body.status,
    reason: body.reason ?? (body.status === "approved" ? "Aprovacao manual do personal" : "Recusa manual do personal"),
    aiResult: { source: "manual", actor: "trainer" },
    webhookPayload: body,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
