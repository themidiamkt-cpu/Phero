import type { ReactNode } from "react";
import { AlertTriangle, Bell, Dumbbell, UserPlus, Users } from "lucide-react";
import { Avatar, Badge, Card, Metric } from "@/components/ui";
import { money } from "@/lib/mock-data";
import { getCurrentProfile } from "@/lib/auth";
import { getMvpData } from "@/lib/data";

export default async function PersonalDashboardPage() {
  const profile = await getCurrentProfile();
  const data = await getMvpData();
  const trainerStudents = data.students.filter((student) => student.personalId === profile.id);
  const trainerPayments = data.payments.filter((payment) => payment.personalId === profile.id);
  const trainerWorkouts = data.workouts.filter((workout) => workout.personalId === profile.id);
  const revenue = trainerPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const blocked = trainerStudents.filter((student) => student.accessStatus === "blocked").length;
  const overdue = trainerPayments.filter((payment) => payment.status === "overdue").length;
  const done = trainerWorkouts.filter((workout) => workout.status === "done").length;
  const activeStudents = trainerStudents.filter((student) => student.accessStatus === "active").length;
  const attentionItems = trainerStudents
    .filter((student) => student.accessStatus === "blocked" || student.paymentStatus === "overdue" || student.paymentStatus === "waiting_analysis")
    .slice(0, 3);
  const firstName = profile.name.split(" ")[0] || "Personal";

  return (
    <>
      <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-7">
        <div>
          <p className="lbl">{profile.role === "personal" ? "Painel do personal" : "Painel"}</p>
          <h1 className="mt-1 text-[29px] font-bold leading-none tracking-[-0.03em] text-[var(--ink)]">Ola, {firstName}</h1>
        </div>
        <button className="pressable relative grid size-12 place-items-center rounded-full border border-[var(--hair)] bg-white shadow-[var(--shadow-card)]" aria-label="Notificacoes">
          <Bell className="size-5" />
          {attentionItems.length ? <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-[var(--red)] text-[10px] font-bold text-white">{attentionItems.length}</span> : null}
        </button>
      </header>

      <section className="px-5">
        <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#11243d,#071526)] p-5 text-white shadow-[0_20px_44px_rgba(8,21,38,.28)]">
          <p className="lbl text-white/45">Receita do mes · Maio</p>
          <div className="mt-5 flex items-end gap-2">
            <span className="pb-1 text-sm font-bold text-white/55">R$</span>
            <span className="mono tnum text-[36px] font-bold leading-none tracking-[-0.06em]">{money(revenue).replace("R$", "").trim()}</span>
          </div>
          <div className="mt-8 flex h-12 items-end gap-2">
            {[42, 58, 45, 70, 62, 78, 66].map((height, index) => (
              <div key={index} className="flex-1 rounded-t-[7px] bg-[var(--blue)]" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 px-5">
        <DashboardMetric icon={<Users className="size-5" />} tone="blue" value={String(activeStudents)} label="Alunos ativos" detail={`${trainerStudents.length} cadastrados`} />
        <DashboardMetric icon={<AlertTriangle className="size-5" />} tone="red" value={String(overdue || blocked)} label="Atrasados" detail={`${money(trainerPayments.filter((payment) => payment.status === "overdue").reduce((sum, payment) => sum + payment.amount, 0))} em aberto`} />
        <DashboardMetric icon={<Dumbbell className="size-5" />} tone="green" value={String(done)} label="Treinos" detail={`${trainerWorkouts.length} prescritos`} />
        <DashboardMetric icon={<UserPlus className="size-5" />} tone="amber" value="0" label="Cobranças" detail="CRM sem leads reais" />
      </section>

      <section className="mt-6 px-5">
        <p className="lbl mb-3">Precisa de atencao</p>
        <Card className="p-0">
          {attentionItems.length ? (
            attentionItems.map((student, index) => (
              <div key={student.id}>
                <div className="flex items-center gap-3 p-4">
                  <Avatar name={student.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold">{student.name}</h2>
                    <p className="mt-1 truncate text-xs font-medium text-neutral-500">
                      {student.paymentStatus === "waiting_analysis" ? "Comprovante em analise" : student.accessStatus === "blocked" ? "Pagamento pendente" : student.goal}
                    </p>
                  </div>
                  <Badge tone={student.accessStatus === "blocked" ? "warning" : "blue"}>
                    {student.accessStatus === "blocked" ? "Atenção" : "Revisar"}
                  </Badge>
                </div>
                {index < attentionItems.length - 1 ? <div className="mx-4 h-px bg-[var(--hair)]" /> : null}
              </div>
            ))
          ) : (
            <div className="p-4">
              <p className="text-sm font-semibold text-neutral-600">Nenhum aluno precisa de atencao agora.</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Alertas aparecem aqui quando houver pendencias reais.</p>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}

function DashboardMetric({
  icon,
  tone,
  value,
  label,
  detail,
}: {
  icon: ReactNode;
  tone: "blue" | "red" | "green" | "amber";
  value: string;
  label: string;
  detail: string;
}) {
  return (
    <Card className="min-h-[118px] p-4">
      <div className={iconBg(tone)}>{icon}</div>
      <Metric value={value} label={label} tone={tone} />
      <p className="mt-2 text-xs font-medium text-neutral-500">{detail}</p>
    </Card>
  );
}

function iconBg(tone: "blue" | "red" | "green" | "amber") {
  return {
    blue: "mb-4 grid size-10 place-items-center rounded-[14px] bg-[var(--blue-wash)] text-[var(--blue)]",
    red: "mb-4 grid size-10 place-items-center rounded-[14px] bg-[var(--red-wash)] text-[var(--red)]",
    green: "mb-4 grid size-10 place-items-center rounded-[14px] bg-[var(--green-wash)] text-[var(--green)]",
    amber: "mb-4 grid size-10 place-items-center rounded-[14px] bg-[var(--amber-wash)] text-[var(--amber)]",
  }[tone];
}
