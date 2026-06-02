import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWorkoutsData } from "@/lib/data";
import { isUuid } from "@/lib/ids";
import type { RunningWorkout, WorkoutSet } from "@/lib/types";

type CreateWorkoutPayload = {
  trainerId?: string;
  studentId: string;
  title: string;
  type: "strength" | "running" | "hybrid" | "functional" | "mobility" | "recovery";
  description?: string;
  scheduledDate?: string;
  exercises?: WorkoutSet[];
  running?: RunningWorkout;
};

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const workouts = await getWorkoutsData();
  const filtered = studentId ? workouts.filter((workout) => workout.studentId === studentId) : workouts;

  return NextResponse.json({ workouts: filtered });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CreateWorkoutPayload;

  if (!payload.studentId || !payload.title?.trim() || !payload.type) {
    return NextResponse.json({ error: "Dados obrigatorios ausentes." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const trainerId = payload.trainerId;

  if (!supabase || !isUuid(payload.studentId) || !isUuid(trainerId)) {
    return NextResponse.json({
      error: "Supabase indisponivel ou IDs invalidos para salvar treino real.",
    }, { status: 400 });
  }

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      trainer_id: trainerId,
      student_id: payload.studentId,
      title: payload.title.trim(),
      workout_type: payload.type,
      description: payload.description ?? null,
      scheduled_date: payload.scheduledDate || null,
      status: "active",
    })
    .select("id")
    .single();

  if (workoutError || !workout) {
    return NextResponse.json({ error: workoutError?.message ?? "Nao foi possivel criar o treino." }, { status: 500 });
  }

  const exerciseRows = (payload.exercises ?? [])
    .filter((exercise) => isUuid(exercise.exerciseId))
    .map((exercise, index) => ({
      workout_id: workout.id,
      exercise_id: exercise.exerciseId,
      sets: exercise.sets,
      reps: exercise.reps,
      load: exercise.load,
      rest_time: exercise.restTime,
      order_index: index,
      notes: exercise.notes ?? null,
    }));

  if (exerciseRows.length) {
    const { error } = await supabase.from("workout_exercises").insert(exerciseRows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (payload.running) {
    const { error } = await supabase.from("running_workouts").insert({
      workout_id: workout.id,
      running_type: payload.running.runningType,
      distance_km: payload.running.distanceKm,
      target_time: payload.running.targetTime,
      target_pace: payload.running.targetPace,
      target_heart_rate: payload.running.targetHeartRate,
      notes: payload.running.notes ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ persisted: true, id: workout.id });
}
