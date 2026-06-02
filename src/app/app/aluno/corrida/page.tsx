import Link from "next/link";
import { ChevronLeft, LocateFixed, LockKeyhole, Play } from "lucide-react";
import { canStudentOpenWorkouts, getCurrentProfile } from "@/lib/auth";
import { isSubscriptionBlocked } from "@/lib/billing-status";
import { getMvpData, getStudentFinanceData } from "@/lib/data";

export default async function AlunoCorridaPage() {
  const profile = await getCurrentProfile();
  const [data, finance] = await Promise.all([getMvpData(), getStudentFinanceData(profile.id)]);
  const student = data.students.find((item) => item.id === profile.id);
  const paymentStatus = student?.paymentStatus ?? profile.paymentStatus;
  const accessStatus = student?.accessStatus ?? profile.accessStatus;
  const canTrain = canStudentOpenWorkouts(paymentStatus, accessStatus) && !isSubscriptionBlocked(finance.subscription);
  const runningWorkout = data.workouts.find((workout) => {
    const belongsToStudent = workout.studentId === profile.id;
    const isRunning = workout.type === "running" || Boolean(workout.running);
    return belongsToStudent && isRunning;
  });
  const running = runningWorkout?.running;
  const distance = running?.distanceKm || 10;
  const pace = running?.targetPace ?? "5:30/km";
  const time = running?.targetTime ?? "55 min";
  const zone = running?.targetHeartRate?.split(" ")[0] ?? "Z2";
  const locked = !canTrain;

  return (
    <section className="min-h-dvh bg-[#05070b] text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] max-w-md flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_100%,rgba(31,174,91,.30),transparent_25%),linear-gradient(180deg,#0d1725,#07111f_64%,#06101c)] px-5 pb-4 pt-5">
        <header className="flex items-center gap-3">
          <Link href="/app/aluno/treinos" className="pressable grid size-10 place-items-center rounded-full bg-white/12 text-white">
            <ChevronLeft className="size-5" />
          </Link>
          <p className="lbl text-white/38">Corrida</p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col pt-10">
          <div>
            <span className="mono inline-flex rounded-full bg-[#87570f]/85 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#ffd28a]">
              {running?.runningType ?? "Longao"} · Resistencia
            </span>
            <h1 className="mt-3 max-w-[220px] text-[28px] font-bold leading-[0.98] tracking-[-0.05em]">
              Sua meta
              <br />
              de hoje
            </h1>
          </div>

          <div className="mt-5 flex items-end justify-center gap-2">
            <span className="mono tnum text-[clamp(58px,18vw,76px)] font-bold leading-none tracking-[-0.08em]">{formatDistance(distance)}</span>
            <span className="mb-3 text-2xl font-bold text-white/38">km</span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <RunMetric value={pace.replace("/km", "")} unit="/km" label="Pace alvo" />
            <RunMetric value={time.replace(" min", "")} unit="min" label="Tempo est." />
            <RunMetric value={zone} unit="base" label="Zona" />
          </div>

          <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[.06] p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="mono tnum text-xl font-bold">0.00</p>
                <p className="lbl mt-1 text-white/35">km reais</p>
              </div>
              <div>
                <p className="mono tnum text-xl font-bold">00:00</p>
                <p className="lbl mt-1 text-white/35">tempo</p>
              </div>
              <div>
                <p className="mono tnum text-xl font-bold">--</p>
                <p className="lbl mt-1 text-white/35">pace medio</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs font-medium leading-5 text-white/45">
              <LocateFixed className="mt-0.5 size-4 shrink-0" />
              <span>Dados reais por GPS aparecem ao iniciar a corrida.</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-3">
        {locked ? (
          <Link href="/app/aluno/financeiro" className="pressable flex h-16 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-bold text-[#07111f]">
            <LockKeyhole className="size-5" />
            Regularizar acesso
          </Link>
        ) : (
          <div className="grid gap-2">
            <Link href={runningWorkout ? `/app/aluno/treinos/${runningWorkout.id}` : "/app/aluno/corrida/livre"} className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--green)] text-base font-bold text-white shadow-[0_16px_34px_rgba(31,174,91,.34)]">
              <Play className="size-5" />
              {runningWorkout ? "Iniciar corrida" : "Iniciar corrida livre"}
            </Link>
            {runningWorkout ? (
              <Link href="/app/aluno/corrida/livre" className="pressable flex h-10 w-full items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm font-bold text-white/78">
                Corrida livre
              </Link>
            ) : null}
          </div>
        )}
        </div>

      </div>
    </section>
  );
}

function RunMetric({ label, unit, value }: { label: string; unit: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/10 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
      <div className="flex items-baseline gap-1">
        <span className="mono tnum text-[22px] font-bold leading-none">{value}</span>
        <span className="mono text-[10px] font-bold text-white/35">{unit}</span>
      </div>
      <p className="lbl mt-2 text-white/32">{label}</p>
    </div>
  );
}

function formatDistance(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}
