import type { UserRole } from "@/lib/types";

export const roleHome: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  personal: "/app/personal/dashboard",
  aluno: "/app/aluno/home",
};

export const alunoNav = [
  { href: "/app/aluno/home", label: "Home", icon: "home" },
  { href: "/app/aluno/treinos", label: "Treinos", icon: "dumbbell" },
  { href: "/app/aluno/corrida", label: "Corrida", icon: "activity" },
  { href: "/app/aluno/evolucao", label: "Evolucao", icon: "chart" },
  { href: "/app/aluno/financeiro", label: "Financeiro", icon: "wallet" },
  { href: "/app/aluno/perfil", label: "Perfil", icon: "user" },
] as const;

export const personalNav = [
  { href: "/app/personal/dashboard", label: "Painel", icon: "home" },
  { href: "/app/personal/alunos", label: "Alunos", icon: "users" },
  { href: "/app/personal/exercicios", label: "Exercicios", icon: "library" },
  { href: "/app/personal/financeiro", label: "Financeiro", icon: "wallet" },
  { href: "/app/personal/perfil", label: "Perfil", icon: "user" },
] as const;

export const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/personais", label: "Personais", icon: "users" },
  { href: "/admin/treinos-gerais", label: "Treinos globais", icon: "settings" },
] as const;
