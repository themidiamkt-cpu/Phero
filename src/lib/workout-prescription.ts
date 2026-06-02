import type { RunningWorkout, Workout, WorkoutSet } from "@/lib/types";

export type SavedWorkoutPrescription = {
  workout: Workout;
  sets: WorkoutSet[];
  running?: RunningWorkout;
};

const workoutPrescriptionKey = "phero:workout-prescriptions";

export function getSavedWorkoutPrescriptions() {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(workoutPrescriptionKey);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as SavedWorkoutPrescription[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(workoutPrescriptionKey);
    return [];
  }
}

export function saveWorkoutPrescription(prescription: SavedWorkoutPrescription) {
  const current = getSavedWorkoutPrescriptions().filter((item) => item.workout.id !== prescription.workout.id);
  const next = [prescription, ...current];
  window.localStorage.setItem(workoutPrescriptionKey, JSON.stringify(next));
  return next;
}

export function mergeWorkouts(initialWorkouts: Workout[], savedPrescriptions: SavedWorkoutPrescription[]) {
  const byId = new Map<string, Workout>();
  [...savedPrescriptions.map((item) => item.workout), ...initialWorkouts].forEach((workout) => byId.set(workout.id, workout));
  return [...byId.values()];
}
