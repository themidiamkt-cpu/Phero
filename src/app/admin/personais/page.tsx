import { PageHeader } from "@/components/ui";
import { TrainerTable } from "@/components/domain-sections";

export default function AdminPersonaisPage() {
  return (
    <>
      <PageHeader eyebrow="Admin" title="Personais" />
      <TrainerTable />
    </>
  );
}
