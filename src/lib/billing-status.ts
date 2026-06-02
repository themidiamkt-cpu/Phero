import type { Subscription } from "@/lib/types";

export function todayISODate() {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).format(new Date());
}

export function isPastDue(dueDate?: string | null) {
  if (!dueDate) return false;
  return dueDate < todayISODate();
}

export function isSubscriptionBlocked(subscription?: Subscription | null) {
  if (!subscription) return false;
  if (subscription.accessStatus === "released") return false;
  return subscription.accessStatus === "blocked" || subscription.status === "overdue" || isPastDue(subscription.nextDueDate);
}

export function billingStatusLabel(subscription?: Subscription | null) {
  if (!subscription) return "SEM PLANO";
  if (subscription.accessStatus === "released") return "EM DIA";
  if (subscription.status === "pending") return "EM ANALISE";
  if (isPastDue(subscription.nextDueDate) || subscription.status === "overdue") return "VENCIDO";
  if (subscription.accessStatus === "blocked") return "PENDENTE";
  return "EM DIA";
}
