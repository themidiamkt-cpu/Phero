import Link from "next/link";
import { Activity, BarChart3, CalendarDays, MessageCircle } from "lucide-react";
import { canStudentOpenWorkouts, getCurrentProfile } from "@/lib/auth";
import { billingStatusLabel, isSubscriptionBlocked } from "@/lib/billing-status";
import { money } from "@/lib/mock-data";
import { Badge, Card, Metric, PageHeader, ProgressBar, Stat } from "@/components/ui";
import { TodayWorkoutCard } from "@/components/mvp-widgets";
import { getMvpData, getStudentFinanceData } from "@/lib/data";

export default async function AlunoHomePage() {
  const profile = await getCurrentProfile();
  const [data, finance] = await Promise.all([getMvpData(), getStudentFinanceData(profile.id)]);
  const studentBase = data.students.find((item) => item.id === profile.id) ?? data.students[0];
  const student = { ...profile, ...studentBase };
  const studentWorkouts = data.workouts.filter((workout) => workout.studentId === student.id);
  const completedWorkouts = studentWorkouts.filter((workout) => workout.status === "done").length;
  const { plan, subscription } = finance;
  const canTrain = canStudentOpenWorkouts(student.paymentStatus, student.accessStatus) && !isSubscriptionBlocked(subscription);
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" })
    .format(new Date())
    .replace(".", "")
    .replace("-feira", "");

  return (
    <>
      <PageHeader eyebrow={today} title={`Ola, ${student.name.split(" ")[0]}`} showBack={false} />
      <section className="grid grid-cols-3 gap-3 px-5">
        <Stat label="Treinos" value={String(studentWorkouts.length)} tone="blue" />
        <Stat label="Sequencia" value={String(completedWorkouts)} tone="amber" />
        <Stat label="Fatura" value={subscription?.nextDueDate.slice(5) ?? "--"} tone="green" />
      </section>
      <div className="mt-5">
        <TodayWorkoutCard locked={!canTrain} items={data.workouts} studentId={student.id} />
      </div>
      <section className="mt-5 grid grid-cols-2 gap-3 px-5">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-[var(--blue-wash)] text-[var(--blue)]">
              <BarChart3 className="size-5" />
            </div>
            <Badge tone={completedWorkouts > 0 ? "success" : "neutral"}>{completedWorkouts}/{studentWorkouts.length}</Badge>
          </div>
          <h2 className="mt-5 text-sm font-bold">Frequencia</h2>
          <ProgressBar className="mt-3" value={studentWorkouts.length ? (completedWorkouts / studentWorkouts.length) * 100 : 0} tone="blue" />
          <p className="mt-3 text-xs font-medium text-[var(--ink-3)]">Semana atual</p>
        </Card>
        <Card>
          <div className="grid size-10 place-items-center rounded-[14px] bg-[var(--green-wash)] text-[var(--green)]">
            <Activity className="size-5" />
          </div>
          <div className="mt-5">
            <Metric value="82" unit="%" label="adesao" tone="green" />
          </div>
        </Card>
      </section>
      <section className="mt-5 px-5">
        <Card>
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-[14px] bg-[var(--amber-wash)] text-[var(--amber)]">
              <CalendarDays className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold">Meta atual</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-3)]">{student.goal || "Objetivo ainda nao definido pelo personal."}</p>
            </div>
          </div>
        </Card>
      </section>
      <section className="mt-5 px-5">
        <Link href="/app/aluno/chat">
          <Card className="pressable">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-[14px] bg-[var(--blue-wash)] text-[var(--blue)]">
                <MessageCircle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">Falar com personal</h2>
                <p className="mt-1 text-sm text-neutral-500">Tire duvidas sobre exercicios e ajustes do treino.</p>
              </div>
            </div>
          </Card>
        </Link>
      </section>
      <section className="mt-5 px-5">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Resumo de treino</h2>
              <p className="mt-1 text-sm text-neutral-500">Plano {plan?.name} · {plan ? money(plan.price) : ""}</p>
            </div>
            <Badge tone={canTrain ? "success" : "danger"}>{billingStatusLabel(subscription)}</Badge>
          </div>
          <p className="mt-4 text-sm font-medium text-neutral-500">{completedWorkouts} de {studentWorkouts.length} treinos concluidos.</p>
        </Card>
      </section>
    </>
  );
}
