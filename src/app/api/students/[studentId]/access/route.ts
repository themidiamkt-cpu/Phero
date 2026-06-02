import { NextResponse } from "next/server";
import { setStudentAccess } from "@/lib/finance";

type Props = {
  params: Promise<{ studentId: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { studentId } = await params;
  const body = await request.json();

  if (!["block", "release"].includes(body.action)) {
    return NextResponse.json({ ok: false, error: "Acao invalida." }, { status: 400 });
  }

  const result = await setStudentAccess({
    studentId,
    trainerId: body.trainer_id,
    action: body.action,
    reason: body.reason,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
