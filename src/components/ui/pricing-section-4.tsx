"use client";

import NumberFlow from "@number-flow/react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";

const plans = [
  {
    name: "Gratis",
    description: "Para comecar sem custo e validar a rotina com poucos alunos.",
    price: 0,
    period: "sempre",
    buttonText: "Comecar gratis",
    includes: ["Inclui:", "Ate 2 alunos gratuitos", "Prescricao de treinos", "Chat com aluno", "Financeiro basico"],
  },
  {
    name: "Mensal",
    description: "Para personais que querem escalar com alunos ilimitados.",
    price: 40,
    period: "mes",
    buttonText: "Assinar mensal",
    popular: true,
    badge: "Mais flexivel",
    includes: ["Inclui tudo do gratis, plus:", "Alunos ilimitados", "Treinos e acompanhamento sem limite", "Chat e comprovantes organizados", "Ideal para crescer mes a mes"],
  },
  {
    name: "Anual",
    description: "Melhor escolha para manter o ano organizado e economizar.",
    price: 420,
    period: "ano",
    buttonText: "Assinar anual",
    badge: "Melhor valor",
    includes: ["Inclui tudo do mensal, plus:", "Alunos ilimitados", "Economia de R$60 no ano", "Menos renovacoes e interrupcoes", "Base estavel para escalar alunos"],
  },
];

export default function PricingSection4() {
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.16,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <section id="precos" className="relative mx-auto min-h-screen overflow-hidden bg-black px-6 py-24 lg:px-8" ref={pricingRef}>
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0 h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px]" />
        <SparklesComp
          density={1000}
          direction="bottom"
          speed={0.8}
          color="#FFFFFF"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>

      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute left-0 top-[-114px] z-0 flex h-[113.625vh] w-full flex-col items-start justify-start overflow-hidden p-0"
      >
        <div
          className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] rounded-full"
          style={{
            border: "200px solid #0a84ff",
            filter: "blur(92px)",
            WebkitFilter: "blur(92px)",
          }}
        />
      </TimelineContent>

      <article className="relative z-20 mx-auto mb-10 max-w-3xl space-y-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7bbcff]">Precos</p>
        <h2 className="text-4xl font-semibold text-white md:text-5xl">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.08}
            staggerFrom="first"
            reverse
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            Escolha o plano do seu ritmo
          </VerticalCutReveal>
        </h2>

        <TimelineContent as="p" animationNum={0} timelineRef={pricingRef} customVariants={revealVariants} className="text-base leading-7 text-gray-300">
          Comece simples, renove quando fizer sentido e mantenha alunos, treinos e financeiro no mesmo lugar.
        </TimelineContent>
      </article>

      <div className="absolute left-[10%] top-0 z-0 h-full w-[80%] opacity-60 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(circle at center, #206ce8 0%, transparent 70%)" }} />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-4 py-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <TimelineContent key={plan.name} as="div" animationNum={2 + index} timelineRef={pricingRef} customVariants={revealVariants}>
            <Card
              className={`relative h-full overflow-hidden border-neutral-800 text-white ${
                plan.popular
                  ? "z-20 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 shadow-[0px_-13px_220px_0px_rgba(10,132,255,.55)]"
                  : "z-10 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950"
              }`}
            >
              {plan.badge ? (
                <div className="absolute right-4 top-4 rounded-full border border-blue-400/30 bg-blue-500/16 px-3 py-1 text-xs font-bold text-blue-100">
                  {plan.badge}
                </div>
              ) : null}

              <CardHeader className="text-left">
                <div className="flex justify-between">
                  <h3 className="mb-2 text-3xl font-semibold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline">
                  {plan.price === 0 ? (
                    <span className="text-5xl font-semibold tracking-[-0.04em]">Gratis</span>
                  ) : (
                    <>
                      <span className="text-lg font-semibold text-white/70">R$</span>
                      <NumberFlow value={plan.price} className="ml-1 text-5xl font-semibold tracking-[-0.04em]" />
                    </>
                  )}
                  <span className="ml-2 text-gray-300">/{plan.period}</span>
                </div>
                <p className="mb-4 text-sm leading-6 text-gray-300">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <Link
                  href="/register"
                  className={`mb-6 grid w-full place-items-center rounded-xl p-4 text-lg font-bold ${
                    plan.popular
                      ? "border border-blue-500 bg-gradient-to-t from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-800"
                      : "border border-neutral-800 bg-gradient-to-t from-neutral-950 to-neutral-700 text-white shadow-lg shadow-neutral-900"
                  }`}
                >
                  {plan.buttonText}
                </Link>

                <div className="space-y-3 border-t border-neutral-700 pt-4">
                  <h4 className="mb-3 text-base font-medium">{plan.includes[0]}</h4>
                  <ul className="space-y-2">
                    {plan.includes.slice(1).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-blue-300" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 mx-auto mt-5 max-w-2xl text-center text-sm leading-6 text-white/48"
      >
        O gratis libera ate 2 alunos. Mensal e anual liberam alunos ilimitados; no anual voce economiza R$60 em comparacao com 12 mensalidades.
      </motion.p>
    </section>
  );
}
