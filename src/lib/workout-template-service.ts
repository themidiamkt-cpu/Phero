import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";
import { initialWorkoutTemplates } from "@/lib/workout-templates";
import type { WorkoutTemplate } from "@/lib/types";

type ApplyInput = {
  templateId: string;
  studentId: string;
  trainerId: string;
};

export async function getWorkoutTemplates(trainerId?: string): Promise<WorkoutTemplate[]> {
  const supabase = createAdminClient();

  if (!supabase) return initialWorkoutTemplates;

  const { data, error } = await supabase
    .from("workout_templates")
    .select("*, workout_template_days(*, workout_template_exercises(*)), favorite_workout_templates(trainer_id)")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data?.length) return initialWorkoutTemplates;

  return data.map((template) => ({
    id: template.id,
    name: template.name,
    goal: template.goal,
    level: template.level,
    category: template.category,
    daysPerWeek: template.days_per_week,
    estimatedDurationMinutes: template.estimated_duration_minutes,
    location: template.location,
    equipment: template.equipment ?? [],
    description: template.description,
    isActive: template.is_active,
    isFavorite: trainerId ? (template.favorite_workout_templates ?? []).some((favorite: { trainer_id: string }) => favorite.trainer_id === trainerId) : false,
    days: (template.workout_template_days ?? [])
      .sort((a: { day_order: number }, b: { day_order: number }) => a.day_order - b.day_order)
      .map((day: {
        id: string;
        template_id: string;
        day_order: number;
        day_name: string;
        focus: string;
        notes: string | null;
        workout_template_exercises?: Array<{
          id: string;
          template_day_id: string;
          exercise_order: number;
          exercise_name: string;
          muscle_group: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          technique: string | null;
          notes: string | null;
        }>;
      }) => ({
        id: day.id,
        templateId: day.template_id,
        dayOrder: day.day_order,
        dayName: day.day_name,
        focus: day.focus,
        notes: day.notes ?? undefined,
        exercises: (day.workout_template_exercises ?? [])
          .sort((a, b) => a.exercise_order - b.exercise_order)
          .map((exercise) => ({
            id: exercise.id,
            templateDayId: exercise.template_day_id,
            exerciseOrder: exercise.exercise_order,
            exerciseName: exercise.exercise_name,
            muscleGroup: exercise.muscle_group,
            sets: exercise.sets,
            reps: exercise.reps,
            restSeconds: exercise.rest_seconds,
            technique: exercise.technique ?? undefined,
            notes: exercise.notes ?? undefined,
          })),
      })),
    createdAt: template.created_at,
  }));
}

export async function applyWorkoutTemplateToStudent({ studentId, templateId, trainerId }: ApplyInput) {
  const templates = await getWorkoutTemplates(trainerId);
  const template = templates.find((item) => item.id === templateId);

  if (!template) {
    return { persisted: false, error: "Modelo nao encontrado." };
  }

  const supabase = createAdminClient();
  if (!supabase || !isUuid(studentId) || !isUuid(trainerId)) {
    return {
      persisted: false,
      template,
      workoutIds: template.days.map((day) => `${template.id}-${studentId}-day-${day.dayOrder}`),
    };
  }

  const workoutIds: string[] = [];

  for (const day of template.days) {
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        trainer_id: trainerId,
        student_id: studentId,
        title: `${template.name} - ${day.dayName}`,
        workout_type: template.category.toLowerCase().includes("hibrido") ? "hybrid" : "strength",
        description: `${day.focus}. ${day.notes ?? template.description}`,
        status: "draft",
      })
      .select("id")
      .single();

    if (workoutError || !workout) return { persisted: false, error: workoutError?.message ?? "Nao foi possivel criar o treino." };
    workoutIds.push(workout.id);

    const rows = [];
    for (const templateExercise of day.exercises) {
      const exerciseId = await ensureExerciseForTemplate({
        exerciseName: templateExercise.exerciseName,
        muscleGroup: templateExercise.muscleGroup,
        trainerId,
      });

      if (!exerciseId) continue;

      rows.push({
        workout_id: workout.id,
        exercise_id: exerciseId,
        sets: templateExercise.sets,
        reps: templateExercise.reps,
        rest_time: `${templateExercise.restSeconds}s`,
        order_index: templateExercise.exerciseOrder,
        notes: [templateExercise.technique, templateExercise.notes].filter(Boolean).join(" · "),
      });
    }

    if (rows.length) {
      const { error } = await supabase.from("workout_exercises").insert(rows);
      if (error) return { persisted: false, error: error.message };
    }
  }

  return { persisted: true, template, workoutId: workoutIds[0], workoutIds };
}

async function ensureExerciseForTemplate({
  exerciseName,
  muscleGroup,
  trainerId,
}: {
  exerciseName: string;
  muscleGroup: string;
  trainerId: string;
}) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: existing } = await supabase
    .from("exercises")
    .select("id")
    .eq("name", exerciseName)
    .or(`trainer_id.eq.${trainerId},is_global.eq.true`)
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("exercises")
    .insert({
      trainer_id: trainerId,
      is_global: false,
      name: exerciseName,
      muscle_group: muscleGroup,
    })
    .select("id")
    .single();

  if (error || !created?.id) return null;
  return created.id as string;
}
