import { PageHeader } from "@/components/ui";
import { StudentSearchList } from "@/components/mvp-widgets";
import { getMvpData } from "@/lib/data";

export default async function PersonalAlunosPage() {
  const data = await getMvpData();
  return (
    <>
      <PageHeader eyebrow="Carteira" title="Meus alunos" showBack={false} />
      <StudentSearchList items={data.students} />
    </>
  );
}
