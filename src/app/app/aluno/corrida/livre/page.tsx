import { RunningExecution } from "@/components/mvp-widgets";
import type { RunningWorkout } from "@/lib/types";

const freeRun: RunningWorkout = {
  workoutId: "free-run",
  runningType: "Corrida livre",
  distanceKm: 0,
  targetTime: "Livre",
  targetPace: "Livre",
  targetHeartRate: "Zona livre",
  notes: "Corrida livre iniciada pelo aluno.",
};

export default function CorridaLivrePage() {
  return <RunningExecution running={freeRun} />;
}
