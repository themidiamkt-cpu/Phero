import type { ReactNode } from "react";
import { Activity, CreditCard, Users, UserCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { students, trainers, workouts } from "@/lib/mock-data";

const chartPoints = "6,86 22,78 38,72 54,56 70,48 86,36 102,30";

export default function AdminDashboardPage() {
  const activeTrainers = trainers.filter((trainer) => trainer.approved && !trainer.blocked).length;
  const activeStudents = students.filter((student) => student.accessStatus === "active").length;
  const activeWorkouts = workouts.filter((workout) => workout.status !== "done").length;

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
        <Metric icon={<CreditCard className="size-5" />} label="Receita plataf." value="R$ 0" detail="Billing real" />
        <Metric icon={<Activity className="size-5" />} label="Novos 30d" value={String(activeWorkouts)} detail="Treinos ativos" />
      </section>

      <section className="mt-6 grid gap-5">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="lbl">Receita recorrente</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--ink)]">Ultimos 7 meses</h2>
            </div>
            <Badge tone="blue">SaaS</Badge>
          </div>

          <svg viewBox="0 0 108 112" className="mt-8 h-56 w-full" aria-label="Grafico de atividade semanal">
            <path d="M6 96 L22 78 L38 72 L54 56 L70 48 L86 36 L102 30 L102 100 L6 100 Z" fill="rgba(10,132,255,.12)" />
            <line x1="6" x2="102" y1="96" y2="96" stroke="#e7e7eb" strokeWidth="1" />
            <line x1="6" x2="102" y1="64" y2="64" stroke="#efeff2" strokeWidth="1" />
            <line x1="6" x2="102" y1="32" y2="32" stroke="#efeff2" strokeWidth="1" />
            <polyline points={chartPoints} fill="none" stroke="#0A84FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            <circle cx="102" cy="30" r="3" fill="#0A84FF" stroke="#fff" strokeWidth="2" />
          </svg>
        </Card>

        <Card className="p-0">
          <div className="border-b border-[var(--hair)] p-5">
            <p className="lbl">Personais</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--ink)]">Status da operacao</h2>
          </div>
          <div className="divide-y divide-[var(--hair)]">
            <QueueRow title="Personais pendentes" detail="Aguardando aprovacao ou assinatura" value="0" />
            <QueueRow title="Alunos bloqueados" detail="Dependem de liberacao do personal" value="0" />
            <QueueRow title="Comprovantes" detail="Pagamentos em analise manual" value="0" />
            <QueueRow title="Treinos globais" detail="Modelos prontos para revisar" value="8" />
          </div>
        </Card>
      </section>
    </div>
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
