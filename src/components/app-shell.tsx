"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, BookOpen, Dumbbell, Home, Library, MessageCircle, User, Users, Wallet } from "lucide-react";
import { alunoNav, personalNav } from "@/lib/routes";
import { cn, PhoneFrame } from "@/components/ui";
import type { UserRole } from "@/lib/types";

const icons = {
  home: Home,
  activity: Activity,
  dumbbell: Dumbbell,
  chart: BarChart3,
  wallet: Wallet,
  user: User,
  users: Users,
  library: Library,
  book: BookOpen,
  message: MessageCircle,
};

export function MobileAppShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Extract<UserRole, "aluno" | "personal">;
}) {
  const pathname = usePathname();
  const nav = role === "aluno" ? alunoNav : personalNav;

  return (
    <PhoneFrame>
      <div className="flex min-h-dvh flex-col">
        <div className="fit-screen flex-1 pb-24">{children}</div>
        <nav
          className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5"
          style={{ background: "linear-gradient(to top, var(--bg) 72%, transparent)" }}
        >
          <div className="grid gap-1 rounded-[24px] border border-white/80 bg-white/92 px-1.5 py-1.5 shadow-[0_16px_36px_rgba(16,18,24,.12)] backdrop-blur-xl" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
            {nav.map((item) => {
              const Icon = icons[item.icon];
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "pressable mono flex h-14 flex-col items-center justify-center gap-1 rounded-[16px] text-[9.5px] font-semibold transition",
                    active ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.28)]" : "text-[var(--ink-4)] hover:bg-[var(--blue)] hover:text-white",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </PhoneFrame>
  );
}
