import type { ReactNode } from "react";
import { Activity, CreditCard, Users, UserCheck } from "lucide-react";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { getMvpData } from "@/lib/data";
import type { Payment } from "@/lib/types";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  maximumFractionDigits: 0,
  style: "currency",
});

const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short" });

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function paymentMonthKey(payment: Payment) {
  const date = new Date(`${payment.dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return monthKey(date);
}

function getLastSevenMonths(payments: Payment[]) {
  const now = new Date();
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (6 - index), 1);
    return {
      key: monthKey(date),
      label: monthLabel.format(date).replace(".", ""),
      total: 0,
    };
  });

  for (const payment of payments) {
    const bucket = buckets.find((item) => item.key === paymentMonthKey(payment));
    if (bucket) bucket.total += payment.amount;
  }

  return buckets;
}

export default async function AdminDashboardPage() {
  const data = await getMvpData();
  const activeTrainers = data.trainers.filter((trainer) => trainer.approved && !trainer.blocked).length;
  const pendingTrainers = data.trainers.filter((trainer) => !trainer.approved).length;
  const activeStudents = data.students.filter((student) => student.accessStatus === "active").length;
  const blockedStudents = data.students.filter((student) => student.accessStatus === "blocked").length;
  const activeWorkouts = data.workouts.filter((workout) => workout.status !== "done").length;
  const approvedPayments = data.payments.filter((payment) => payment.status === "approved" || payment.status === "paid");
  const pendingPayments = data.payments.filter((payment) => payment.status === "waiting_analysis" || payment.status === "pending_review").length;
  const monthlyRevenue = getLastSevenMonths(approvedPayments);
  const totalRevenue = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="mx-auto max-w-md px-5 pb-10 pt-7">
      <header className="pb-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl">PHERO · Plataforma</p>
              <h1 className="mt-2 text-[34px] font-bold leading-none tracking-[-0.04em] text-[var(--ink)]">Admin</h1>
            </div>
            <Badge tone="success" dot>Sistema ok</Badge>
          </div>
          <p className="mt-4 text-sm font-medium leading-6 text-[var(--ink-3)]">Operacao, assinaturas e saude da plataforma em uma tela limpa.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Metric icon={<UserCheck className="size-5" />} label="Personais" value={String(activeTrainers)} detail="Ativos na plataforma" />
        <Metric icon={<Users className="size-5" />} label="Alunos" value={String(activeStudents)} detail="Com acesso liberado" />
        <Metric icon={<CreditCard className="size-5" />} label="Pagamentos" value={money.format(totalRevenue)} detail="Aprovados no banco" />
        <Metric icon={<Activity className="size-5" />} label="Novos 30d" value={String(activeWorkouts)} detail="Treinos ativos" />
      </section>

      <section className="mt-6 grid gap-5">
        <RevenueCard months={monthlyRevenue} total={totalRevenue} />

        <Card className="p-0">
          <div className="border-b border-[var(--hair)] p-5">
            <p className="lbl">Personais</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--ink)]">Status da operacao</h2>
          </div>
          <div className="divide-y divide-[var(--hair)]">
            <QueueRow title="Personais pendentes" detail="Aguardando aprovacao" value={String(pendingTrainers)} />
            <QueueRow title="Alunos bloqueados" detail="Dependem de liberacao do personal" value={String(blockedStudents)} />
            <QueueRow title="Comprovantes" detail="Pagamentos em analise manual" value={String(pendingPayments)} />
            <QueueRow title="Treinos ativos" detail="Criados no banco" value={String(activeWorkouts)} />
          </div>
        </Card>
      </section>
    </div>
  );
}

function RevenueCard({ months, total }: { months: Array<{ key: string; label: string; total: number }>; total: number }) {
  const max = Math.max(...months.map((month) => month.total), 0);
  const hasRevenue = total > 0;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="lbl">Receita registrada</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--ink)]">Ultimos 7 meses</h2>
        </div>
        <Badge tone={hasRevenue ? "blue" : "neutral"}>{hasRevenue ? "Real" : "Sem dados"}</Badge>
      </div>

      {hasRevenue ? (
        <div className="mt-7 grid gap-4">
          <div>
            <p className="mono tnum text-3xl font-bold text-[var(--ink)]">{money.format(total)}</p>
            <p className="mt-1 text-sm font-medium text-[var(--ink-3)]">Soma dos pagamentos aprovados neste periodo.</p>
          </div>
          <div className="grid gap-3">
            {months.map((month) => (
              <div key={month.key} className="grid grid-cols-[38px_1fr_70px] items-center gap-3">
                <span className="mono text-xs font-bold uppercase text-[var(--ink-3)]">{month.label}</span>
                <ProgressBar value={max ? (month.total / max) * 100 : 0} />
                <span className="mono tnum text-right text-xs font-bold text-[var(--ink)]">{money.format(month.total)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-[18px] border border-dashed border-[var(--hair)] bg-[var(--surface-2)] p-6 text-center">
          <p className="text-base font-bold text-[var(--ink)]">Nenhuma receita aprovada ainda</p>
          <p className="mt-2 text-sm font-medium leading-6 text-[var(--ink-3)]">Quando um pagamento for aprovado no banco, ele aparece aqui automaticamente.</p>
        </div>
      )}
    </Card>
  );
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-neutral-500">
        {icon}
        <span className="lbl">{label}</span>
      </div>
      <p className="mt-7 mono text-3xl font-bold text-[var(--ink)]">{value}</p>
      <p className="mt-2 text-sm font-medium text-[var(--ink-3)]">{detail}</p>
    </Card>
  );
}

function QueueRow({ title, detail, value }: { title: string; detail: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div>
        <h3 className="text-sm font-bold text-[var(--ink)]">{title}</h3>
        <p className="mt-1 text-xs font-medium text-[var(--ink-3)]">{detail}</p>
      </div>
      <span className="mono text-lg font-bold text-[var(--ink)]">{value}</span>
    </div>
  );
}
