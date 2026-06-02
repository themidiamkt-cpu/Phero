import { NextRequest, NextResponse } from "next/server";
import { runDailyPaymentLock, validateCronRequest } from "@/lib/finance";

async function handler(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ ok: false, error: "Rotina nao autorizada." }, { status: 401 });
  }

  const result = await runDailyPaymentLock();
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
