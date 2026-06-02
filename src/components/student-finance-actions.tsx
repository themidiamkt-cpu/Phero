"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Card, cn } from "@/components/ui";
import { money } from "@/lib/mock-data";
import type { Payment, Student } from "@/lib/types";

export function StudentAccessButton({ student, trainerId }: { student: Student; trainerId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const blocked = student.accessStatus === "blocked";

  async function submit() {
    setLoading(true);

    try {
      const response = await fetch(`/api/students/${student.id}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: blocked ? "release" : "block",
          trainer_id: trainerId,
          reason: blocked ? "Liberacao manual pelo personal" : "Bloqueio manual pelo personal",
        }),
      });

      if (response.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading || !trainerId}
      onClick={submit}
      className={cn(
        "h-11 rounded-lg border border-neutral-200 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        blocked ? "bg-white text-neutral-950 hover:bg-neutral-50" : "bg-rose-50 text-rose-800 hover:bg-rose-100",
      )}
    >
      {loading ? "Salvando..." : blocked ? "Desbloquear" : "Bloquear"}
    </button>
  );
}

export function StudentPaymentReview({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const reviewPayments = payments.filter((payment) => (
    payment.status === "waiting_analysis" ||
    payment.status === "pending_review" ||
    Boolean(payment.proofUrl)
  ));

  async function manualAction(payment: Payment, status: "approved" | "rejected") {
    setLoadingId(`${payment.id}:${status}`);

    try {
      const response = await fetch(`/api/payments/${payment.id}/manual-action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          receipt_id: payment.receiptId,
        }),
      });

      if (response.ok) router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (!reviewPayments.length) return null;

  return (
    <div className="space-y-3 px-5">
      <p className="lbl">Comprovantes recebidos</p>
      {reviewPayments.map((payment) => (
        <Card key={payment.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold">{money(payment.amount)}</h2>
              <p className="mt-1 text-sm text-neutral-500">Vencimento {payment.dueDate}</p>
              {payment.proofUrl ? (
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-xs font-bold text-[var(--blue)]"
                >
                  Abrir comprovante
                </a>
              ) : (
                <p className="mt-2 text-xs font-semibold text-amber-700">Comprovante sem URL salva.</p>
              )}
            </div>
            <Badge tone={payment.status === "rejected" ? "danger" : payment.status === "approved" || payment.status === "paid" ? "success" : "warning"}>
              {payment.status.replace("_", " ")}
            </Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingId !== null || payment.status === "approved" || payment.status === "paid"}
              onClick={() => manualAction(payment, "approved")}
              className="h-10 rounded-lg bg-emerald-600 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingId === `${payment.id}:approved` ? "Aprovando..." : "Aprovar e liberar"}
            </button>
            <button
              type="button"
              disabled={loadingId !== null || payment.status === "rejected"}
              onClick={() => manualAction(payment, "rejected")}
              className="h-10 rounded-lg bg-rose-50 text-xs font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingId === `${payment.id}:rejected` ? "Recusando..." : "Recusar"}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
