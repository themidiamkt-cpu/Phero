"use client";

import { ChevronLeft } from "lucide-react";

export function BackButton() {
  return (
    <button
      aria-label="Voltar"
      onClick={() => window.history.back()}
      className="pressable grid size-10 shrink-0 place-items-center rounded-full border border-[var(--hair)] bg-white text-[var(--ink)] shadow-[0_1px_2px_rgba(16,18,24,.04),0_6px_20px_rgba(16,18,24,.05)]"
      type="button"
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}
