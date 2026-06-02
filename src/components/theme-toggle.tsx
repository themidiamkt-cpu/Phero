"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "fit-theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem(storageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return saved ? saved === "dark" : prefersDark;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
  }, [dark]);

  function toggle() {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem(storageKey, next ? "dark" : "light");
    document.documentElement.classList.toggle("theme-dark", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`pressable grid size-10 place-items-center rounded-full border border-[var(--hair)] bg-white text-[var(--ink)] shadow-[var(--shadow-card)] ${className}`}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
