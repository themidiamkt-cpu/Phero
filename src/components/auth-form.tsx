"use client";

import { useState } from "react";
import { Mail, Lock, Phone, UserRound, KeyRound } from "lucide-react";
import { roleHome } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserRole } from "@/lib/types";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"student" | "trainer">("student");
  const [trainerCode, setTrainerCode] = useState("");
  const [consentLgpd, setConsentLgpd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function mapSupabaseRole(role: unknown): UserRole | undefined {
    if (role === "admin") return "admin";
    if (role === "trainer" || role === "personal") return "personal";
    if (role === "student" || role === "aluno") return "aluno";
    return undefined;
  }

  function persistRole(role: UserRole, normalizedEmail: string) {
    const expired = "path=/; max-age=0; SameSite=Lax";
    document.cookie = `app-role=${role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `app-user-email=${normalizedEmail}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `demo-role=; ${expired}`;
    document.cookie = `demo-user-email=; ${expired}`;
    document.cookie = `demo-payment-status=; ${expired}`;
    document.cookie = `demo-access-status=; ${expired}`;
    window.location.assign(roleHome[role]);
  }

  async function submit(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError("");

    if (mode === "register") {
      if (!fullName.trim() || !normalizedEmail || !phone.trim() || !password) {
        setError("Preencha nome, email, telefone e senha.");
        return;
      }

      if (accountType === "student" && !trainerCode.trim()) {
        setError("Informe o codigo do personal.");
        return;
      }

      if (!consentLgpd) {
        setError("Aceite o consentimento LGPD para criar a conta.");
        return;
      }
    } else if (!normalizedEmail || !password) {
      setError("Informe email e senha.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      if (mode === "register") {
        const registerResponse = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: accountType,
            fullName,
            email: normalizedEmail,
            phone,
            password,
            trainerCode,
            consentLgpd,
          }),
        });
        const registerResult = (await registerResponse.json()) as { ok?: boolean; error?: string };

        if (!registerResponse.ok || !registerResult.ok) {
          setError(registerResult.error ?? "Nao foi possivel criar conta.");
          return;
        }
      }

      const response = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

      if (!response.error && response.data.user) {
        const metadataRole =
          response.data.user.app_metadata?.role ??
          response.data.user.user_metadata?.role ??
          response.data.user.user_metadata?.user_role;
        const role = mapSupabaseRole(metadataRole);

        if (!role) {
          await supabase.auth.signOut();
          setError("Usuario autenticado, mas sem role configurada no Supabase.");
          return;
        }

        persistRole(role, normalizedEmail);
        return;
      }

      setError(response.error?.message ?? "Nao foi possivel entrar.");
    } catch {
      setError("Nao foi possivel conectar ao Supabase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page min-h-dvh">
      <ThemeToggle className="fixed right-[calc(50%-13rem)] top-5 z-30 max-[440px]:right-5" />
      <div className="auth-card mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden px-7 pb-10 pt-20 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:rounded-[34px]">
        <div className="flex flex-1 flex-col justify-center">
          <div className="grid size-28 place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/phero-logo-transparent.png" alt="Phero" className="h-[132%] w-[132%] max-w-none object-contain drop-shadow-[0_18px_38px_rgba(10,132,255,.32)]" />
          </div>
          <p className="auth-overline mt-7 text-xs font-semibold uppercase tracking-[0.18em]">PHERO</p>
          <h1 className="auth-title mt-3 whitespace-pre-line text-[36px] font-bold leading-[1.02] tracking-[-0.04em]">
          {mode === "login" ? "Sua evolução\ncontinua aqui." : "Crie sua\nconta."}
          </h1>
          <p className="auth-copy mt-4 max-w-xs text-[16px] leading-7">
            {mode === "login" ? "Acesse seus treinos, acompanhe seu progresso e alcance seus objetivos." : "Acesse seus treinos, acompanhe seu progresso e alcance seus objetivos."}
          </p>

          <form onSubmit={submit} className="mt-8 grid gap-3">
            {mode === "register" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType("student")}
                    className={`auth-segment h-11 rounded-[14px] text-sm font-bold transition ${accountType === "student" ? "is-active" : ""}`}
                  >
                    Sou aluno
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("trainer")}
                    className={`auth-segment h-11 rounded-[14px] text-sm font-bold transition ${accountType === "trainer" ? "is-active" : ""}`}
                  >
                    Sou personal
                  </button>
                </div>
                <Field icon={<UserRound className="size-4" />} placeholder="Nome completo" value={fullName} onChange={setFullName} type="text" />
              </>
            ) : null}
            <Field icon={<Mail className="size-4" />} placeholder="seu@email.com" value={email} onChange={setEmail} />
            {mode === "register" ? <Field icon={<Phone className="size-4" />} placeholder="Telefone" value={phone} onChange={setPhone} type="tel" /> : null}
            {mode === "register" && accountType === "student" ? (
              <Field icon={<KeyRound className="size-4" />} placeholder="Codigo do personal" value={trainerCode} onChange={setTrainerCode} type="text" />
            ) : null}
            <Field icon={<Lock className="size-4" />} placeholder="Senha" password value={password} onChange={setPassword} />
            {mode === "register" ? (
              <label className="auth-lgpd flex items-start gap-3 rounded-[14px] p-3 text-xs font-medium leading-5">
                <input className="mt-1" type="checkbox" checked={consentLgpd} onChange={(event) => setConsentLgpd(event.target.checked)} />
                <span>Autorizo o tratamento dos meus dados pessoais e de saude para uso dentro da plataforma, conforme a LGPD.</span>
              </label>
            ) : null}
            {error ? <p className="text-sm font-semibold text-[#ffb4ae]">{error}</p> : null}
            <button disabled={loading} className="pressable mt-1 h-14 rounded-[16px] bg-[var(--blue)] text-[16px] font-bold text-white shadow-[0_12px_30px_rgba(10,132,255,.36)] transition hover:bg-[var(--blue-ink)] disabled:opacity-60">
              {loading ? "Entrando..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </button>
          </form>

        </div>

        <p className="auth-footer mt-8 text-center text-sm">
          {mode === "login" ? "Novo por aqui?" : "Ja tem conta?"}{" "}
          <a className="auth-footer-link font-bold" href={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Criar conta" : "Entrar"}
          </a>
        </p>
      </div>
    </main>
  );
}

function Field({
  icon,
  placeholder,
  password = false,
  type,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  password?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="auth-field flex h-[52px] items-center gap-3 rounded-[16px] px-4 backdrop-blur transition-within focus-within:border-[var(--blue)] focus-within:ring-4 focus-within:ring-[rgba(10,132,255,.16)]">
      {icon}
      <input
        className="auth-input min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none"
        placeholder={placeholder}
        type={password ? "password" : type ?? "email"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
