"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, LayoutDashboard, Settings2, Users } from "lucide-react";
import { adminNav } from "@/lib/routes";
import { cn } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";

const icons = {
  dashboard: LayoutDashboard,
  building: Dumbbell,
  users: Users,
  settings: Settings2,
};

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col bg-black p-5 text-white md:flex">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-[10px] border border-white/15 bg-white text-black">
          <span className="text-sm font-semibold">FP</span>
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Phero</p>
          <p className="mt-1 text-xs font-medium text-white/48">Admin da plataforma</p>
        </div>
      </div>

      <nav className="mt-10 grid gap-1">
        {adminNav.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition",
                active
                  ? "bg-white/12 text-white"
                  : "text-white/62 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
              {active ? <span className="ml-auto size-1.5 rounded-full bg-white/70" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[16px] border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-medium leading-5 text-white/52">Controle de personais, alunos, treinos globais e operacao da plataforma.</p>
        <div className="mt-4">
          <LogoutButton variant="dark" />
        </div>
      </div>
    </aside>
  );
}
