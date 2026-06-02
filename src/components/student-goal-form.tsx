"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Card } from "@/components/ui";

export function StudentGoalForm({ initialGoal, studentId }: { initialGoal?: string; studentId: string }) {
  const router = useRouter();
  const [goal, setGoal] = useState(initialGoal === "Sem objetivo cadastrado" ? "" : initialGoal ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/students/${studentId}/goal`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Nao foi possivel salvar o objetivo.");
      }

      setMessage("Objetivo salvo.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o objetivo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <p className="lbl">Objetivo do aluno</p>
        <label className="mt-3 grid gap-2 text-sm font-semibold text-neutral-700">
          Objetivo
          <textarea
            className="min-h-24 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]"
            placeholder="Ex: emagrecer 8 kg, ganhar massa magra, correr 5 km..."
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
          />
        </label>
        <button
          disabled={saving}
          className="pressable mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? "Salvando..." : "Salvar objetivo"}
        </button>
        {message ? <p className="mt-3 text-sm font-bold text-[var(--ink-2)]">{message}</p> : null}
      </form>
    </Card>
  );
}
