import { Badge, PageHeader } from "@/components/ui";
import { BodyAssessmentDetail } from "@/components/body-assessment-detail";

type Props = {
  params: Promise<{ id: string; assessmentId: string }>;
};

export default async function AvaliacaoDetalhePage({ params }: Props) {
  const { id, assessmentId } = await params;

  return (
    <>
      <PageHeader eyebrow="Comparacao" title="Avaliacao completa" action={<Badge tone="blue">PRO</Badge>} />
      <BodyAssessmentDetail studentId={id} assessmentId={assessmentId} initialAssessments={[]} />
    </>
  );
}
