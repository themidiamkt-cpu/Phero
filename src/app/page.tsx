import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

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
      <section className="relative overflow-hidden bg-[#07111f]">
        <header className="absolute inset-x-0 top-0 z-40 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-white" aria-label="Phero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/phero-logo-transparent.png" alt="" className="size-11 object-contain drop-shadow-[0_10px_20px_rgba(10,132,255,.35)]" />
            <span className="text-lg font-bold tracking-[-0.03em]">Phero</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/78 md:flex">
            <a href="#personal">Personal</a>
            <a href="#aluno">Aluno</a>
            <a href="#fluxo">Fluxo</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-bold text-white/86 transition hover:bg-white/10">
              Entrar
            </Link>
            <Link href="/register" className="pressable hidden rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#07111f] shadow-[0_12px_30px_rgba(0,0,0,.20)] sm:inline-flex">
              Criar conta
            </Link>
          </div>
        </header>

        <ScrollExpandMedia
          mediaType="image"
          mediaSrc="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1280&auto=format&fit=crop"
          bgImageSrc="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop"
          title="Phero App"
          date="Gestao para personal e aluno"
          scrollToExpand="Role para expandir"
          textBlend
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--blue-ink)] shadow-sm backdrop-blur">
                <ShieldCheck className="size-4" />
                Plataforma completa
              </div>
              <h1 className="mt-7 text-5xl font-bold leading-[0.96] tracking-[-0.05em] text-[#0f1117] md:text-7xl">
                Treinos, alunos e financeiro em um app so.
              </h1>
              <p className="mt-7 max-w-xl text-lg font-medium leading-8 text-neutral-600">
                O Phero conecta o personal e o aluno em uma rotina simples: prescricao, acompanhamento, evolucao, chat e pagamentos com tudo organizado no mesmo lugar.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="pressable inline-flex h-14 items-center justify-center gap-2 rounded-full bg-[var(--blue)] px-7 text-base font-bold text-white shadow-[0_18px_36px_rgba(10,132,255,.30)]">
                  Comecar agora
                  <ArrowRight className="size-5" />
                </Link>
                <Link href="/login" className="pressable inline-flex h-14 items-center justify-center rounded-full border border-white/90 bg-white/80 px-7 text-base font-bold text-neutral-800 shadow-sm backdrop-blur">
                  Acessar minha conta
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-white/80 bg-white/78 p-4 shadow-[0_34px_90px_rgba(16,18,24,.16)] backdrop-blur-xl">
                <div className="rounded-[20px] border border-[#dde7f4] bg-[#f7f9fc] p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-[#e3e8ef] pb-4">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/phero-logo-transparent.png" alt="" className="size-12 object-contain" />
                      <div>
                        <p className="text-sm font-bold">Painel Phero</p>
                        <p className="text-xs font-semibold text-neutral-500">Visao do personal</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-[var(--green-wash)] px-3 py-1 text-xs font-bold text-[var(--green)]">Ativo</div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[0.66fr_0.34fr]">
                    <div className="grid gap-4">
                      <div className="rounded-[8px] bg-[#0e2034] p-5 text-white">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.13em] text-white/50">Hoje</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em]">7 alunos em acompanhamento</h2>
                          </div>
                          <Activity className="size-6 text-[var(--green)]" />
                        </div>
                        <div className="mt-6 h-2 rounded-full bg-white/10">
                          <div className="h-2 w-[82%] rounded-full bg-[var(--green)]" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-white/62">82% de adesao na semana</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <PreviewMetric label="Treinos" value="38" tone="blue" />
                        <PreviewMetric label="Pagos" value="18" tone="green" />
                        <PreviewMetric label="Pend." value="3" tone="amber" />
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <PreviewTask icon={<Users className="size-5" />} title="Roberto Franca" detail="Treino atualizado" />
                      <PreviewTask icon={<Wallet className="size-5" />} title="Comprovante" detail="Aguardando analise" />
                      <PreviewTask icon={<MessageCircle className="size-5" />} title="Chat" detail="2 mensagens novas" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 right-6 hidden w-56 rounded-[30px] border border-white/80 bg-[#111114] p-3 shadow-[0_28px_70px_rgba(16,18,24,.30)] xl:block">
                <div className="rounded-[24px] bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-neutral-400">Aluno</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.04em]">Treino do dia</h3>
                  <div className="mt-4 rounded-[8px] bg-[var(--blue-wash)] p-3">
                    <Dumbbell className="size-5 text-[var(--blue)]" />
                    <p className="mt-3 text-sm font-bold">Forca inferior</p>
                    <p className="mt-1 text-xs font-semibold text-neutral-500">45 min · 6 exercicios</p>
                  </div>
                  <div className="mt-3 h-11 rounded-full bg-[var(--blue)] text-center text-sm font-bold leading-[44px] text-white">Iniciar</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollExpandMedia>
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

function PreviewMetric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "amber" }) {
  const tones = {
    blue: "bg-[var(--blue-wash)] text-[var(--blue)]",
    green: "bg-[var(--green-wash)] text-[var(--green)]",
    amber: "bg-[var(--amber-wash)] text-[var(--amber)]",
  };

  return (
    <div className={`rounded-[8px] p-4 ${tones[tone]}`}>
      <p className="font-mono text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] opacity-70">{label}</p>
    </div>
  );
}

function PreviewTask({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-[8px] border border-[#e3e8ef] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-[#f0f5fb] text-[var(--blue)]">{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{title}</p>
          <p className="mt-1 truncate text-xs font-semibold text-neutral-500">{detail}</p>
        </div>
      </div>
    </div>
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
