"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";

type ProfileFormProps = {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  goal?: string;
};

export function ProfileForm({ name, email, phone = "", birthDate = "", goal = "" }: ProfileFormProps) {
  const [fullName, setFullName] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [birthDateValue, setBirthDateValue] = useState(birthDate);
  const [goalValue, setGoalValue] = useState(goal);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: phoneValue,
          birthDate: birthDateValue,
          goal: goalValue,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Nao foi possivel salvar os dados.");
      }

      setMessageTone("success");
      setMessage("Dados salvos no banco de dados.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar os dados.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-5 grid gap-3">
      <Field label="Nome completo" value={fullName} onChange={setFullName} placeholder="Seu nome" />
      <Field label="Email" value={email} onChange={() => undefined} placeholder="seu@email.com" type="email" readOnly />
      <Field label="Celular" value={phoneValue} onChange={setPhoneValue} placeholder="(11) 99999-9999" />
      <Field label="Data de nascimento" value={birthDateValue} onChange={setBirthDateValue} type="date" />
      <label className="grid gap-2 text-sm font-semibold text-neutral-700">
        Objetivo
        <textarea
          className="min-h-24 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
          value={goalValue}
          onChange={(event) => setGoalValue(event.target.value)}
          placeholder="Ex: ganhar massa magra, correr 10km..."
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="pressable mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white shadow-[0_6px_18px_rgba(10,132,255,.32)] disabled:opacity-60"
      >
        <Save className="size-4" />
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
      {message ? <p className={`text-sm font-semibold ${messageTone === "success" ? "text-[var(--green)]" : "text-[var(--red-ink)]"}`}>{message}</p> : null}
    </form>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  readOnly = false,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <input
        className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none read-only:bg-[var(--surface)] focus:border-[var(--blue)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        type={type}
        value={value}
      />
    </label>
  );
}
