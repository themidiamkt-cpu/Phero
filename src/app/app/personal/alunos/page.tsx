import { PageHeader } from "@/components/ui";
import { StudentSearchList } from "@/components/mvp-widgets";
import { getCurrentProfile } from "@/lib/auth";
import { getMvpData } from "@/lib/data";

export default async function PersonalAlunosPage() {
  const [data, profile] = await Promise.all([getMvpData(), getCurrentProfile()]);
  const trainerStudents = data.students.filter((student) => student.personalId === profile.id);

  return (
    <>
      <PageHeader eyebrow="Carteira" title="Meus alunos" showBack={false} />
      <StudentSearchList items={trainerStudents} />
    </>
  );
}
