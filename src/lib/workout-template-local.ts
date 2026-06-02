"use client";

import { saveWorkoutPrescription } from "@/lib/workout-prescription";
import type { WorkoutTemplate } from "@/lib/types";

const favoriteKey = "phero:favorite-workout-templates";

export function getLocalFavoriteTemplateIds() {
  const saved = window.localStorage.getItem(favoriteKey);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(favoriteKey);
    return [];
  }
}

export function toggleLocalFavoriteTemplate(templateId: string) {
  const favorites = getLocalFavoriteTemplateIds();
  const next = favorites.includes(templateId)
    ? favorites.filter((id) => id !== templateId)
    : [...favorites, templateId];
  window.localStorage.setItem(favoriteKey, JSON.stringify(next));
  return next;
}

export function applyTemplateLocally(template: WorkoutTemplate, studentId: string) {
  template.days.forEach((day) => {
    const workoutId = `workout-template-${template.id}-${studentId}-${day.dayOrder}`;
    saveWorkoutPrescription({
      workout: {
        id: workoutId,
        studentId,
        personalId: "personal-1",
        title: `${template.name} - ${day.dayName}`,
        type: template.category.toLowerCase().includes("hibrido") ? "hybrid" : "strength",
        day: "Modelo",
        duration: `${template.estimatedDurationMinutes} min`,
        status: "pending",
        exercises: day.exercises.map((exercise) => exercise.exerciseName),
      },
      sets: day.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        sets: exercise.sets,
        reps: exercise.reps,
        load: "A definir",
        restTime: `${exercise.restSeconds}s`,
        notes: [exercise.technique, exercise.notes].filter(Boolean).join(" · ") || undefined,
      })),
    });
  });
}
