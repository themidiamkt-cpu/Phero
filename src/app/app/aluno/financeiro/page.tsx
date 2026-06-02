import { Check, Clock, LockKeyhole, QrCode } from "lucide-react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { ReceiptUpload } from "@/components/mvp-widgets";
import { getCurrentProfile } from "@/lib/auth";
import { billingStatusLabel, isSubscriptionBlocked } from "@/lib/billing-status";
import { money } from "@/lib/mock-data";
import { getMvpData, getStudentFinanceData } from "@/lib/data";

export default async function AlunoFinanceiroPage() {
  const profile = await getCurrentProfile();
  const [data, finance] = await Promise.all([getMvpData(), getStudentFinanceData(profile.id)]);
  const { plan, subscription, payments: studentPayments } = finance;
  const trainer = data.trainers.find((item) => item.id === profile.personalId);
  const nextPayment = studentPayments.find((payment) => payment.status !== "approved" && payment.status !== "paid") ?? studentPayments[0];
  const financialBlocked = (profile.accessStatus === "blocked" && subscription?.accessStatus !== "released") || isSubscriptionBlocked(subscription);
  const waitingAnalysis = profile.paymentStatus === "waiting_analysis" || profile.paymentStatus === "pending_review" || studentPayments.some((payment) => payment.status === "waiting_analysis" || payment.status === "pending_review");
  const rejected = profile.paymentStatus === "rejected" || studentPayments.some((payment) => payment.status === "rejected");
  const statusLabel = billingStatusLabel(subscription);
  const nextDueDate = subscription?.nextDueDate ? new Date(`${subscription.nextDueDate}T12:00:00`) : null;
  const dueText = nextDueDate && subscription?.nextDueDate
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(nextDueDate).replace(".", "")
    : "--";

  return (
    <>
      <PageHeader eyebrow="Seu plano" title="Financeiro" showBack={false} />

      <section className="px-5">
        <div className="overflow-hidden rounded-[20px] bg-[linear-gradient(145deg,#10213a,#081526)] p-5 text-white shadow-[0_20px_44px_rgba(8,21,38,.28)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl text-white/45">Plano atual</p>
              <h2 className="mt-5 text-xl font-bold">{plan?.name ?? "Sem plano ativo"}</h2>
            </div>
            <Badge tone={financialBlocked ? "danger" : "success"} dot>{statusLabel}</Badge>
          </div>

          <div className="mt-3 flex items-end gap-2">
            <span className="text-2xl font-bold">R$</span>
            <span className="mono tnum text-[34px] font-bold leading-none tracking-[-0.05em]">{plan ? plan.price : "--"}</span>
            <span className="pb-1 text-xs font-semibold text-white/45">/mes</span>
          </div>

          <div className="my-5 h-px bg-white/10" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="lbl text-white/40">Prox. fatura</p>
              <p className="mono mt-2 text-sm font-bold text-white">{dueText}</p>
            </div>
            <div className="text-right">
              <p className="lbl text-white/40">Personal</p>
              <p className="mt-2 text-sm font-bold text-white">{trainer?.name ?? "Personal"}</p>
            </div>
          </div>
        </div>
      </section>

      {financialBlocked ? (
        <section className="mt-5 px-5">
          <Card className="border-red-100 bg-red-50">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-5 shrink-0 text-red-600" />
              <div>
                <h2 className="text-sm font-bold text-red-900">
                  {waitingAnalysis ? "Comprovante em analise" : rejected ? "Comprovante rejeitado" : "Plano vencido"}
                </h2>
                <p className="mt-1 text-sm font-medium leading-6 text-red-700">
                  {waitingAnalysis
                    ? "Seu comprovante foi recebido e esta sendo analisado. Os treinos ficam bloqueados ate a aprovacao."
                    : "Regularize o pagamento pelo PIX abaixo e envie o comprovante para liberar seus treinos."}
                </p>
                <p className="mono mt-3 text-sm font-bold text-red-900">Valor: {money(nextPayment?.amount ?? plan?.price ?? 0)}</p>
              </div>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="mt-5 px-5">
        <p className="lbl mb-3">Forma de pagamento</p>
        <Card className="p-0">
          <div className="flex items-center gap-3 p-4">
            <div className="grid size-10 place-items-center rounded-[12px] bg-[var(--blue-wash)] text-[var(--blue)]">
              <QrCode className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">PIX</h2>
              <p className="mt-1 text-xs font-medium text-neutral-500">{trainer?.pixKey ? trainer.pixKey : "Personal ainda nao cadastrou a chave PIX"}</p>
            </div>
            <Badge tone={trainer?.pixKey ? "blue" : "warning"}>{trainer?.pixKey ? "ATIVO" : "PENDENTE"}</Badge>
          </div>
        </Card>
      </section>

      <section className="mt-6 px-5">
        <p className="lbl mb-3">Historico</p>
        <Card className="p-0">
          {studentPayments.length ? studentPayments.map((payment, index) => (
            <div key={payment.id}>
              <div className="flex items-center gap-3 p-4">
                <div className={`grid size-10 place-items-center rounded-[12px] ${payment.status === "approved" || payment.status === "paid" ? "bg-[var(--green-wash)] text-[var(--green)]" : "bg-[var(--amber-wash)] text-[var(--amber)]"}`}>
                  {payment.status === "approved" || payment.status === "paid" ? <Check className="size-5" /> : <Clock className="size-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold">{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${payment.dueDate}T12:00:00`)).replace(".", "")}</h2>
                  <p className="mt-1 text-xs font-medium text-neutral-500">{payment.status.replace("_", " ")}</p>
                </div>
                <p className="text-sm font-bold">{money(payment.amount)}</p>
              </div>
              {index < studentPayments.length - 1 ? <div className="mx-4 h-px bg-[var(--hair)]" /> : null}
            </div>
          )) : (
            <div className="p-4">
              <p className="text-sm font-semibold text-neutral-600">Nenhum pagamento registrado.</p>
              <p className="mt-1 text-xs font-medium text-neutral-500">Quando o personal criar uma cobrança, ela aparece aqui.</p>
            </div>
          )}
          {studentPayments.some((payment) => payment.status === "waiting_analysis") ? (
            <div className="border-t border-[var(--hair)] px-4 py-3 text-xs font-bold text-amber-700">
              Seu comprovante foi recebido e está sendo analisado.
            </div>
          ) : null}
        </Card>
      </section>

      <div id="comprovante" className="mt-5">
        <ReceiptUpload paymentItems={studentPayments} studentItems={data.students} studentId={profile.id} />
      </div>
    </>
  );
}
