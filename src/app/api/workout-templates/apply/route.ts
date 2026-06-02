import { NextRequest, NextResponse } from "next/server";
import { applyWorkoutTemplateToStudent } from "@/lib/workout-template-service";

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { templateId?: string; studentId?: string; trainerId?: string };

  if (!payload.templateId || !payload.studentId || !payload.trainerId) {
    return NextResponse.json({ error: "templateId, studentId e trainerId sao obrigatorios." }, { status: 400 });
  }

  const result = await applyWorkoutTemplateToStudent({
    templateId: payload.templateId,
    studentId: payload.studentId,
    trainerId: payload.trainerId,
  });

  if ("error" in result && result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
