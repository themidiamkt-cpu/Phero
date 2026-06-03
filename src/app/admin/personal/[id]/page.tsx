import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { money } from "@/lib/mock-data";
import { TrainerStatus } from "@/components/domain-sections";
import { AdminTrainerActions } from "@/components/mvp-widgets";
import { getMvpData } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminPersonalDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getMvpData();
  const trainerBase = data.trainers.find((item) => item.id === id);

  if (!trainerBase) notFound();
  const activeStudents = data.students.filter((student) => student.personalId === trainerBase.id && student.accessStatus === "active").length;
  const blockedStudents = data.students.filter((student) => student.personalId === trainerBase.id && student.accessStatus === "blocked").length;
  const trainerPayments = data.payments.filter((payment) => payment.personalId === trainerBase.id);
  const trainerExercises = data.exercises.filter((exercise) => exercise.personalId === trainerBase.id);
  const trainerWorkouts = data.workouts.filter((workout) => workout.personalId === trainerBase.id);
  const trainer = {
    ...trainerBase,
    studentsCount: activeStudents + blockedStudents,
    monthlyRevenue: trainerPayments
      .filter((payment) => payment.status === "approved" || payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0),
  };

  return (
    <>
      <PageHeader eyebrow="Personal" title={trainer.name} action={<TrainerStatus trainer={trainer} />} />
      <section className="grid gap-3 sm:grid-cols-2">
        <Stat label="Alunos" value={String(trainer.studentsCount)} />
        <Stat label="Receita mensal" value={money(trainer.monthlyRevenue)} tone="light" />
        <Stat label="Ativos" value={String(activeStudents)} tone="light" />
        <Stat label="Bloqueados" value={String(blockedStudents)} tone="light" />
      </section>
      <section className="mt-5">
        <Card>
          <p className="text-sm text-neutral-500">{trainer.email}</p>
          <p className="mt-3 font-semibold">{trainer.specialty}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={trainer.approved ? "success" : "warning"}>{trainer.approved ? "Aprovado" : "Aguardando aprovacao"}</Badge>
            <Badge tone={trainer.blocked ? "danger" : "success"}>{trainer.blocked ? "Bloqueado" : "Nao bloqueado"}</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <AdminTrainerActions trainerId={trainer.id} />
          </div>
        </Card>
      </section>
      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Pagamentos</h2>
          <p className="mt-2 text-2xl font-semibold">{trainerPayments.length}</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Exercicios criados</h2>
          <p className="mt-2 text-2xl font-semibold">{trainerExercises.length}</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Treinos enviados</h2>
          <p className="mt-2 text-2xl font-semibold">{trainerWorkouts.length}</p>
        </Card>
      </section>
    </>
  );
}
