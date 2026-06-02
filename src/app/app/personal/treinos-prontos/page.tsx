import { PageHeader } from "@/components/ui";
import { WorkoutTemplateLibrary } from "@/components/workout-template-library";
import { getStudentsData } from "@/lib/data";
import { getCurrentProfile } from "@/lib/auth";
import { getWorkoutTemplates } from "@/lib/workout-template-service";

type Props = {
  searchParams: Promise<{ studentId?: string }>;
};

export default async function TreinosProntosPage({ searchParams }: Props) {
  const profile = await getCurrentProfile();
  const [{ studentId }, students, templates] = await Promise.all([
    searchParams,
    getStudentsData(),
    getWorkoutTemplates(profile.id),
  ]);
  const trainerStudents = students.filter((student) => student.personalId === profile.id);

  return (
    <>
      <PageHeader eyebrow="Treinos Prontos" title="Modelos" />
      <WorkoutTemplateLibrary initialStudentId={studentId} students={trainerStudents} templates={templates} trainerId={profile.id} />
    </>
  );
}
