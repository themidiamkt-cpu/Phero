import Link from "next/link";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { BodyAssessmentDashboard } from "@/components/body-assessment-dashboard";
import { PageHeader } from "@/components/ui";
import { getStudentsData } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AvaliacoesPage({ params }: Props) {
  const { id } = await params;
  const students = await getStudentsData();
  const student = students.find((item) => item.id === id);

  if (!student) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Avaliacao fisica"
        title={student.name}
        action={
          <Link href={`/app/personal/alunos/${id}/avaliacoes/nova`} className="pressable grid size-11 place-items-center rounded-full bg-[var(--blue)] text-white">
            <Plus className="size-5" />
          </Link>
        }
      />
      <BodyAssessmentDashboard studentId={id} initialAssessments={[]} />
    </>
  );
}
