import { PageHeader } from "@/components/ui";
import { AdminGlobalTrainingManager } from "@/components/admin-global-training-manager";
import { exercises } from "@/lib/mock-data";

export default function AdminTreinosGeraisPage() {
  const globalExercises = exercises.filter((exercise) => exercise.source === "library");

  return (
    <>
      <PageHeader eyebrow="Admin global" title="Treinos gerais" />
      <AdminGlobalTrainingManager globalExercises={globalExercises} />
    </>
  );
}
