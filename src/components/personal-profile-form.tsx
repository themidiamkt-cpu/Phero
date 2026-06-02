"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";

type CommercialPlan = {
  id: string;
  name: string;
  price: string;
  billingCycle: string;
  customDays?: string;
};

type PersonalProfileFormProps = {
  name: string;
  email: string;
  businessName: string;
  document: string;
  instagram: string;
  phone: string;
  bio: string;
  hourlyRate?: string;
  inviteCode?: string;
  pixKey?: string;
  platformSubscriptionStatus?: string;
  studentCount?: number;
  plans?: CommercialPlan[];
};

export function PersonalProfileForm({
  name,
  email,
  businessName,
  document,
  instagram,
  phone,
  bio,
  hourlyRate = "",
  inviteCode = "",
  pixKey = "",
  platformSubscriptionStatus = "trial",
  studentCount = 0,
  plans = [],
}: PersonalProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(name);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [businessNameValue, setBusinessNameValue] = useState(businessName);
  const [documentValue, setDocumentValue] = useState(document);
  const [instagramValue, setInstagramValue] = useState(instagram);
  const [bioValue, setBioValue] = useState(bio);
  const [hourlyRateValue, setHourlyRateValue] = useState(hourlyRate);
  const [pixKeyValue, setPixKeyValue] = useState(pixKey);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);
  const [commercialPlans, setCommercialPlans] = useState<CommercialPlan[]>(plans);

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
          businessName: businessNameValue,
          document: documentValue,
          instagram: instagramValue,
          bio: bioValue,
          hourlyRate: hourlyRateValue,
          pixKey: pixKeyValue,
          plans: commercialPlans.map((plan) => ({
            name: plan.name,
            price: plan.price,
            billingCycle: plan.billingCycle,
            customDays: plan.customDays,
          })),
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string; warning?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Nao foi possivel salvar os dados.");
      }

      setMessageTone("success");
      setMessage(result.warning ?? "Dados profissionais e planos salvos no banco de dados.");
      router.refresh();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar os dados.");
    } finally {
      setSaving(false);
    }
  }

  function updatePlan(id: string, field: "name" | "price" | "billingCycle" | "customDays", value: string) {
    setCommercialPlans((currentPlans) =>
      currentPlans.map((plan) =>
        plan.id === id
          ? {
              ...plan,
              [field]: value,
              ...(field === "billingCycle" && value !== "Personalizado" ? { customDays: "" } : {}),
            }
          : plan,
      ),
    );
  }

  function addPlan() {
    setCommercialPlans((currentPlans) => [
      ...currentPlans,
      {
        id: `plan-${Date.now()}`,
        name: "",
        price: "",
        billingCycle: "Mensal",
        customDays: "",
      },
    ]);
  }

  function removePlan(id: string) {
    setCommercialPlans((currentPlans) => currentPlans.filter((plan) => plan.id !== id));
  }

  return (
    <form onSubmit={save} className="mt-5 grid gap-3">
      <Field label="Nome completo" value={fullName} onChange={setFullName} placeholder="Nome do personal" />
      <Field label="Email" value={email} onChange={() => undefined} placeholder="email@exemplo.com" type="email" readOnly />
      <Field label="Celular" value={phoneValue} onChange={setPhoneValue} placeholder="(11) 99999-9999" />
      <Field label="Nome do negócio" value={businessNameValue} onChange={setBusinessNameValue} placeholder="Studio / consultoria" />
      <Field label="CPF ou CNPJ" value={documentValue} onChange={setDocumentValue} placeholder="Documento" />
      <Field label="Instagram" value={instagramValue} onChange={setInstagramValue} placeholder="@perfil" />
      <Field label="Valor por hora" value={hourlyRateValue} onChange={setHourlyRateValue} placeholder="Ex: 180" type="number" />
      <Field label="Chave PIX para alunos" value={pixKeyValue} onChange={setPixKeyValue} placeholder="CPF, email, celular ou chave aleatoria" />
      <div className="rounded-[14px] border border-[var(--hair)] bg-[var(--surface)] p-3">
        <p className="lbl">Codigo do personal</p>
        <p className="mt-2 font-mono text-xl font-bold text-[var(--ink)]">{inviteCode || "Nao gerado"}</p>
        <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">
          {inviteCode ? "Passe esse codigo para o aluno criar conta e ficar vinculado a voce." : "Rode a migration de convite no Supabase para gerar seu codigo."}
        </p>
      </div>
      <div className="rounded-[14px] border border-[var(--hair)] bg-white p-3">
        <p className="lbl">Plano da plataforma</p>
        <p className="mt-2 text-sm font-bold text-[var(--ink)]">
          {studentCount}/2 alunos gratuitos · {platformSubscriptionStatus === "active" ? "assinatura ativa" : "modo gratuito"}
        </p>
        {platformSubscriptionStatus !== "active" && studentCount >= 2 ? (
          <p className="mt-1 text-xs font-semibold text-[var(--red-ink)]">Para cadastrar mais alunos, ative a assinatura da plataforma.</p>
        ) : null}
      </div>
      <label className="grid gap-2 text-sm font-semibold text-neutral-700">
        Bio profissional
        <textarea
          className="min-h-24 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
          value={bioValue}
          onChange={(event) => setBioValue(event.target.value)}
          placeholder="Especialidades, metodologia e observações"
        />
      </label>

      <div className="mt-2">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-neutral-700">Planos oferecidos</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">Opcional para pacotes mensais, trimestrais ou personalizados.</p>
          </div>
          <button
            type="button"
            onClick={addPlan}
            className="pressable grid size-10 shrink-0 place-items-center rounded-full border border-[var(--hair)] bg-[var(--surface)] text-[var(--ink)]"
            aria-label="Adicionar plano"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="grid gap-3">
          {commercialPlans.map((plan, index) => (
            <div key={plan.id} className="rounded-[16px] border border-[var(--hair)] bg-[var(--surface)] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="lbl">Plano {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removePlan(plan.id)}
                  className="pressable grid size-8 place-items-center rounded-full bg-white text-neutral-500"
                  aria-label="Remover plano"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="grid gap-2">
                <input
                  className="h-11 rounded-[12px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                  placeholder="Nome do plano"
                  value={plan.name}
                  onChange={(event) => updatePlan(plan.id, "name", event.target.value)}
                />
                <div className="grid grid-cols-[1fr_132px] gap-2">
                  <input
                    className="h-11 min-w-0 rounded-[12px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    placeholder="Valor"
                    type="number"
                    value={plan.price}
                    onChange={(event) => updatePlan(plan.id, "price", event.target.value)}
                  />
                  <select
                    className="h-11 min-w-0 rounded-[12px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    value={plan.billingCycle}
                    onChange={(event) => updatePlan(plan.id, "billingCycle", event.target.value)}
                  >
                    <option>Semanal</option>
                    <option>Mensal</option>
                    <option>Trimestral</option>
                    <option>Semestral</option>
                    <option>Anual</option>
                    <option>Personalizado</option>
                  </select>
                </div>
                {plan.billingCycle === "Personalizado" ? (
                  <input
                    className="h-11 rounded-[12px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                    placeholder="Quantidade de dias do plano personalizado"
                    type="number"
                    min="1"
                    required
                    value={plan.customDays ?? ""}
                    onChange={(event) => updatePlan(plan.id, "customDays", event.target.value)}
                  />
                ) : null}
              </div>
            </div>
          ))}
          {!commercialPlans.length ? (
            <div className="rounded-[14px] border border-dashed border-[var(--hair)] bg-[var(--surface)] p-3">
              <p className="text-sm font-semibold text-neutral-600">Nenhum plano cadastrado.</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Use o botao + para cadastrar um plano real para seus alunos.</p>
            </div>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="pressable mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white shadow-[0_6px_18px_rgba(10,132,255,.32)] disabled:opacity-60"
      >
        <Save className="size-4" />
        {saving ? "Salvando..." : "Salvar dados"}
      </button>
      {message ? <p className={`text-sm font-semibold ${messageTone === "success" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{message}</p> : null}
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
