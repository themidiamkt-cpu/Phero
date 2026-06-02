import { PageHeader } from "@/components/ui";
import { CreateWorkoutForm } from "@/components/mvp-widgets";
import { getCurrentProfile } from "@/lib/auth";
import { getExercisesData, getStudentsData } from "@/lib/data";

export default async function NovoTreinoPage() {
  const profile = await getCurrentProfile();
  const [students, exercises] = await Promise.all([getStudentsData(), getExercisesData()]);
  const trainerStudents = students.filter((student) => student.personalId === profile.id);

  return (
    <>
      <PageHeader eyebrow="Criar treino" title="Nova prescricao" />
      <CreateWorkoutForm studentItems={trainerStudents} exerciseItems={exercises} trainerId={profile.id} />
    </>
  );
}
