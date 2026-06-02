import { clsx } from "clsx";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { BackButton } from "@/components/back-button";

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[var(--surface)] text-[var(--ink)]">
      <div className="mx-auto min-h-dvh w-full max-w-md bg-[var(--surface)] shadow-2xl shadow-black/10 sm:my-4 sm:min-h-[calc(100dvh-2rem)] sm:overflow-hidden sm:rounded-[34px]">
        {children}
      </div>
    </main>
  );
}

export function Screen({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return <div className={cn("fit-screen min-h-dvh bg-[var(--surface)] pb-28 pt-6", pad && "px-5", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  action,
  showBack = true,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  showBack?: boolean;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-5 pt-7">
      <div className="flex min-w-0 items-start gap-3">
        {showBack ? <BackButton /> : null}
        <div className="min-w-0">
          {eyebrow ? <p className="lbl">{eyebrow}</p> : null}
          <h1 className="mt-1 truncate text-[29px] font-bold leading-none tracking-[-0.03em] text-[var(--ink)]">{title}</h1>
        </div>
      </div>
      {action}
    </header>
  );
}

export function TopBar({
  title,
  sub,
  right,
  onBack,
  className,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
  onBack?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 pb-5", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {onBack ? (
          <a href={onBack} className="pressable grid size-10 shrink-0 place-items-center rounded-full border border-[var(--hair)] bg-white shadow-sm">
            <ChevronLeft className="size-5" />
          </a>
        ) : null}
        <div className="min-w-0">
          {sub ? <div className="lbl mb-1">{sub}</div> : null}
          <div className="truncate text-[29px] font-bold leading-none tracking-[-0.03em] text-[var(--ink)]">{title}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-[var(--hair)] bg-white p-4 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = "dark" }: { label: string; value: string; tone?: "dark" | "light" | "blue" | "green" | "amber" | "red" }) {
  const toneClass = {
    dark: "bg-[var(--navy)] text-white",
    light: "bg-white text-[var(--ink)]",
    blue: "bg-[var(--blue-wash)] text-[var(--blue)]",
    green: "bg-[var(--green-wash)] text-[var(--green)]",
    amber: "bg-[var(--amber-wash)] text-[var(--amber)]",
    red: "bg-[var(--red-wash)] text-[var(--red-ink)]",
  }[tone];

  return (
    <div className={cn("rounded-[12px] border border-[var(--hair)] p-4 shadow-[0_1px_2px_rgba(0,0,0,.04)]", toneClass)}>
      <p className={cn("lbl", tone === "dark" && "text-white/55")}>{label}</p>
      <p className="mono tnum mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "blue" | "green" | "amber" | "red";
  dot?: boolean;
}) {
  const tones = {
    neutral: "bg-[var(--surface-2)] text-[var(--ink-2)]",
    success: "bg-[var(--green-wash)] text-[var(--green)]",
    warning: "bg-[var(--amber-wash)] text-[#b26a00]",
    danger: "bg-[var(--red-wash)] text-[var(--red-ink)]",
    blue: "bg-[var(--blue-wash)] text-[var(--blue-ink)]",
    green: "bg-[var(--green-wash)] text-[var(--green)]",
    amber: "bg-[var(--amber-wash)] text-[#b26a00]",
    red: "bg-[var(--red-wash)] text-[var(--red-ink)]",
  };

  return (
    <span className={cn("mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
      {dot ? <span className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

export function PrimaryButton({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <button className={cn("pressable h-12 rounded-[14px] bg-[var(--blue)] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.32)] hover:bg-[var(--blue-ink)]", className)}>
      {children}
    </button>
  );
}

export function Metric({ value, unit, label, tone = "ink" }: { value: string; unit?: string; label?: string; tone?: "ink" | "blue" | "green" | "amber" | "red" }) {
  const color = {
    ink: "text-[var(--ink)]",
    blue: "text-[var(--blue)]",
    green: "text-[var(--green)]",
    amber: "text-[var(--amber)]",
    red: "text-[var(--red)]",
  }[tone];
  return (
    <div>
      <div className="flex items-baseline gap-1">
      <span className={cn("mono tnum text-3xl font-bold leading-none tracking-[-0.03em]", color)}>{value}</span>
        {unit ? <span className="mono text-xs font-bold text-[var(--ink-3)]">{unit}</span> : null}
      </div>
      {label ? <div className="lbl mt-2">{label}</div> : null}
    </div>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="mono grid shrink-0 place-items-center rounded-full bg-[linear-gradient(150deg,var(--blue),#5e5ce6)] font-bold text-white shadow-sm"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <span className="lbl">{title}</span>
      {action}
    </div>
  );
}

export function TextInput({
  label,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <input
        className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(10,132,255,.12)]"
        placeholder={placeholder}
        type={type}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export function SelectInput({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:ring-4 focus:ring-[rgba(10,132,255,.12)]">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function ProgressBar({ value, tone = "blue", className }: { value: number; tone?: "blue" | "green" | "amber" | "red"; className?: string }) {
  const colors = {
    blue: "bg-[var(--blue)]",
    green: "bg-[var(--green)]",
    amber: "bg-[var(--amber)]",
    red: "bg-[var(--red)]",
  };

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-[var(--surface-2)]", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", colors[tone])} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function Row({
  left,
  title,
  sub,
  right,
  href,
  last = false,
}: {
  left?: ReactNode;
  title: string;
  sub?: string;
  right?: ReactNode;
  href?: string;
  last?: boolean;
}) {
  const content = (
    <div className={cn("flex items-center gap-3 py-3.5", !last && "border-b border-[var(--hair)]")}>
      {left}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-[var(--ink)]">{title}</p>
        {sub ? <p className="mt-1 truncate text-xs font-medium text-[var(--ink-3)]">{sub}</p> : null}
      </div>
      {right}
    </div>
  );

  if (!href) return content;
  return (
    <a href={href} className="pressable block">
      {content}
    </a>
  );
}
