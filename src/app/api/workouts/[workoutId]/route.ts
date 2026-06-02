import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";

type Props = {
  params: Promise<{ workoutId: string }>;
};

export async function DELETE(_request: NextRequest, { params }: Props) {
  const { workoutId } = await params;
  const supabase = createAdminClient();

  if (!supabase || !isUuid(workoutId)) {
    return NextResponse.json({ error: "Supabase indisponivel ou treino invalido." }, { status: 400 });
  }

  const { error } = await supabase.from("workouts").delete().eq("id", workoutId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
