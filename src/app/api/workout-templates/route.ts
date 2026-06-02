import { NextRequest, NextResponse } from "next/server";
import { getWorkoutTemplates } from "@/lib/workout-template-service";

export async function GET(request: NextRequest) {
  const trainerId = request.nextUrl.searchParams.get("trainerId") ?? undefined;
  const templates = await getWorkoutTemplates(trainerId);

  return NextResponse.json({ templates });
}
