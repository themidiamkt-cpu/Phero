import { PageHeader } from "@/components/ui";
import { BodyAssessmentForm } from "@/components/body-assessment-form";
import { getCurrentProfile } from "@/lib/auth";
import { getBodyAssessmentsData, getStudentsData } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NovaAvaliacaoPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const [assessments, students] = await Promise.all([getBodyAssessmentsData(id), getStudentsData()]);
  const previousAssessment = assessments[0];
  const student = students.find((item) => item.id === id);

  return (
    <>
      <PageHeader eyebrow="Avaliacao fisica" title="Nova avaliacao" />
      <BodyAssessmentForm previousAssessment={previousAssessment} studentGoal={student?.goal} studentId={id} trainerId={profile.id} />
    </>
  );
}
