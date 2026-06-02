import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, PrimaryButton, Stat } from "@/components/ui";
import { money, trainers } from "@/lib/mock-data";
import { TrainerStatus } from "@/components/domain-sections";
import { exercises, payments, students, workouts } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminPersonalDetailPage({ params }: Props) {
  const { id } = await params;
  const trainer = trainers.find((item) => item.id === id);

  if (!trainer) notFound();
  const activeStudents = students.filter((student) => student.personalId === trainer.id && student.accessStatus === "active").length;
  const blockedStudents = students.filter((student) => student.personalId === trainer.id && student.accessStatus === "blocked").length;
  const trainerPayments = payments.filter((payment) => payment.personalId === trainer.id);
  const trainerExercises = exercises.filter((exercise) => exercise.personalId === trainer.id);
  const trainerWorkouts = workouts.filter((workout) => workout.personalId === trainer.id);

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
            <PrimaryButton>Aprovar personal</PrimaryButton>
            <button className="h-12 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-800">
              Bloquear acesso
            </button>
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
