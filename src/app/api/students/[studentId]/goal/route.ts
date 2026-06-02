import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";

type Props = {
  params: Promise<{ studentId: string }>;
};

export async function PATCH(request: NextRequest, { params }: Props) {
  const { studentId } = await params;
  const payload = (await request.json()) as { goal?: string };
  const supabase = createAdminClient();
  const goal = payload.goal?.trim();

  if (!supabase || !isUuid(studentId)) {
    return NextResponse.json({ error: "Supabase indisponivel ou aluno invalido." }, { status: 400 });
  }

  if (!goal) {
    return NextResponse.json({ error: "Informe o objetivo do aluno." }, { status: 400 });
  }

  const { error } = await supabase
    .from("students")
    .update({ goal })
    .eq("id", studentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
