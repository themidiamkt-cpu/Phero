"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/components/ui";

export function LogoutButton({ variant = "light" }: { variant?: "dark" | "light" }) {
  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();

    const expired = "path=/; max-age=0; SameSite=Lax";
    document.cookie = `app-role=; ${expired}`;
    document.cookie = `app-user-email=; ${expired}`;
    document.cookie = `app-payment-status=; ${expired}`;
    document.cookie = `app-access-status=; ${expired}`;
    document.cookie = `demo-role=; ${expired}`;
    document.cookie = `demo-user-email=; ${expired}`;
    document.cookie = `demo-payment-status=; ${expired}`;
    document.cookie = `demo-access-status=; ${expired}`;
    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      onClick={logout}
      className={cn(
        "pressable flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition",
        variant === "dark"
          ? "bg-white/10 text-white hover:bg-white/16"
          : "border border-[var(--hair)] bg-white px-4 text-black hover:bg-[var(--surface)]",
      )}
    >
      <LogOut className="size-4" />
      Sair
    </button>
  );
}
