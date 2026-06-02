"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Plan, Subscription } from "@/lib/types";

function todayISODate() {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date());
}

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const target = new Date(date);
  target.setDate(1);
  target.setMonth(target.getMonth() + months);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

function addDays(date: Date, days: number) {
  const target = new Date(date);
  target.setDate(target.getDate() + days);
  return target;
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateNextDueDate(startDate: string, plan?: Plan) {
  if (!startDate || !plan) return "";
  const date = new Date(`${startDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  const cycle = plan.billingCycle.toLowerCase();

  if (cycle.includes("semanal")) return toISODate(addDays(date, 7));
  if (cycle.includes("trimestral")) return toISODate(addMonthsClamped(date, 3));
  if (cycle.includes("semestral")) return toISODate(addMonthsClamped(date, 6));
  if (cycle.includes("anual")) return toISODate(addMonthsClamped(date, 12));
  if (cycle.includes("personalizado")) return toISODate(addDays(date, plan.customDays ?? 30));
  return toISODate(addMonthsClamped(date, 1));
}

function formatDate(date: string) {
  if (!date) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

export function StudentPlanForm({
  currentSubscription,
  plans,
  studentId,
}: {
  currentSubscription: Subscription | null;
  plans: Plan[];
  studentId: string;
}) {
  const router = useRouter();
  const [planId, setPlanId] = useState(currentSubscription?.planId || plans[0]?.id || "");
  const [startDate, setStartDate] = useState(todayISODate());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedPlan = plans.find((plan) => plan.id === planId);
  const nextDueDate = calculateNextDueDate(startDate, selectedPlan);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!planId || !startDate) {
      setMessage("Selecione um plano e informe a data inicial.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/students/${studentId}/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, startDate }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Nao foi possivel salvar o plano.");
      }

      setMessage("Plano do aluno atualizado.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o plano.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-4 grid gap-3">
      <label className="grid gap-2 text-sm font-semibold text-neutral-700">
        Plano do aluno
        <select
          className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
          disabled={!plans.length}
          onChange={(event) => setPlanId(event.target.value)}
          value={planId}
        >
          {!plans.length ? <option>Nenhum plano cadastrado</option> : null}
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(plan.price)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-semibold text-neutral-700">
        Data inicial
        <input
          className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
          onChange={(event) => setStartDate(event.target.value)}
          type="date"
          value={startDate}
        />
      </label>

      {selectedPlan ? (
        <p className="text-xs font-medium text-neutral-500">
          Plano selecionado: {selectedPlan.billingCycle}
          {selectedPlan.customDays ? ` · ${selectedPlan.customDays} dias` : ""}
          {" · "}
          Primeira fatura: {formatDate(nextDueDate)}
        </p>
      ) : null}

      <button
        className="pressable flex h-11 items-center justify-center gap-2 rounded-[13px] bg-[var(--blue)] text-sm font-bold text-white disabled:opacity-60"
        disabled={saving || !plans.length}
      >
        <Save className="size-4" />
        {saving ? "Salvando..." : "Salvar plano"}
      </button>

      {message ? <p className="text-sm font-semibold text-[var(--ink-2)]">{message}</p> : null}
    </form>
  );
}
