import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { PaymentList, WorkoutList } from "@/components/domain-sections";
import { StudentPlanForm } from "@/components/student-plan-form";
import { StudentAccessButton, StudentPaymentReview } from "@/components/student-finance-actions";
import { StudentGoalForm } from "@/components/student-goal-form";
import { getBodyAssessmentsData, getMvpData, getStudentFinanceData } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PerfilAlunoPage({ params }: Props) {
  const { id } = await params;
  const [data, bodyAssessments, finance] = await Promise.all([getMvpData(), getBodyAssessmentsData(id), getStudentFinanceData(id)]);
  const student = data.students.find((item) => item.id === id);
  const assessment = bodyAssessments[0];
  const studentWorkouts = data.workouts.filter((workout) => workout.studentId === id);
  const completedWorkouts = studentWorkouts.filter((workout) => workout.status === "done").length;
  const trainerPlans = data.plans.filter((plan) => plan.trainerId === student?.personalId);
  const reviewPaymentIds = new Set(finance.payments
    .filter((payment) => payment.status === "waiting_analysis" || payment.status === "pending_review" || Boolean(payment.proofUrl))
    .map((payment) => payment.id));
  const visiblePaymentHistory = data.payments.filter((payment) => !reviewPaymentIds.has(payment.id));

  if (!student) notFound();

  return (
    <>
      <PageHeader eyebrow="Aluno" title={student.name} action={<Badge tone={student.accessStatus === "active" ? "success" : "danger"}>{student.accessStatus}</Badge>} />
      <section className="space-y-4 px-5">
        <Card>
          <p className="text-sm text-neutral-500">{student.email} · {student.goal}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/app/personal/treinos/novo" className="grid h-11 place-items-center rounded-lg bg-neutral-950 text-sm font-semibold text-white">Criar treino</Link>
            <Link href={`/app/personal/treinos-prontos?studentId=${student.id}`} className="grid h-11 place-items-center rounded-lg bg-[var(--blue)] text-center text-sm font-semibold text-white">Treino pronto</Link>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <StudentAccessButton student={student} trainerId={student.personalId} />
          </div>
          <Link href="/app/personal/chat" className="mt-2 grid h-11 place-items-center rounded-lg bg-[var(--blue)] text-sm font-semibold text-white">
            Conversar com aluno
          </Link>
          <Link href={`/app/personal/alunos/${student.id}/avaliacoes`} className="mt-2 grid h-11 place-items-center rounded-lg border border-[var(--hair)] bg-white text-sm font-semibold text-[var(--ink)]">
            Avaliacao fisica
          </Link>
        </Card>
        <StudentGoalForm initialGoal={student.goal} studentId={student.id} />
        <Card>
          <h2 className="font-semibold">Plano contratado</h2>
          <p className="mt-2 text-sm text-neutral-500">{finance.plan ? finance.plan.name : "Nenhum plano cadastrado"}</p>
          <p className="mt-1 text-sm text-neutral-500">Proxima fatura: {finance.subscription?.nextDueDate || "--"}</p>
          <StudentPlanForm
            currentSubscription={finance.subscription}
            plans={trainerPlans}
            studentId={student.id}
          />
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl">Treinos reais</p>
              <h2 className="mt-2 text-lg font-bold">{studentWorkouts.length} prescritos</h2>
              <p className="mt-1 text-sm text-neutral-500">{completedWorkouts} concluidos pelo aluno.</p>
            </div>
            <Badge tone="blue">{studentWorkouts.length ? "Com dados" : "Sem treino"}</Badge>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Peso" value={assessment ? `${assessment.weight}kg` : "--"} />
          <Stat label="Gordura" value={assessment ? `${assessment.bodyFatPercentage}%` : "--"} tone="light" />
          <Stat label="Massa" value={assessment ? `${assessment.leanMass}kg` : "--"} tone="light" />
        </div>
      </section>
      <div className="mt-4">
        <WorkoutList canDelete studentId={student.id} workoutItems={data.workouts} />
      </div>
      <div className="mt-4">
        <StudentPaymentReview payments={finance.payments} />
      </div>
      <div className="mt-4">
        <PaymentList studentId={student.id} paymentItems={visiblePaymentHistory} />
      </div>
    </>
  );
}
