"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CircleHelp, X } from "lucide-react";
import { cn } from "@/components/ui";
import type { UserRole } from "@/lib/types";

type TourRole = Extract<UserRole, "aluno" | "personal">;

type TourStep = {
  title: string;
  body: string;
  route?: string;
};

const tourSteps: Record<TourRole, TourStep[]> = {
  aluno: [
    {
      title: "Bem-vindo ao Phero",
      body: "Aqui voce acompanha seus treinos, pagamentos, corrida, evolucao e conversa com seu personal.",
      route: "/app/aluno/home",
    },
    {
      title: "Home",
      body: "A primeira tela mostra o treino do dia, sua frequencia, meta atual e um resumo rapido do plano.",
      route: "/app/aluno/home",
    },
    {
      title: "Treinos",
      body: "Em Treinos ficam os exercicios prescritos pelo personal. Abra cada treino para ver series, repeticoes e orientacoes.",
      route: "/app/aluno/treinos",
    },
    {
      title: "Corrida",
      body: "A area de Corrida organiza treinos livres e prescritos para registrar sua evolucao fora da musculacao.",
      route: "/app/aluno/corrida",
    },
    {
      title: "Evolucao",
      body: "Em Evolucao voce acompanha avaliacoes, medidas e fotos cadastradas ao longo do acompanhamento.",
      route: "/app/aluno/evolucao",
    },
    {
      title: "Financeiro",
      body: "No Financeiro ficam mensalidades, vencimentos e envio de comprovantes quando o pagamento precisar de analise.",
      route: "/app/aluno/financeiro",
    },
    {
      title: "Chat",
      body: "Use o chat para tirar duvidas sobre exercicios, ajustes de carga e combinados com o personal.",
      route: "/app/aluno/chat",
    },
    {
      title: "Perfil",
      body: "O Perfil guarda seus dados principais. Mantenha telefone e objetivo atualizados para o personal acompanhar melhor.",
      route: "/app/aluno/perfil",
    },
    {
      title: "Acesso aos treinos",
      body: "Se houver pendencia financeira, alguns treinos podem ficar bloqueados ate a liberacao do pagamento.",
      route: "/app/aluno/home",
    },
    {
      title: "Pronto",
      body: "Quando quiser rever este guia, toque no botao de ajuda no canto superior direito do app.",
      route: "/app/aluno/home",
    },
  ],
  personal: [
    {
      title: "Bem-vindo ao painel",
      body: "Aqui voce gerencia alunos, treinos, exercicios, financeiro e seu perfil profissional.",
      route: "/app/personal/dashboard",
    },
    {
      title: "Dashboard",
      body: "O painel resume sua operacao: alunos, proximas acoes, indicadores e atalhos para acompanhar a rotina.",
      route: "/app/personal/dashboard",
    },
    {
      title: "Alunos",
      body: "Em Alunos voce cadastra novos alunos, acessa detalhes, define objetivos e acompanha o status de cada um.",
      route: "/app/personal/alunos",
    },
    {
      title: "Ficha do aluno",
      body: "Dentro de cada aluno ficam perfil, treinos, avaliacoes, financeiro e historico do acompanhamento.",
      route: "/app/personal/alunos",
    },
    {
      title: "Treinos",
      body: "Use Treinos para montar prescricoes individuais, revisar planos criados e organizar a entrega para o aluno.",
      route: "/app/personal/treinos",
    },
    {
      title: "Treinos prontos",
      body: "A biblioteca de treinos prontos ajuda a reaproveitar modelos e acelerar novas prescricoes.",
      route: "/app/personal/treinos-prontos",
    },
    {
      title: "Exercicios",
      body: "Em Exercicios voce cria movimentos, corridas e sequencias para usar nos treinos dos alunos.",
      route: "/app/personal/exercicios",
    },
    {
      title: "Financeiro",
      body: "No Financeiro voce acompanha planos, mensalidades, comprovantes enviados e bloqueios ou liberacoes de acesso.",
      route: "/app/personal/financeiro",
    },
    {
      title: "Perfil",
      body: "No Perfil ficam seus dados, chave PIX, planos, valor por hora e codigo de convite para novos alunos.",
      route: "/app/personal/perfil",
    },
    {
      title: "Pronto",
      body: "Quando quiser rever este guia, toque no botao de ajuda no canto superior direito do app.",
      route: "/app/personal/dashboard",
    },
  ],
};

function storageKey(role: TourRole) {
  return `phero-tour-${role}-completed`;
}

export function OnboardingTour({ role }: { role: TourRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const steps = useMemo(() => tourSteps[role], [role]);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(localStorage.getItem(storageKey(role)) !== "true");
      setStepIndex(0);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [role]);

  function showTour() {
    setStepIndex(0);
    setOpen(true);
  }

  function closeTour(completed = false) {
    if (completed) {
      localStorage.setItem(storageKey(role), "true");
    }
    setOpen(false);
  }

  function goTo(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), steps.length - 1);
    const nextStep = steps[nextIndex];
    setStepIndex(nextIndex);
    if (nextStep.route && nextStep.route !== pathname) {
      router.push(nextStep.route);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={showTour}
        className="pressable fixed right-[calc(50%-13rem)] top-20 z-30 grid size-11 place-items-center rounded-full border border-[var(--hair)] bg-white/95 text-[var(--ink)] shadow-[var(--shadow-card)] backdrop-blur max-[440px]:right-5"
        aria-label="Abrir passo a passo"
        title="Passo a passo"
      >
        <CircleHelp className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-20 backdrop-blur-[2px]">
          <section
            className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-5 text-[var(--ink)] shadow-[var(--shadow-pop)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tour-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--blue)]">
                  {stepIndex + 1}/{steps.length}
                </p>
                <h2 id="tour-title" className="mt-2 text-2xl font-bold leading-tight tracking-[-0.03em]">
                  {step.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => closeTour()}
                className="pressable grid size-10 shrink-0 place-items-center rounded-full border border-[var(--hair)] text-[var(--ink-2)]"
                aria-label="Fechar passo a passo"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-10 gap-1" aria-hidden="true">
              {steps.map((item, index) => (
                <span
                  key={`${item.title}-${index}`}
                  className={cn("h-1.5 rounded-full", index <= stepIndex ? "bg-[var(--blue)]" : "bg-[var(--surface-2)]")}
                />
              ))}
            </div>

            <p className="mt-5 text-[15px] font-medium leading-7 text-[var(--ink-2)]">{step.body}</p>

            {step.route && step.route !== pathname ? (
              <button
                type="button"
                onClick={() => router.push(step.route)}
                className="pressable mt-5 h-11 w-full rounded-[14px] border border-[var(--hair)] bg-[var(--blue-wash)] text-sm font-bold text-[var(--blue-ink)]"
              >
                Ver tela deste passo
              </button>
            ) : null}

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => goTo(stepIndex - 1)}
                className="pressable grid size-12 place-items-center rounded-[14px] border border-[var(--hair)] text-[var(--ink-2)] disabled:opacity-35"
                aria-label="Passo anterior"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => closeTour(true)}
                className="pressable h-12 flex-1 rounded-[14px] border border-[var(--hair)] px-4 text-sm font-bold text-[var(--ink-3)]"
              >
                Pular
              </button>
              <button
                type="button"
                onClick={() => (isLast ? closeTour(true) : goTo(stepIndex + 1))}
                className="pressable flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.32)]"
              >
                {isLast ? "Concluir" : "Proximo"}
                {!isLast ? <ChevronRight className="size-4" /> : null}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
