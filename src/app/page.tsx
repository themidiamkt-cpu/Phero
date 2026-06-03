import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  Users,
} from "lucide-react";
import PricingSection4 from "@/components/ui/pricing-section-4";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

const trainerFeatures = [
  "Cadastro e acompanhamento de alunos",
  "Prescricao de treinos de forca, corrida e modelos prontos",
  "Financeiro com comprovantes, status e liberacao de acesso",
  "Avaliacoes fisicas, fotos, medidas e historico de evolucao",
];

const studentFeatures = [
  "Treino do dia com instrucoes claras",
  "Corrida, evolucao e financeiro no mesmo lugar",
  "Chat direto com o personal",
  "Perfil, metas e progresso sempre acessiveis",
];

const workflow = [
  { icon: Users, title: "Organize a carteira", text: "Cadastre alunos, planos, dados de contato e objetivos em uma rotina simples de acompanhar." },
  { icon: Dumbbell, title: "Entregue o treino", text: "Monte prescricoes individuais, reaproveite modelos e deixe o aluno acessar tudo pelo app." },
  { icon: BarChart3, title: "Acompanhe resultado", text: "Veja frequencia, avaliacoes, financeiro e pendencias antes que virem retrabalho." },
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f4f7fb] text-[#101217]">
      <section className="relative overflow-hidden bg-[#030303]">
        <header className="absolute inset-x-0 top-0 z-40 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-white" aria-label="Phero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/phero-logo-transparent.png" alt="" className="size-11 object-contain drop-shadow-[0_10px_20px_rgba(10,132,255,.35)]" />
            <span className="text-lg font-bold tracking-[-0.03em]">Phero</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/68 md:flex">
            <a href="#personal">Personal</a>
            <a href="#aluno">Aluno</a>
            <a href="#fluxo">Fluxo</a>
            <a href="#precos">Precos</a>
          </nav>
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-bold text-white/86 transition hover:bg-white/10">
            Entrar
          </Link>
        </header>

        <HeroGeometric
          badge="Phero para personal e aluno"
          title1="Treinos, alunos"
          title2="e financeiro"
          description="Prescreva treinos, acompanhe evolucao, organize pagamentos e mantenha personal e aluno conectados em uma rotina simples."
        >
          <div className="mx-auto flex max-w-xl flex-col justify-center gap-3 px-4 sm:flex-row">
            <Link href="/register" className="pressable inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--blue)] px-7 text-base font-bold text-white shadow-[0_18px_36px_rgba(10,132,255,.30)]">
              Comecar agora
              <ArrowRight className="size-5" />
            </Link>
            <Link href="/login" className="pressable inline-flex h-14 items-center justify-center rounded-full border border-white/12 bg-white/8 px-7 text-base font-bold text-white/86 backdrop-blur hover:bg-white/12">
              Acessar minha conta
            </Link>
          </div>
        </HeroGeometric>
      </section>

      <section id="personal" className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2 lg:px-8">
        <FeaturePanel
          eyebrow="Para personal"
          title="Controle operacional sem virar planilha."
          text="Gerencie alunos, treinos, modelos prontos, avaliacoes e pagamentos em uma experiencia pensada para rotina de consultoria."
          items={trainerFeatures}
        />
        <FeaturePanel
          id="aluno"
          eyebrow="Para aluno"
          title="Tudo que o aluno precisa para seguir o plano."
          text="O aluno ve o treino certo, acompanha a propria evolucao, envia comprovante e chama o personal sem depender de mensagens soltas."
          items={studentFeatures}
        />
      </section>

      <section id="fluxo" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">Fluxo de trabalho</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.05em] md:text-5xl">Do cadastro ao acompanhamento, sem perder contexto.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[8px] border border-[#e7e7eb] bg-[#fbfcfe] p-6 shadow-[0_1px_2px_rgba(16,18,24,.04)]">
                  <div className="grid size-12 place-items-center rounded-[8px] bg-[var(--blue-wash)] text-[var(--blue)]">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-bold tracking-[-0.03em]">{item.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-neutral-600">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <PricingSection4 />

      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[8px] bg-[#0e2034] p-8 text-white md:flex-row md:items-center lg:p-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/45">Phero</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.04em] md:text-4xl">Comece com seu primeiro aluno e deixe o app guiar a rotina.</h2>
          </div>
          <Link href="/register" className="pressable inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-bold text-[#0e2034]">
            Criar conta
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeaturePanel({
  id,
  eyebrow,
  title,
  text,
  items,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  text: string;
  items: string[];
}) {
  return (
    <article id={id} className="rounded-[8px] border border-white/80 bg-white p-8 shadow-[0_18px_50px_rgba(16,18,24,.08)]">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--blue)]">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.05em]">{title}</h2>
      <p className="mt-5 text-base font-medium leading-8 text-neutral-600">{text}</p>
      <ul className="mt-7 grid gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm font-bold text-neutral-700">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--green)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
