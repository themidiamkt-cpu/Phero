import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { templateId?: string; trainerId?: string; favorite?: boolean };
  const supabase = createAdminClient();

  if (!payload.templateId || !payload.trainerId) {
    return NextResponse.json({ error: "templateId e trainerId sao obrigatorios." }, { status: 400 });
  }

  if (!supabase || !isUuid(payload.templateId) || !isUuid(payload.trainerId)) {
    return NextResponse.json({ persisted: false });
  }

  if (payload.favorite === false) {
    const { error } = await supabase
      .from("favorite_workout_templates")
      .delete()
      .eq("template_id", payload.templateId)
      .eq("trainer_id", payload.trainerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ persisted: true, favorite: false });
  }

  const { error } = await supabase
    .from("favorite_workout_templates")
    .upsert({ template_id: payload.templateId, trainer_id: payload.trainerId }, { onConflict: "trainer_id,template_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ persisted: true, favorite: true });
}
