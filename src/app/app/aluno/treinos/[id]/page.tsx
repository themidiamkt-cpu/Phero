import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WorkoutExecution } from "@/components/mvp-widgets";
import { getWorkoutsData } from "@/lib/data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TreinoExecucaoPage({ params }: Props) {
  const { id } = await params;
  const workouts = await getWorkoutsData();
  const workout = workouts.find((item) => item.id === id);

  if (!workout) notFound();

  const isRunningWorkout = workout.type === "running" || Boolean(workout.running);

  return (
    <>
      {isRunningWorkout ? null : (
        <header className="px-5 pb-5 pt-7">
          <div className="flex items-start gap-3">
            <Link href="/app/aluno/treinos" className="pressable grid size-11 shrink-0 place-items-center rounded-full border border-[var(--hair)] bg-white shadow-sm">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="lbl">Execucao</p>
              <h1 className="mt-1 text-[25px] font-bold leading-tight tracking-[-0.03em] text-[var(--ink)]">{workout.title}</h1>
            </div>
          </div>
        </header>
      )}
      <WorkoutExecution workout={workout} />
    </>
  );
}
