"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function prepareRecoverySession() {
      const hash = window.location.hash;
      if (!hash) {
        setError("Link de recuperacao invalido ou expirado. Solicite um novo reset de senha.");
        return;
      }

      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type !== "recovery" || !accessToken || !refreshToken) {
        setError("Link de recuperacao invalido ou expirado. Solicite um novo reset de senha.");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        setError("Nao foi possivel validar o link de recuperacao. Solicite um novo reset de senha.");
        return;
      }

      window.history.replaceState(null, "", "/reset-password");
      setReady(true);
    }

    prepareRecoverySession();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message || "Nao foi possivel alterar a senha.");
        return;
      }

      await supabase.auth.signOut();
      setMessage("Senha alterada com sucesso. Agora voce ja pode entrar com a nova senha.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Nao foi possivel alterar a senha.");
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
            Criar nova{"\n"}senha.
          </h1>
          <p className="auth-copy mt-4 max-w-xs text-[16px] leading-7">
            Digite uma nova senha para recuperar seu acesso ao app.
          </p>

          <form onSubmit={submit} className="mt-8 grid gap-3">
            <Field icon={<Lock className="size-4" />} placeholder="Nova senha" value={password} onChange={setPassword} disabled={!ready || Boolean(message)} />
            <Field icon={<Lock className="size-4" />} placeholder="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} disabled={!ready || Boolean(message)} />
            {error ? <p className="text-sm font-semibold text-[#ffb4ae]">{error}</p> : null}
            {message ? <p className="rounded-[14px] border border-emerald-300/40 bg-emerald-400/12 p-3 text-sm font-semibold text-emerald-100">{message}</p> : null}
            <button
              disabled={!ready || loading || Boolean(message)}
              className="pressable mt-1 h-14 rounded-[16px] bg-[var(--blue)] text-[16px] font-bold text-white shadow-[0_12px_30px_rgba(10,132,255,.36)] transition hover:bg-[var(--blue-ink)] disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Alterar senha"}
            </button>
          </form>
        </div>

        <p className="auth-footer mt-8 text-center text-sm">
          Ja alterou a senha?{" "}
          <a className="auth-footer-link font-bold" href="/login">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}

function Field({
  icon,
  placeholder,
  value,
  disabled,
  onChange,
}: {
  icon: ReactNode;
  placeholder: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="auth-field flex h-[52px] items-center gap-3 rounded-[16px] px-4 backdrop-blur transition-within focus-within:border-[var(--blue)] focus-within:ring-4 focus-within:ring-[rgba(10,132,255,.16)]">
      {icon}
      <input
        className="auth-input min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none"
        disabled={disabled}
        placeholder={placeholder}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
