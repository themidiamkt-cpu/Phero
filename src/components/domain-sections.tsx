"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Badge, Card, PrimaryButton } from "@/components/ui";
import { exercises, money, payments, students, workouts } from "@/lib/mock-data";
import type { Payment, PaymentStatus, Trainer, Workout } from "@/lib/types";
import { AdminTrainerActions } from "@/components/mvp-widgets";

export function WorkoutList({
  canDelete = false,
  locked = false,
  studentId,
  workoutItems = workouts,
}: {
  canDelete?: boolean;
  locked?: boolean;
  studentId?: string;
  workoutItems?: Workout[];
}) {
  const router = useRouter();
  const filteredWorkouts = workoutItems.filter((item) => !studentId || item.studentId === studentId);

  async function deleteWorkout(workout: Workout) {
    const confirmed = window.confirm(`Excluir o treino "${workout.title}" deste aluno? Essa acao nao pode ser desfeita.`);
    if (!confirmed) return;

    const response = await fetch(`/api/workouts/${workout.id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      window.alert(result.error ?? "Nao foi possivel excluir o treino.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3 px-5">
      {filteredWorkouts.map((workout) => (
        <Card key={workout.id} className={locked ? "opacity-60" : undefined}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-500">{workout.day}</p>
              <h2 className="mt-1 text-lg font-semibold">{workout.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{workout.duration} · {workout.exercises.length} exercicios</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge tone={locked ? "danger" : workout.type === "hybrid" ? "blue" : "success"}>{locked ? "Bloqueado" : workout.type === "hybrid" ? "Hibrido" : "Liberado"}</Badge>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => deleteWorkout(workout)}
                  className="pressable flex h-9 items-center gap-1.5 rounded-[12px] bg-[var(--red-wash)] px-3 text-xs font-bold text-[var(--red-ink)]"
                >
                  <Trash2 className="size-3.5" />
                  Excluir
                </button>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
      {!filteredWorkouts.length ? (
        <Card>
          <p className="text-sm font-semibold text-neutral-600">Nenhum treino cadastrado.</p>
        </Card>
      ) : null}
    </div>
  );
}

export function StudentList() {
  const toneByStatus: Record<PaymentStatus, "success" | "warning" | "danger"> = {
    approved: "success",
    paid: "success",
    pending: "warning",
    waiting_analysis: "warning",
    pending_review: "warning",
    overdue: "danger",
    rejected: "danger",
  };

  return (
    <div className="space-y-3 px-5">
      {students.map((student) => (
        <Card key={student.id}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{student.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">{student.goal}</p>
            </div>
            <Badge tone={toneByStatus[student.paymentStatus]}>{student.paymentStatus.replace("_", " ")}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ExerciseList() {
  return (
    <div className="space-y-3 px-5">
      {exercises.map((exercise) => (
        <Card key={exercise.id}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{exercise.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">{exercise.muscleGroup}</p>
            </div>
            <Badge tone={exercise.source === "custom" ? "success" : "neutral"}>{exercise.source}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PaymentList({ studentId, paymentItems = payments }: { studentId?: string; paymentItems?: Payment[] }) {
  const list = studentId ? paymentItems.filter((payment) => payment.studentId === studentId) : paymentItems;
  return (
    <div className="space-y-3 px-5">
      {list.map((payment) => (
        <Card key={payment.id}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{money(payment.amount)}</h2>
              <p className="mt-1 text-sm text-neutral-500">Vencimento {payment.dueDate}</p>
            </div>
            <Badge tone={payment.status === "approved" || payment.status === "paid" ? "success" : payment.status === "overdue" || payment.status === "rejected" ? "danger" : "warning"}>
              {payment.status.replace("_", " ")}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TrainerTable({ trainerItems = [] }: { trainerItems?: Trainer[] }) {
  return (
    <div className="grid gap-3">
      {trainerItems.map((trainer) => (
        <Card key={trainer.id}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/admin/personal/${trainer.id}`} className="min-w-0 flex-1">
              <div>
                <h2 className="font-semibold">{trainer.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">{trainer.specialty} · {trainer.studentsCount} alunos · {money(trainer.monthlyRevenue)}</p>
              </div>
            </Link>
            <TrainerStatus trainer={trainer} />
          </div>
          <AdminTrainerActions trainerId={trainer.id} />
        </Card>
      ))}
      {!trainerItems.length ? (
        <Card>
          <p className="text-sm font-semibold text-neutral-600">Nenhum personal cadastrado.</p>
        </Card>
      ) : null}
    </div>
  );
}

export function TrainerStatus({ trainer }: { trainer: Trainer }) {
  if (trainer.blocked) return <Badge tone="danger">Bloqueado</Badge>;
  if (!trainer.approved) return <Badge tone="warning">Pendente</Badge>;
  return <Badge tone="success">Aprovado</Badge>;
}

export function ProofUploadMock() {
  return (
    <Card className="mx-5">
      <h2 className="text-lg font-semibold">Enviar comprovante</h2>
      <p className="mt-2 text-sm leading-6 text-neutral-500">
        O arquivo sera salvo no Supabase Storage e o personal recebera uma automacao via webhook n8n.
      </p>
      <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-stone-50 p-4 text-center text-sm font-medium text-neutral-500">
        payment-proofs/aluno-id/competencia.pdf
      </div>
      <PrimaryButton className="mt-4 w-full">Enviar comprovante</PrimaryButton>
    </Card>
  );
}
