import { PageHeader } from "@/components/ui";
import { AdminGlobalTrainingManager } from "@/components/admin-global-training-manager";
import { exercises } from "@/lib/mock-data";
import { getWorkoutTemplates } from "@/lib/workout-template-service";

export default async function AdminTreinosGeraisPage() {
  const globalExercises = exercises.filter((exercise) => exercise.source === "library");
  const templates = await getWorkoutTemplates();

  return (
    <>
      <PageHeader eyebrow="Admin global" title="Treinos gerais" />
      <AdminGlobalTrainingManager globalExercises={globalExercises} initialTemplates={templates} />
    </>
  );
}
