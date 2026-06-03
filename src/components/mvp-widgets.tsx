"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronRight, FileUp, LocateFixed, LockKeyhole, Pause, Play, Plus, Search, Square, Upload, UploadCloud } from "lucide-react";
import { Avatar, Badge, Card, PrimaryButton, ProgressBar, SelectInput, TextInput, cn } from "@/components/ui";
import {
  exercises,
  getExerciseById,
  getStudentPlan,
  money,
  payments,
  runningWorkouts,
  students,
  weeklyFrequency,
  workouts,
  workoutSets,
} from "@/lib/mock-data";
import type { Payment, PaymentStatus, RunningWorkout, Student, Workout } from "@/lib/types";

const workoutTypeLabel: Record<string, string> = {
  strength: "Musculacao",
  running: "Corrida",
  hybrid: "Hibrido",
  functional: "Funcional",
  mobility: "Mobilidade",
  recovery: "Recuperacao",
};

const workoutStatus = {
  pending: { label: "Pendente", tone: "warning" },
  done: { label: "Concluido", tone: "success" },
  locked: { label: "Bloqueado", tone: "danger" },
  available: { label: "Pendente", tone: "warning" },
} as const;

type ReadySequence = {
  name: string;
  owner: string;
  scope: "Global" | "Personal";
  items: string[];
};

type RunningStyle = {
  id: string;
  name: string;
  runningType: string;
  distanceKm: string;
  targetPace: string;
  targetTime: string;
  targetHeartRate: string;
  notes: string;
};

const savedSequencesKey = "phero:exercise-sequences";
const savedRunningStylesKey = "phero:running-styles";
const runningIntervalMarker = "__RUN_INTERVAL__";

const readySequences = [
  { name: "Inferiores completo", owner: "Admin", scope: "Global", items: ["Agachamento livre", "Leg press", "Prancha com toque"] },
  { name: "Peito basico", owner: "Admin", scope: "Global", items: ["Supino inclinado", "Crucifixo"] },
  { name: "Corrida Z2 5km", owner: "Admin", scope: "Global", items: ["Educativos de corrida", "Corrida zona 2 continua"] },
  { name: "Intervalado iniciante", owner: "Admin", scope: "Global", items: ["Educativos de corrida", "Tiros intervalados"] },
  { name: "Longao progressivo", owner: "Admin", scope: "Global", items: ["Corrida zona 2 continua", "Longao progressivo"] },
  { name: "Baixo impacto corrida", owner: "Admin", scope: "Global", items: ["Caminhada corrida baixo impacto", "Educativos de corrida"] },
] satisfies ReadySequence[];

function readBrowserCookie(name: string) {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

function currentSequenceOwnerKey() {
  return decodeURIComponent(readBrowserCookie("app-user-email") ?? readBrowserCookie("demo-user-email") ?? "voce").toLowerCase();
}

function personalSequencesKey(ownerKey: string) {
  return `${savedSequencesKey}:${ownerKey}`;
}

function runningStylesKey(ownerKey: string) {
  return `${savedRunningStylesKey}:${ownerKey}`;
}

function buildRunningIntervalNotes(notes: string, config: { enabled: boolean; runKm: string; walkKm: string }) {
  const cleanNotes = notes.replace(new RegExp(`${runningIntervalMarker}\\{.*?\\}`, "s"), "").trim();
  if (!config.enabled) return cleanNotes;

  return [
    cleanNotes,
    `${runningIntervalMarker}${JSON.stringify({
      type: "distance",
      runKm: Number(config.runKm.replace(",", ".")) || 1,
      walkKm: Number(config.walkKm.replace(",", ".")) || 1,
    })}`,
  ].filter(Boolean).join("\n");
}

function parseRunningInterval(notes?: string) {
  const match = notes?.match(new RegExp(`${runningIntervalMarker}(\\{.*\\})`, "s"));
  if (!match?.[1]) return null;

  try {
    const parsed = JSON.parse(match[1]) as { type?: string; runKm?: number; walkKm?: number };
    if (parsed.type !== "distance" || !parsed.runKm || !parsed.walkKm) return null;
    return {
      runKm: parsed.runKm,
      walkKm: parsed.walkKm,
    };
  } catch {
    return null;
  }
}

function isVisibleSequence(sequence: ReadySequence, ownerKey: string) {
  return sequence.scope === "Global" || sequence.owner === ownerKey || sequence.owner === "Voce";
}

function runningPreset(sequenceName: string) {
  if (sequenceName === "Corrida Z2 5km") {
    return {
      distanceKm: "5",
      runningType: "Zona 2 continua",
      targetHeartRate: "135-150 bpm",
      targetPace: "7:00/km",
      targetTime: "35 min",
    };
  }

  if (sequenceName === "Intervalado iniciante") {
    return {
      distanceKm: "3",
      runningType: "Tiros 1 min forte / 2 min leve",
      targetHeartRate: "150-170 bpm",
      targetPace: "RPE 7/10 nos tiros",
      targetTime: "28 min",
    };
  }

  if (sequenceName === "Longao progressivo") {
    return {
      distanceKm: "8",
      runningType: "Progressivo leve",
      targetHeartRate: "130-160 bpm",
      targetPace: "Comecar confortavel e progredir",
      targetTime: "60 min",
    };
  }

  if (sequenceName === "Baixo impacto corrida") {
    return {
      distanceKm: "2",
      runningType: "Caminhada + corrida leve",
      targetHeartRate: "120-145 bpm",
      targetPace: "Confortavel",
      targetTime: "25 min",
    };
  }

  return null;
}

export function WeeklyFrequency() {
  return (
    <div className="flex h-16 items-end gap-2">
      {weeklyFrequency.map((item) => (
        <div key={item.day} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div className={cn("w-full rounded-md", item.done ? "bg-[var(--green)]" : "bg-[var(--surface-2)]")} style={{ height: item.done ? "80%" : "22%" }} />
          <span className={cn("mono text-[10px] font-bold", item.done ? "text-[var(--ink)]" : "text-[var(--ink-4)]")}>{item.day}</span>
        </div>
      ))}
    </div>
  );
}

export function TodayWorkoutCard({ locked = false, items = workouts, studentId }: { locked?: boolean; items?: Workout[]; studentId?: string }) {
  const studentWorkouts = studentId ? items.filter((item) => item.studentId === studentId) : items;
  const workout = studentWorkouts.find((item) => item.day === "Hoje") ?? studentWorkouts[0];
  const running = workout?.running ?? (workout ? runningWorkouts.find((item) => item.workoutId === workout.id) : undefined);
  const isRunning = workout?.type === "running" || Boolean(running);

  if (!workout && !locked) {
    return (
      <div className="mx-5 rounded-[24px] border border-[var(--hair)] bg-white p-[22px] shadow-[0_8px_26px_rgba(16,18,24,.06)]">
        <Badge tone="blue">TREINO</Badge>
        <h2 className="mt-4 text-xl font-bold tracking-[-0.03em]">Nenhum treino liberado</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-500">Quando seu personal criar um treino, ele aparece aqui.</p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="pressable relative mx-5 overflow-hidden rounded-[24px] bg-[linear-gradient(150deg,#3b1414,#1f0a0a)] p-[22px] text-white shadow-[0_16px_40px_rgba(14,32,52,.35)]">
        <Badge tone="red">PLANO PENDENTE</Badge>
        <h2 className="mt-4 text-[28px] font-bold leading-none tracking-[-0.03em]">Pagamento pendente</h2>
        <p className="mt-2 text-sm text-white/60">Envie seu comprovante para liberar os treinos.</p>
      </div>
    );
  }

  return (
      <div className={cn("pressable relative mx-5 overflow-hidden rounded-[24px] p-[22px] text-white shadow-[0_18px_46px_rgba(14,32,52,.34)]", locked ? "bg-[linear-gradient(150deg,#3b1414,#1f0a0a)]" : isRunning ? "bg-[linear-gradient(155deg,#07111f,#08291b)]" : "bg-[linear-gradient(150deg,#13233b,#0a1422)]")}>
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <Badge tone={locked ? "red" : isRunning ? "amber" : "blue"}>{locked ? "PLANO PENDENTE" : isRunning ? "CORRIDA DE HOJE" : "TREINO DE HOJE"}</Badge>
          <h2 className="mt-4 text-[28px] font-bold leading-none tracking-[-0.03em]">{locked ? "Pagamento pendente" : workout.title}</h2>
          <p className="mt-2 text-sm text-white/60">
            {locked ? "Envie seu comprovante para liberar os treinos." : running ? `${running.distanceKm} km · ${running.targetPace} · ${running.targetTime}` : `${workout.duration} · ${workoutTypeLabel[workout.type ?? "strength"]}`}
          </p>
        </div>
        {locked ? <LockKeyhole className="size-5 text-white/70" /> : null}
      </div>
      <div className="relative mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-[14px] border border-white/10 bg-white/8 p-3">
          <p className="mono text-lg font-bold">{workout.exercises?.length || 4}</p>
          <p className="lbl mt-1 text-white/35">exerc.</p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-white/8 p-3">
          <p className="mono text-lg font-bold">{running ? running.targetTime.replace(" min", "") : workout.duration?.replace(" min", "")}</p>
          <p className="lbl mt-1 text-white/35">min</p>
        </div>
        <div className="rounded-[14px] border border-white/10 bg-white/8 p-3">
          <p className="mono text-lg font-bold">{running ? Math.round(running.distanceKm * 62) : 320}</p>
          <p className="lbl mt-1 text-white/35">kcal</p>
        </div>
      </div>
      <Link href={locked ? "/app/aluno/financeiro" : `/app/aluno/treinos/${workout.id}`} className="relative mt-5 flex h-12 items-center justify-between rounded-[16px] bg-white px-4 text-sm font-bold text-[var(--ink)]">
        <span className="flex items-center gap-2">
        {locked ? <FileUp className="size-4" /> : <Play className="size-4" />}
        {locked ? "Enviar comprovante" : isRunning ? "Iniciar corrida" : "Iniciar treino"}
        </span>
        <ChevronRight className="size-5 text-[var(--blue)]" />
      </Link>
    </div>
  );
}

export function StudentWorkoutTabs({
  initialTab = "strength",
  locked = false,
  items = workouts,
  studentId,
}: {
  initialTab?: "strength" | "running";
  locked?: boolean;
  items?: Workout[];
  studentId?: string;
}) {
  const [tab, setTab] = useState<"strength" | "running">(initialTab);
  const filteredItems = studentId ? items.filter((workout) => workout.studentId === studentId) : items;
  const tabItems = filteredItems.filter((workout) => {
    const running = workout.running ?? runningWorkouts.find((item) => item.workoutId === workout.id);
    const isRunning = workout.type === "running" || Boolean(running);
    return tab === "running" ? isRunning : !isRunning;
  });

  return (
    <section className="px-5">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-[18px] border border-[var(--hair)] bg-white p-1.5 shadow-sm">
        {[
          ["strength", "Musculacao"],
          ["running", "Corrida"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as "strength" | "running")}
            className={cn(
              "pressable h-11 rounded-[14px] text-sm font-bold transition",
              tab === value ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "text-[var(--ink-3)] hover:bg-[var(--blue)] hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {tabItems.map((workout) => {
          const forcedStatus = locked ? "locked" : workout.status;
          const meta = workoutStatus[forcedStatus];
          const running = workout.running ?? runningWorkouts.find((item) => item.workoutId === workout.id);
          const isRunning = workout.type === "running" || Boolean(running);

          return (
            <Link key={workout.id} href={locked ? "/app/aluno/financeiro" : `/app/aluno/treinos/${workout.id}`}>
              <Card className={cn("mb-3 p-0", isRunning && !locked ? "overflow-hidden bg-[linear-gradient(155deg,#07111f,#08291b)] text-white" : "")}>
                <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-semibold uppercase tracking-[0.14em]", isRunning && !locked ? "text-[#ffd28a]" : "text-emerald-700")}>
                      {isRunning ? "Corrida" : workoutTypeLabel[workout.type ?? "strength"]}
                    </p>
                    <h2 className="mt-1 font-semibold">{workout.title}</h2>
                    <p className={cn("mt-1 text-sm", isRunning && !locked ? "text-white/55" : "text-neutral-500")}>
                      {running ? `${workout.day} · ${running.distanceKm} km · ${running.targetTime}` : `${workout.day} · ${workout.duration}`}
                    </p>
                    {running && !locked ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-[10px] border border-white/10 bg-white/8 px-2 py-2">
                          <p className="mono text-sm font-bold">{running.targetPace}</p>
                          <p className="lbl mt-1 text-white/35">Pace</p>
                        </div>
                        <div className="rounded-[10px] border border-white/10 bg-white/8 px-2 py-2">
                          <p className="mono text-sm font-bold">{running.targetTime}</p>
                          <p className="lbl mt-1 text-white/35">Tempo</p>
                        </div>
                        <div className="rounded-[10px] border border-white/10 bg-white/8 px-2 py-2">
                          <p className="mono text-sm font-bold">{running.targetHeartRate.split(" ")[0]}</p>
                          <p className="lbl mt-1 text-white/35">Zona</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={isRunning && !locked ? "amber" : meta.tone}>{locked ? meta.label : isRunning ? "Correr" : meta.label}</Badge>
                    <ChevronRight className={cn("size-4", isRunning && !locked ? "text-white/45" : "text-neutral-400")} />
                  </div>
                </div>
                </div>
              </Card>
            </Link>
          );
        })}
        {!tabItems.length ? (
          <Card>
            <p className="text-sm font-bold text-[var(--ink)]">Nenhum treino de {tab === "running" ? "corrida" : "musculacao"} cadastrado.</p>
            <p className="mt-1 text-xs font-medium text-[var(--ink-3)]">Quando seu personal criar um treino, ele aparece aqui.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

export function WorkoutExecution({ workout }: { workout: Workout }) {
  const running = workout.running ?? runningWorkouts.find((item) => item.workoutId === workout.id) ?? (
    workout.type === "running"
      ? {
          workoutId: workout.id,
          runningType: "Corrida",
          distanceKm: 0,
          targetTime: "30 min",
          targetPace: "Livre",
          targetHeartRate: "Zona livre",
          notes: "",
        }
      : undefined
  );
  const sets = workout.sets?.length ? workout.sets : (workoutSets[workout.id] ?? []);
  const [current, setCurrent] = useState(0);
  const [completedSeries, setCompletedSeries] = useState<Record<number, number[]>>({});
  const [restSeconds, setRestSeconds] = useState(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState(0);
  const progress = sets.length ? Math.round(((current + 1) / sets.length) * 100) : 100;
  const currentSet = sets[current];
  const libraryExercise = currentSet ? getExerciseById(currentSet.exerciseId) : undefined;
  const exercise = currentSet
    ? {
        id: currentSet.exerciseId,
        name: currentSet.exerciseName ?? libraryExercise?.name ?? workout.exercises[current] ?? workout.title,
        mediaPath: currentSet.mediaPath ?? libraryExercise?.mediaPath,
      }
    : undefined;
  const checkedSeries = completedSeries[current] ?? [];
  const seriesDone = checkedSeries.length;
  const restProgress = restTotalSeconds ? Math.max(0, Math.min(100, ((restTotalSeconds - restSeconds) / restTotalSeconds) * 100)) : 0;

  useEffect(() => {
    if (restSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setRestSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [restSeconds]);

  function parseRestTime(value: string) {
    const normalized = value.trim().toLowerCase();
    const minutesMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(min|m)/);
    const secondsMatch = normalized.match(/(\d+)\s*(s|seg)/);
    const clockMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);

    if (clockMatch) return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);
    if (minutesMatch) return Math.round(Number(minutesMatch[1].replace(",", ".")) * 60);
    if (secondsMatch) return Number(secondsMatch[1]);

    const number = Number(normalized.replace(/\D/g, ""));
    return Number.isFinite(number) && number > 0 ? number : 60;
  }

  function formatRestTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function startRestTimer() {
    if (!currentSet) return;
    const seconds = parseRestTime(currentSet.restTime);
    setRestTotalSeconds(seconds);
    setRestSeconds(seconds);
  }

  function toggleSeries(seriesIndex: number) {
    const isAlreadyChecked = checkedSeries.includes(seriesIndex);
    setCompletedSeries((currentState) => {
      const currentSeries = currentState[current] ?? [];
      const nextSeries = isAlreadyChecked
        ? currentSeries.filter((item) => item !== seriesIndex)
        : [...currentSeries, seriesIndex];

      return {
        ...currentState,
        [current]: nextSeries,
      };
    });

    if (!isAlreadyChecked) {
      startRestTimer();
    }
  }

  function completeExercise() {
    if (currentSet) {
      setCompletedSeries((currentState) => ({
        ...currentState,
        [current]: Array.from({ length: currentSet.sets }, (_, index) => index),
      }));
    }

    setRestSeconds(0);
    setRestTotalSeconds(0);
    setCurrent((value) => Math.min(value + 1, sets.length - 1));
  }

  if (running) return <RunningExecution running={running} />;

  return (
    <section className="space-y-4 px-5">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Exercicio atual</p>
            <h2 className="mt-1 text-xl font-bold leading-tight">{exercise?.name ?? workout.title}</h2>
          </div>
          <Badge tone="warning">{progress}%</Badge>
        </div>
        <ProgressBar className="mt-4" value={progress} tone="green" />
        <div className="mt-4 aspect-video overflow-hidden rounded-lg bg-neutral-950">
          {exercise?.mediaPath?.startsWith("http") ? <video src={exercise.mediaPath} controls className="size-full object-cover" /> : <div className="grid size-full place-items-center px-5 text-center text-sm font-semibold text-white">Video do exercicio<br />{exercise?.name}</div>}
        </div>
        {currentSet ? (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <WorkoutMiniMetric label="Series" value={String(currentSet.sets)} />
            <WorkoutMiniMetric label="Reps" value={currentSet.reps} />
            <WorkoutMiniMetric label="Carga" value={currentSet.load} />
            <WorkoutMiniMetric label="Descanso" value={currentSet.restTime} />
          </div>
        ) : null}
        {currentSet ? (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="lbl">Series · {seriesDone}/{currentSet.sets} concluidas</p>
              {restTotalSeconds ? <p className="mono text-xs font-bold text-[var(--blue)]">Descanso {formatRestTime(restSeconds)}</p> : null}
            </div>
            {restTotalSeconds ? (
              <div className="mt-3 rounded-[16px] border border-[var(--hair)] bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[var(--ink)]">{restSeconds > 0 ? "Cronometro de descanso" : "Descanso concluido"}</p>
                    <p className="mt-1 text-xs font-medium text-neutral-500">Proxima serie quando estiver pronto.</p>
                  </div>
                  <span className="mono tnum text-2xl font-bold text-[var(--ink)]">{formatRestTime(restSeconds)}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full bg-[var(--blue)]" style={{ width: `${restProgress}%` }} />
                </div>
              </div>
            ) : null}
            <div className="mt-3 grid gap-2">
              {Array.from({ length: currentSet.sets }, (_, index) => {
                const checked = checkedSeries.includes(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleSeries(index)}
                    className={cn(
                      "pressable flex h-14 items-center gap-3 rounded-[14px] border px-3 text-left",
                      checked ? "border-[var(--green)] bg-[var(--green-wash)]" : "border-[var(--hair)] bg-[var(--surface)]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border text-white",
                        checked ? "border-[var(--green)] bg-[var(--green)]" : "border-neutral-300 bg-white",
                      )}
                    >
                      {checked ? <Check className="size-4" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold text-[var(--ink)]">Serie {index + 1}</span>
                    <span className="mono shrink-0 text-xs font-semibold text-neutral-400">
                      {currentSet.reps} x {currentSet.load}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        <button onClick={completeExercise} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 text-sm font-semibold text-white">
          <Check className="size-4" /> Concluir exercicio
        </button>
      </Card>
      <Card>
        <label className="text-sm font-semibold">Feedback do treino</label>
        <textarea className="mt-2 min-h-24 w-full rounded-lg border border-neutral-200 p-3 text-sm outline-none focus:border-neutral-950" placeholder="Como foi o treino hoje?" />
        <div className="mt-3 flex gap-3 rounded-[16px] border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
          <Bell className="mt-0.5 size-4 shrink-0 text-[var(--blue)]" />
          <p className="leading-6">
            Lembrete: finalize o treino so depois de marcar as series concluidas e registrar como foi o treino. Esse feedback ajuda seu personal a ajustar o proximo treino.
          </p>
        </div>
        <PrimaryButton className="mt-3 w-full">Concluir treino</PrimaryButton>
      </Card>
    </section>
  );
}

export function RunningExecution({ running }: { running: RunningWorkout }) {
  const [tracking, setTracking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [distance, setDistance] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState("GPS pronto para iniciar.");
  const [gpsPermission, setGpsPermission] = useState<"unknown" | "granted" | "prompt" | "denied">("unknown");
  const watchId = useRef<number | null>(null);
  const lastPosition = useRef<{ coords: GeolocationCoordinates; timestamp: number } | null>(null);
  const maxCountableAccuracyMeters = 35;

  useEffect(() => {
    if (!("permissions" in navigator)) return;

    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((permission) => {
        setGpsPermission(permission.state);
        permission.onchange = () => setGpsPermission(permission.state);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!tracking) return;

    const timer = window.setInterval(() => {
      setSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [tracking]);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function averagePace() {
    if (distance <= 0.02 || seconds === 0) return "--";
    const paceSeconds = Math.round(seconds / distance);
    const minutes = Math.floor(paceSeconds / 60);
    const remainingSeconds = paceSeconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}/km`;
  }

  function distanceBetween(from: GeolocationCoordinates, to: GeolocationCoordinates) {
    const radiusKm = 6371;
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const deltaLat = toRadians(to.latitude - from.latitude);
    const deltaLon = toRadians(to.longitude - from.longitude);
    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function processGpsPosition(position: GeolocationPosition) {
    const currentAccuracy = position.coords.accuracy;
    setAccuracy(currentAccuracy);
    setGpsPermission("granted");

    if (currentAccuracy > maxCountableAccuracyMeters) {
      setGpsStatus(`Sinal de GPS fraco. Aguardando precisao abaixo de ${maxCountableAccuracyMeters}m para contar distancia real.`);
      return;
    }

    if (!lastPosition.current) {
      lastPosition.current = { coords: position.coords, timestamp: position.timestamp };
      setGpsStatus("GPS calibrado. Comece a se mover para contabilizar distancia real.");
      return;
    }

    const previous = lastPosition.current;
    const nextDistanceKm = distanceBetween(previous.coords, position.coords);
    const nextDistanceMeters = nextDistanceKm * 1000;
    const elapsedSeconds = Math.max((position.timestamp - previous.timestamp) / 1000, 1);
    const speedMetersPerSecond = nextDistanceMeters / elapsedSeconds;
    const minMovementMeters = Math.max(
      12,
      Math.min(28, Math.max(currentAccuracy, previous.coords.accuracy) * 0.55),
    );

    if (nextDistanceMeters < minMovementMeters) {
      setGpsStatus("GPS ativo. Parado ou deslocamento pequeno, distancia nao contabilizada.");
      return;
    }

    if (speedMetersPerSecond > 8 || nextDistanceKm > 0.25) {
      setGpsStatus("GPS ativo. Salto de sinal ignorado para evitar distancia falsa.");
      lastPosition.current = { coords: position.coords, timestamp: position.timestamp };
      return;
    }

    setDistance((value) => value + nextDistanceKm);
    lastPosition.current = { coords: position.coords, timestamp: position.timestamp };
    setGpsStatus("GPS ativo. Distancia real sendo calculada.");
  }

  function gpsErrorMessage(error: GeolocationPositionError) {
    if (error.code === error.PERMISSION_DENIED) {
      return "GPS bloqueado. Libere a localizacao nas permissoes do navegador e tente novamente.";
    }

    if (error.code === error.POSITION_UNAVAILABLE) {
      return "Nao foi possivel encontrar sua localizacao. Tente em area aberta ou com melhor sinal.";
    }

    if (error.code === error.TIMEOUT) {
      return "O GPS demorou para responder. Tente iniciar novamente.";
    }

    return "Nao foi possivel acessar o GPS.";
  }

  function canUseGps() {
    if (!("geolocation" in navigator)) {
      setGpsStatus("GPS indisponivel neste navegador. Preencha os dados manualmente no pos-treino.");
      return false;
    }

    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
    if (window.location.protocol !== "https:" && !isLocalhost) {
      setGpsStatus("GPS real exige HTTPS em producao. Publique o app com HTTPS para liberar a localizacao.");
      return false;
    }

    if (gpsPermission === "denied") {
      setGpsStatus("GPS bloqueado. Abra as permissoes do site no navegador e permita Localizacao.");
      return false;
    }

    return true;
  }

  function startRun() {
    if (!canUseGps()) return;

    setFinished(false);
    setTracking(true);
    setGpsStatus("Buscando sinal de GPS...");
    lastPosition.current = null;

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        processGpsPosition(position);
      },
      (error) => {
        setTracking(false);
        if (error.code === error.PERMISSION_DENIED) setGpsPermission("denied");
        setGpsStatus(gpsErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      },
    );
  }

  function requestGpsAccess() {
    if (!canUseGps()) return;

    setGpsStatus("Solicitando permissao de localizacao...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        processGpsPosition(position);
        setGpsStatus(
          position.coords.accuracy <= maxCountableAccuracyMeters
            ? "GPS liberado e calibrado. Agora voce pode iniciar a corrida com dados reais."
            : `GPS liberado, mas o sinal ainda esta fraco (${Math.round(position.coords.accuracy)}m). Aguarde melhorar antes de iniciar.`,
        );
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setGpsPermission("denied");
        setGpsStatus(gpsErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      },
    );
  }

  function pauseRun() {
    setTracking(false);
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setGpsStatus("Corrida pausada.");
  }

  function finishRun() {
    pauseRun();
    setFinished(true);
    setGpsStatus("Corrida concluida. Revise os dados do pos-treino.");
  }

  const zoneText = running.targetHeartRate.split(" ")[0] || "Livre";
  const distanceGoal = running.distanceKm > 0 ? running.distanceKm : distance;
  const intervalConfig = parseRunningInterval(running.notes);
  const intervalStatus = intervalConfig ? {
    ...getIntervalStatus(distance, intervalConfig.runKm, intervalConfig.walkKm),
    runKm: intervalConfig.runKm,
    walkKm: intervalConfig.walkKm,
  } : null;

  return (
    <section className="px-5">
      <div className="min-h-[560px] overflow-hidden rounded-[30px] bg-[#07111f] p-5 text-white shadow-[0_24px_54px_rgba(7,17,31,.36)]">
        <div className="flex items-center justify-between">
          <p className="lbl text-white/45">Corrida</p>
          <span className={cn("mono rounded-full px-2.5 py-1 text-[11px] font-bold", tracking ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/60")}>
            {tracking ? "GPS ativo" : finished ? "Finalizada" : "Pronta"}
          </span>
        </div>

        <div className="pt-8">
          <span className="mono inline-flex rounded-full bg-[#87570f]/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#ffd28a]">
            {running.runningType}
          </span>
          <h2 className="mt-3 max-w-[210px] text-[26px] font-bold leading-none tracking-[-0.04em]">Sua meta<br />de hoje</h2>
          <div className="mt-4 flex items-end justify-center gap-2">
            <span className="mono tnum text-[clamp(50px,15vw,68px)] font-bold leading-none tracking-[-0.08em]">{distanceGoal || "--"}</span>
            <span className="mb-3 text-xl font-bold text-white/40">km</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-[12px] border border-white/10 bg-white/8 p-2.5">
            <p className="mono text-lg font-bold">{running.targetPace}</p>
            <p className="lbl mt-1 text-white/35">Pace alvo</p>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-white/8 p-2.5">
            <p className="mono text-lg font-bold">{running.targetTime}</p>
            <p className="lbl mt-1 text-white/35">Tempo est.</p>
          </div>
          <div className="rounded-[12px] border border-white/10 bg-white/8 p-2.5">
            <p className="mono text-lg font-bold">{zoneText}</p>
            <p className="lbl mt-1 text-white/35">Zona</p>
          </div>
        </div>

        <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[.06] p-3">
          {intervalStatus ? (
            <div className={cn(
              "mb-3 rounded-[16px] border p-3",
              intervalStatus.phase === "run"
                ? "border-emerald-400/25 bg-emerald-400/12"
                : "border-[#ffd28a]/25 bg-[#87570f]/22",
            )}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="lbl text-white/42">Bloco atual</p>
                  <h3 className="mt-1 text-xl font-bold leading-none">{intervalStatus.phase === "run" ? "Correr" : "Caminhar"}</h3>
                  <p className="mt-1.5 text-xs font-semibold text-white/50">
                    {intervalStatus.runKm} km correndo · {intervalStatus.walkKm} km andando
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono tnum text-xl font-bold">{intervalStatus.remainingKm.toFixed(2)}</p>
                  <p className="lbl mt-1 text-white/35">km p/ trocar</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-white" style={{ width: `${intervalStatus.progress}%` }} />
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="mono tnum text-xl font-bold">{distance.toFixed(2)}</p>
              <p className="lbl mt-1 text-white/35">km reais</p>
            </div>
            <div>
              <p className="mono tnum text-xl font-bold">{formatTime(seconds)}</p>
              <p className="lbl mt-1 text-white/35">tempo</p>
            </div>
            <div>
              <p className="mono tnum text-xl font-bold">{averagePace()}</p>
              <p className="lbl mt-1 text-white/35">pace medio</p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 text-xs font-medium leading-5 text-white/45">
            <LocateFixed className="mt-0.5 size-4 shrink-0" />
            <span>{gpsStatus}{accuracy ? ` Precisao aproximada: ${Math.round(accuracy)}m.` : ""}</span>
          </div>
          {!tracking && gpsPermission !== "granted" ? (
            <button type="button" onClick={requestGpsAccess} className="mt-2 h-9 w-full rounded-[12px] border border-white/10 bg-white/8 text-xs font-bold text-white transition hover:bg-white/12">
              Permitir GPS
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2">
          {!tracking ? (
            <button onClick={startRun} className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-emerald-500 text-sm font-bold text-white shadow-[0_10px_26px_rgba(34,197,94,.28)]">
              <Play className="size-4" /> {seconds > 0 ? "Continuar corrida" : gpsPermission === "granted" ? "Iniciar corrida" : "Permitir GPS e iniciar"}
            </button>
          ) : (
            <button onClick={pauseRun} className="pressable flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-white text-sm font-bold text-[#07111f]">
              <Pause className="size-4" /> Pausar corrida
            </button>
          )}
          <button onClick={finishRun} className="pressable flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 text-sm font-bold text-white/80">
            <Square className="size-4" /> Concluir corrida
          </button>
        </div>
      </div>
      <Card>
        <h2 className="font-semibold">Pos-treino</h2>
        <div className="mt-4 grid gap-3">
          <TextInput label="Distancia realizada" placeholder="5,1 km" defaultValue={distance ? `${distance.toFixed(2)} km` : undefined} />
          <TextInput label="Tempo" placeholder="34:42" defaultValue={seconds ? formatTime(seconds) : undefined} />
          <TextInput label="Pace medio" placeholder="6:48/km" defaultValue={distance > 0.02 ? averagePace() : undefined} />
          <TextInput label="FC media" placeholder="145 bpm" />
          <SelectInput label="Esforco" options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]} />
          <TextInput label="Observacoes" placeholder="Sensacoes, dores ou ajustes" />
        </div>
      </Card>
    </section>
  );
}

function getIntervalStatus(distanceKm: number, runKm: number, walkKm: number) {
  const cycleKm = runKm + walkKm;
  const position = cycleKm > 0 ? distanceKm % cycleKm : 0;
  const isRun = position < runKm;
  const segmentKm = isRun ? runKm : walkKm;
  const segmentPosition = isRun ? position : position - runKm;
  const remainingKm = Math.max(segmentKm - segmentPosition, 0);
  const progress = segmentKm ? Math.min(100, Math.max(0, (segmentPosition / segmentKm) * 100)) : 0;

  return {
    phase: isRun ? "run" : "walk",
    remainingKm,
    progress,
  } as const;
}

function WorkoutMiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-stone-100 p-3">
      <p className="text-xs font-semibold text-neutral-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

export function EvolutionCharts() {
  const bars = [45, 62, 58, 74, 82, 88];
  return (
    <Card className="mx-5">
      <h2 className="font-semibold">Graficos simples</h2>
      <div className="mt-4 flex h-32 items-end gap-2">
        {bars.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t bg-emerald-600" style={{ height: `${height}%` }} />
            <span className="text-[10px] font-semibold text-neutral-500">S{index + 1}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ReceiptUpload({ paymentItems = payments, studentItems = students, studentId }: { paymentItems?: Payment[]; studentItems?: Student[]; studentId?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const payment = paymentItems.find((item) => item.studentId === studentId && item.status !== "approved" && item.status !== "paid");
  const student = studentItems.find((item) => item.id === payment?.studentId) ?? studentItems.find((item) => item.id === studentId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payment || !student) {
      setStatus("error");
      setMessage("Nenhum pagamento pendente encontrado.");
      return;
    }
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("sending");
    setMessage("");

    const response = await fetch("/api/payments/upload-receipt", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      setStatus("error");
      setMessage(result.error ?? "Nao foi possivel enviar o comprovante.");
      return;
    }

    setStatus("sent");
    setMessage("Seu comprovante foi recebido e está sendo analisado.");
    document.cookie = "app-payment-status=waiting_analysis; path=/; max-age=604800; SameSite=Lax";
    document.cookie = "app-access-status=blocked; path=/; max-age=604800; SameSite=Lax";
  }

  if (!payment || !student) {
    return (
      <Card className="mx-5">
        <p className="text-sm font-semibold text-neutral-600">Nenhuma cobrança pendente para enviar comprovante.</p>
      </Card>
    );
  }

  return (
    <Card className="mx-5">
      <form onSubmit={submit}>
        <input type="hidden" name="payment_id" value={payment?.id ?? ""} />
        <input type="hidden" name="student_id" value={student?.id ?? ""} />
        <input type="hidden" name="trainer_id" value={payment?.personalId ?? ""} />
        <input type="hidden" name="student_name" value={student?.name ?? ""} />
        <input type="hidden" name="trainer_name" value="Personal" />
        <input type="hidden" name="expected_amount" value={payment?.amount ?? ""} />
        <input type="hidden" name="due_date" value={payment?.dueDate ?? ""} />
        <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--hair)] bg-[var(--surface)] text-sm font-semibold text-neutral-600">
          <Upload className="size-5" />
          Selecionar arquivo
          <input className="sr-only" name="file" type="file" accept="image/jpeg,image/png,application/pdf" required />
        </label>
        <button disabled={status === "sending"} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.32)] disabled:opacity-60">
          <UploadCloud className="size-4" />
          {status === "sending" ? "Enviando..." : "Enviar comprovante"}
        </button>
      </form>
      {message ? (
        <p className={cn("mt-3 text-sm font-semibold", status === "error" ? "text-rose-700" : "text-emerald-700")}>{message}</p>
      ) : null}
    </Card>
  );
}

export function StudentSearchList({ items = students }: { items?: Student[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const filtered = items.filter((student) => {
    const matchesQuery = student.name.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "todos" || student.accessStatus === status;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="px-5">
      <CreateStudentCard />
      <div className="grid gap-3">
        <label className="relative">
          <Search className="absolute left-4 top-3.5 size-4 text-[var(--ink-4)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 w-full rounded-[16px] border border-[var(--hair)] bg-white pl-11 pr-3 text-sm font-semibold outline-none focus:border-[var(--blue)]" placeholder="Buscar aluno..." />
        </label>
        <div className="-mx-5 overflow-x-auto px-5 pb-1">
          <div className="flex gap-2">
            {[
              ["todos", "Todos"],
              ["active", "Ativos"],
              ["blocked", "Bloqueados"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={cn(
                  "pressable h-10 shrink-0 rounded-full px-4 text-sm font-bold",
                  status === value ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "border border-[var(--hair)] bg-white text-[var(--ink-3)] hover:border-[var(--blue)] hover:bg-[var(--blue)] hover:text-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((student) => (
          <Link key={student.id} href={`/app/personal/alunos/${student.id}`}>
            <Card className="pressable mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={student.name} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold">{student.name}</h2>
                  <p className="mt-1 truncate text-sm text-[var(--ink-3)]">{student.goal || "Sem objetivo cadastrado"}</p>
                </div>
                <Badge tone={student.accessStatus === "active" ? "success" : "danger"} dot>{student.accessStatus === "active" ? "Ativo" : "Bloqueado"}</Badge>
                <ChevronRight className="size-4 text-[var(--ink-4)]" />
              </div>
            </Card>
          </Link>
        ))}
        {!filtered.length ? (
          <Card>
            <p className="text-sm font-semibold text-neutral-600">Nenhum aluno encontrado.</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">Cadastre um aluno acima para iniciar os testes com dados reais.</p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function CreateStudentCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [goal, setGoal] = useState("");
  const [password, setPassword] = useState("12345678");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, birthDate, goal, password }),
      });
      const result = (await response.json()) as { ok?: boolean; id?: string; error?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Nao foi possivel criar aluno.");
      }

      setMessage("Aluno criado no banco de dados.");
      setFullName("");
      setEmail("");
      setPhone("");
      setBirthDate("");
      setGoal("");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel criar aluno.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="lbl">Cadastro real</p>
          <h2 className="mt-1 text-sm font-bold">Criar aluno pelo personal</h2>
        </div>
        <Plus className="size-5 text-[var(--blue)]" />
      </button>
      {open ? (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <FormInput label="Nome completo" value={fullName} onChange={setFullName} placeholder="Nome do aluno" />
          <FormInput label="Email" value={email} onChange={setEmail} placeholder="aluno@email.com" />
          <FormInput label="Senha inicial" value={password} onChange={setPassword} placeholder="12345678" />
          <FormInput label="Celular" value={phone} onChange={setPhone} placeholder="(11) 99999-9999" />
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Data de nascimento
            <input
              className="h-12 min-w-0 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]"
              onChange={(event) => setBirthDate(event.target.value)}
              type="date"
              value={birthDate}
            />
          </label>
          <FormInput label="Objetivo" value={goal} onChange={setGoal} placeholder="Ex: ganhar massa magra" />
          <button
            disabled={saving}
            className="pressable h-11 rounded-[13px] bg-[var(--blue)] text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Criando..." : "Criar aluno"}
          </button>
          {message ? <p className="text-sm font-semibold text-[var(--ink-2)]">{message}</p> : null}
        </form>
      ) : null}
    </Card>
  );
}

export function CreateWorkoutForm({ studentItems = students, exerciseItems = exercises, trainerId }: { studentItems?: Student[]; exerciseItems?: typeof exercises; trainerId?: string }) {
  const router = useRouter();
  const [workoutType, setWorkoutType] = useState("Hibrido");
  const [studentId, setStudentId] = useState(studentItems[0]?.id ?? "");
  const [title, setTitle] = useState("Hybrid Full Body");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [sequenceName, setSequenceName] = useState("Nenhuma");
  const [availableSequences, setAvailableSequences] = useState<ReadySequence[]>(readySequences);
  const [selectedExerciseId, setSelectedExerciseId] = useState(exerciseItems[0]?.id ?? "");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10-12");
  const [load, setLoad] = useState("Moderada");
  const [restTime, setRestTime] = useState("60s");
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<Array<{ exerciseId: string; sets: number; reps: string; load: string; restTime: string; notes?: string }>>(
    exerciseItems[0] ? [{ exerciseId: exerciseItems[0].id, sets: 3, reps: "10-12", load: "A definir", restTime: "60s" }] : [],
  );
  const [runningType, setRunningType] = useState("Zona 2 apos forca");
  const [distanceKm, setDistanceKm] = useState("3");
  const [targetPace, setTargetPace] = useState("7:00/km");
  const [targetTime, setTargetTime] = useState("21 min");
  const [targetHeartRate, setTargetHeartRate] = useState("135-150 bpm");
  const [runningNotes, setRunningNotes] = useState("");
  const [runningMode, setRunningMode] = useState<"continuous" | "intervalDistance">("continuous");
  const [runSegmentKm, setRunSegmentKm] = useState("1");
  const [walkSegmentKm, setWalkSegmentKm] = useState("1");
  const [runningStyles, setRunningStyles] = useState<RunningStyle[]>([]);
  const [feedback, setFeedback] = useState("");
  const workoutTypes = ["Musculacao", "Corrida", "Hibrido", "Funcional", "Mobilidade", "Recuperacao"];
  const showStrengthFields = ["Musculacao", "Hibrido", "Funcional", "Mobilidade", "Recuperacao"].includes(workoutType);
  const showRunningFields = ["Corrida", "Hibrido"].includes(workoutType);
  const typeMap: Record<string, NonNullable<Workout["type"]>> = {
    Musculacao: "strength",
    Corrida: "running",
    Hibrido: "hybrid",
    Funcional: "functional",
    Mobilidade: "mobility",
    Recuperacao: "recovery",
  };
  const selectedStudent = studentItems.find((student) => student.id === studentId);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const ownerKey = currentSequenceOwnerKey();
      const savedSequences =
        window.localStorage.getItem(personalSequencesKey(ownerKey)) ??
        window.localStorage.getItem(savedSequencesKey);

      if (!savedSequences) {
        setAvailableSequences(readySequences);
        return;
      }

      try {
        const parsedSequences = JSON.parse(savedSequences) as Array<Partial<ReadySequence> & { count?: number }>;
        const visiblePersonalSequences = parsedSequences
          .filter((sequence): sequence is ReadySequence => (
            sequence.scope === "Personal" &&
            typeof sequence.name === "string" &&
            typeof sequence.owner === "string" &&
            Array.isArray(sequence.items)
          ))
          .filter((sequence) => isVisibleSequence(sequence, ownerKey))
          .map((sequence) => ({ ...sequence, owner: ownerKey }));

        setAvailableSequences([...visiblePersonalSequences, ...readySequences]);
      } catch {
        window.localStorage.removeItem(personalSequencesKey(ownerKey));
        setAvailableSequences(readySequences);
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const ownerKey = currentSequenceOwnerKey();
      const savedStyles = window.localStorage.getItem(runningStylesKey(ownerKey));

      if (!savedStyles) {
        setRunningStyles([]);
        return;
      }

      try {
        const parsedStyles = JSON.parse(savedStyles) as RunningStyle[];
        setRunningStyles(parsedStyles.filter((style) => style.name && style.runningType));
      } catch {
        window.localStorage.removeItem(runningStylesKey(ownerKey));
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  function handleWorkoutTypeChange(type: string) {
    setWorkoutType(type);
    setFeedback("");
    if (!title || ["Hybrid Full Body", "Corrida Z2", "Inferiores A"].includes(title)) {
      setTitle(type === "Corrida" ? "Corrida Z2" : type === "Hibrido" ? "Hybrid Full Body" : "Inferiores A");
    }
  }

  function applySequence(value: string) {
    setSequenceName(value);
    setFeedback("");

    const sequence = availableSequences.find((item) => item.name === value);
    if (!sequence) return;
    const running = runningPreset(sequence.name);

    if (running) {
      setRunningType(running.runningType);
      setDistanceKm(running.distanceKm);
      setTargetPace(running.targetPace);
      setTargetTime(running.targetTime);
      setTargetHeartRate(running.targetHeartRate);
      setRunningNotes("Sequencia de corrida pre-programada.");
      if (workoutType === "Musculacao") setWorkoutType("Corrida");
      if (!title.trim() || ["Hybrid Full Body", "Corrida Z2", "Inferiores A"].includes(title)) setTitle(sequence.name);
    }

    const sequenceExercises = sequence.items
      .map((name) => exerciseItems.find((exercise) => exercise.name === name))
      .filter(Boolean)
      .map((exercise) => ({
        exerciseId: exercise!.id,
        sets: 3,
        reps: "10-12",
        load: "A definir",
        restTime: "60s",
      }));

    if (sequenceExercises.length) setSelectedExercises(sequenceExercises);
  }

  function applyRunningStyle(style: RunningStyle) {
    setRunningType(style.runningType);
    setDistanceKm(style.distanceKm);
    setTargetPace(style.targetPace);
    setTargetTime(style.targetTime);
    setTargetHeartRate(style.targetHeartRate);
    setRunningNotes(style.notes);
    setFeedback("");
    if (!title.trim() || ["Hybrid Full Body", "Corrida Z2", "Inferiores A"].includes(title)) setTitle(style.name);
  }

  function addExercise() {
    if (!selectedExerciseId) return;

    const parsedSets = Number(sets);
    if (!parsedSets || parsedSets < 1) {
      setFeedback("Informe o numero de series.");
      return;
    }

    setSelectedExercises((current) => [
      ...current,
      {
        exerciseId: selectedExerciseId,
        sets: parsedSets,
        reps,
        load,
        restTime,
        notes: exerciseNotes || undefined,
      },
    ]);
    setExerciseNotes("");
    setFeedback("");
  }

  function removeExercise(indexToRemove: number) {
    setSelectedExercises((current) => current.filter((_, index) => index !== indexToRemove));
    setFeedback("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!studentId) {
      setFeedback("Selecione a aluna.");
      return;
    }

    if (!title.trim()) {
      setFeedback("Informe o titulo do treino.");
      return;
    }

    if (showStrengthFields && selectedExercises.length === 0) {
      setFeedback("Adicione pelo menos um exercicio no bloco de forca.");
      return;
    }

    if (showRunningFields && !runningType.trim()) {
      setFeedback("Preencha o bloco de corrida do treino hibrido.");
      return;
    }

    const workoutId = `workout-${window.crypto.randomUUID()}`;
    const exerciseNames = selectedExercises
      .map((item) => exerciseItems.find((exercise) => exercise.id === item.exerciseId)?.name)
      .filter((name): name is string => Boolean(name));
    const durationMinutes = showRunningFields
      ? Number.parseInt(targetTime, 10) + (showStrengthFields ? selectedExercises.length * 9 : 0)
      : Math.max(30, selectedExercises.length * 10);

    const workout = {
      id: workoutId,
      studentId,
      personalId: trainerId ?? "",
      title: title.trim(),
      type: typeMap[workoutType],
      day: "Novo",
      scheduledDate,
      duration: `${Number.isFinite(durationMinutes) ? durationMinutes : 45} min`,
      status: "pending",
      exercises: exerciseNames,
    } satisfies Workout;
    const running = showRunningFields
      ? {
        workoutId,
        runningType,
        distanceKm: Number(distanceKm) || 0,
        targetTime: targetTime.trim() || "Livre",
        targetPace: targetPace.trim() || "Livre",
        targetHeartRate,
        notes: buildRunningIntervalNotes(runningNotes || description, {
          enabled: runningMode === "intervalDistance",
          runKm: runSegmentKm,
          walkKm: walkSegmentKm,
        }),
      }
      : undefined;

    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: workout.personalId,
          studentId,
          title: workout.title,
          type: workout.type,
          description,
          scheduledDate,
          exercises: selectedExercises,
          running,
        }),
      });

      const result = (await response.json()) as { persisted?: boolean; id?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Nao foi possivel criar o treino.");

      if (result.persisted && result.id) {
        setFeedback(`Treino ${workoutType.toLowerCase()} criado no banco para ${selectedStudent?.name ?? "a aluna"}.`);
        router.push(`/app/personal/alunos/${studentId}`);
        return;
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel criar no Supabase. Salvando localmente.");
    }

    setFeedback("Nao foi possivel salvar no banco. Verifique se o aluno e o personal foram criados no Supabase.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-5">
      <Card>
        <p className="lbl">Tipo de treino</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {workoutTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleWorkoutTypeChange(type)}
              className={cn(
                "pressable h-10 shrink-0 rounded-[12px] px-4 text-sm font-bold",
                workoutType === type ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "bg-[var(--surface)] text-neutral-600 hover:bg-[var(--blue)] hover:text-white",
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="lbl">Dados do treino</p>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Aluna
            <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
              {studentItems.map((student) => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
            {!studentItems.length ? <span className="text-xs font-semibold text-[var(--red-ink)]">Crie um aluno real antes de prescrever treino.</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Titulo
            <input className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={workoutType === "Corrida" ? "Corrida Z2" : workoutType === "Hibrido" ? "Hybrid Full Body" : "Inferiores A"} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Data
            <input className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" type="date" value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Descricao
            <textarea className="min-h-24 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Objetivo, foco e observacoes gerais" />
          </label>
        </div>
      </Card>

      {showStrengthFields ? (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl">{workoutType === "Hibrido" ? "Bloco de forca" : "Exercicios"}</p>
              <h2 className="mt-2 font-bold">{workoutType}</h2>
            </div>
            <Badge tone="success">Biblioteca</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Sequencia pronta
              <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={sequenceName} onChange={(event) => applySequence(event.target.value)}>
                {["Nenhuma", ...availableSequences.map((sequence) => sequence.name)].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <p className="text-xs font-medium leading-5 text-neutral-500">Crie e gerencie sequencias em Exercicios. Aqui voce so escolhe uma pronta para este treino.</p>
            <div className="grid gap-2">
              {selectedExercises.map((item, index) => {
                const exercise = exerciseItems.find((entry) => entry.id === item.exerciseId);
                return (
                  <div key={`${item.exerciseId}-${index}`} className="rounded-[14px] border border-[var(--hair)] bg-[var(--surface)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{index + 1}. {exercise?.name ?? "Exercicio"}</p>
                        <p className="mt-1 text-xs font-medium text-neutral-500">{item.sets} series · {item.reps} · {item.load} · descanso {item.restTime}</p>
                      </div>
                      <button type="button" onClick={() => removeExercise(index)} className="rounded-[10px] bg-white px-3 py-2 text-xs font-bold text-neutral-500">Remover</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Exercicio da biblioteca
              <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={selectedExerciseId} onChange={(event) => setSelectedExerciseId(event.target.value)}>
                {exerciseItems.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Series" value={sets} onChange={setSets} placeholder="4" />
              <FormInput label="Repeticoes" value={reps} onChange={setReps} placeholder="8-10" />
              <FormInput label="Carga" value={load} onChange={setLoad} placeholder="60kg" />
              <FormInput label="Descanso" value={restTime} onChange={setRestTime} placeholder="90s" />
            </div>
            <FormInput label="Observacoes" value={exerciseNotes} onChange={setExerciseNotes} placeholder="Controle de movimento" />
            <button type="button" onClick={addExercise} className="pressable h-11 rounded-[13px] border border-[var(--hair)] bg-white text-sm font-bold text-[var(--blue)]">Adicionar exercicio</button>
          </div>
        </Card>
      ) : null}

      {showRunningFields ? (
        <Card>
          <p className="lbl">{workoutType === "Hibrido" ? "Bloco de corrida" : "Parametros de corrida"}</p>
          <div className="mt-4 grid gap-3">
            {runningStyles.length ? (
              <div className="grid gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">Estilos salvos</p>
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {runningStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => applyRunningStyle(style)}
                      className="pressable h-10 shrink-0 rounded-[12px] bg-[var(--surface)] px-3 text-xs font-bold text-[var(--ink)]"
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <FormInput label="Tipo de corrida" value={runningType} onChange={setRunningType} placeholder="Zona 2, tiro, longao..." />
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-neutral-700">Modo da corrida</p>
              <div className="grid grid-cols-2 gap-2 rounded-[16px] border border-[var(--hair)] bg-white p-1.5">
                <button
                  type="button"
                  onClick={() => setRunningMode("continuous")}
                  className={cn(
                    "pressable h-11 rounded-[13px] text-sm font-bold",
                    runningMode === "continuous" ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "text-neutral-500 hover:bg-[var(--blue)] hover:text-white",
                  )}
                >
                  Contínua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunningMode("intervalDistance");
                    if (runningType === "Zona 2 apos forca") setRunningType("Intervalado correr/caminhar");
                  }}
                  className={cn(
                    "pressable h-11 rounded-[13px] text-sm font-bold",
                    runningMode === "intervalDistance" ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "text-neutral-500 hover:bg-[var(--blue)] hover:text-white",
                  )}
                >
                  Correr/andar
                </button>
              </div>
            </div>
            {runningMode === "intervalDistance" ? (
              <div className="rounded-[16px] border border-[var(--hair)] bg-[var(--surface)] p-3">
                <p className="text-sm font-bold text-[var(--ink)]">Alternância por distância</p>
                <p className="mt-1 text-xs font-medium leading-5 text-neutral-500">Durante a corrida, o app troca automaticamente entre correr e caminhar conforme a distância real.</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <FormInput label="Correr (km)" value={runSegmentKm} onChange={setRunSegmentKm} placeholder="1" />
                  <FormInput label="Andar (km)" value={walkSegmentKm} onChange={setWalkSegmentKm} placeholder="1" />
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <FormInput label="Distancia (km)" value={distanceKm} onChange={setDistanceKm} placeholder="5" />
              <FormInput label="FC alvo" value={targetHeartRate} onChange={setTargetHeartRate} placeholder="135-150 bpm" />
            </div>
            <FormInput label="Observacoes da corrida" value={runningNotes} onChange={setRunningNotes} placeholder="Manter respiracao confortavel" />
          </div>
        </Card>
      ) : null}

      {feedback ? <p className="rounded-[14px] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--ink-2)]">{feedback}</p> : null}
      <PrimaryButton className="w-full">Criar treino de {workoutType.toLowerCase()}</PrimaryButton>
    </form>
  );
}

function FormInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <input
        className="h-12 min-w-0 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

export function ExerciseLibrary() {
  const [group, setGroup] = useState("Todos");
  const groups = ["Todos", "Peito", "Costas", "Pernas", "Ombro", ...Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))).filter((item) => !["Peito", "Costas", "Pernas", "Ombro"].includes(item))];
  const filtered = group === "Todos" ? exercises : exercises.filter((exercise) => exercise.muscleGroup === group);

  return (
    <section className="px-5">
      <p className="lbl mb-3">Biblioteca de exercicios</p>
        <div className="-mx-5 overflow-x-auto px-5 pb-2">
        <div className="flex gap-2">
          {groups.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setGroup(item)}
              className={cn(
                "pressable h-10 shrink-0 rounded-[13px] px-4 text-sm font-bold",
                  group === item ? "bg-[var(--blue)] text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "bg-white text-neutral-500 shadow-sm hover:bg-[var(--blue)] hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {filtered.map((exercise) => (
          <Card key={exercise.id} className="overflow-hidden p-0">
            <div className="grid aspect-[1.25] place-items-center bg-[repeating-linear-gradient(135deg,#fbfbfc_0,#fbfbfc_9px,#f1f2f5_9px,#f1f2f5_11px)]">
              <div className="grid size-12 place-items-center rounded-full bg-white shadow-sm">
                <Play className="ml-0.5 size-5 text-[var(--ink)]" />
              </div>
            </div>
            <div className="border-t border-[var(--hair)] p-3">
              <h2 className="truncate text-sm font-bold">{exercise.name}</h2>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge tone="blue">{exercise.muscleGroup}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function PersonalFinance({ paymentItems = payments, studentItems = students, trainerId }: { paymentItems?: Payment[]; studentItems?: Student[]; trainerId?: string }) {
  const router = useRouter();
  const totals = useMemo(() => ({
    received: paymentItems.filter((payment) => payment.status === "approved" || payment.status === "paid").reduce((sum, payment) => sum + payment.amount, 0),
    pending: paymentItems.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
    overdue: paymentItems.filter((payment) => payment.status === "overdue").reduce((sum, payment) => sum + payment.amount, 0),
    waiting: paymentItems.filter((payment) => payment.status === "waiting_analysis" || payment.status === "pending_review").length,
    blocked: studentItems.filter((student) => student.accessStatus === "blocked").length,
  }), [paymentItems, studentItems]);

  const toneByStatus: Record<PaymentStatus, "success" | "warning" | "danger"> = {
    approved: "success",
    paid: "success",
    pending: "warning",
    waiting_analysis: "warning",
    pending_review: "warning",
    overdue: "danger",
    rejected: "danger",
  };

  async function manualAction(payment: Payment, status: "approved" | "rejected") {
    const response = await fetch(`/api/payments/${payment.id}/manual-action`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, receipt_id: payment.receiptId }),
    });
    if (response.ok) router.refresh();
  }

  async function accessAction(studentId: string, action: "block" | "release") {
    const response = await fetch(`/api/students/${studentId}/access`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, trainer_id: trainerId, reason: action === "block" ? "Bloqueio manual do personal" : "Liberacao manual do personal" }),
    });
    if (response.ok) router.refresh();
  }

  return (
    <section className="space-y-4 px-5">
      <div className="grid grid-cols-2 gap-3">
        <WorkoutMiniMetric label="Recebido" value={money(totals.received)} />
        <WorkoutMiniMetric label="Pendente" value={money(totals.pending)} />
        <WorkoutMiniMetric label="Vencido" value={money(totals.overdue)} />
        <WorkoutMiniMetric label="Analise" value={String(totals.waiting)} />
        <WorkoutMiniMetric label="Inadimplentes" value={String(totals.blocked)} />
      </div>
      {paymentItems.map((payment) => {
        const student = studentItems.find((item) => item.id === payment.studentId);
        return (
          <Card key={payment.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{student?.name}</h2>
                <p className="mt-1 text-sm text-neutral-500">{money(payment.amount)} · vence {payment.dueDate}</p>
                {payment.proofUrl ? (
                  <a className="mt-2 block truncate text-xs font-semibold text-emerald-700" href={payment.proofUrl} target="_blank" rel="noreferrer">
                    Abrir comprovante
                  </a>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-neutral-500">Sem comprovante</p>
                )}
              </div>
              <Badge tone={toneByStatus[payment.status]}>{payment.status.replace("_", " ")}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => manualAction(payment, "approved")} className="h-10 rounded-lg bg-emerald-600 text-xs font-semibold text-white">Aprovar</button>
              <button onClick={() => manualAction(payment, "rejected")} className="h-10 rounded-lg bg-rose-50 text-xs font-semibold text-rose-800">Recusar</button>
              <button onClick={() => student && accessAction(student.id, "block")} className="h-10 rounded-lg border border-neutral-200 text-xs font-semibold">Bloquear</button>
              <button onClick={() => student && accessAction(student.id, "release")} className="h-10 rounded-lg border border-neutral-200 text-xs font-semibold">Liberar</button>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

export function StudentPlanSummary({ studentId }: { studentId: string }) {
  const { plan, subscription } = getStudentPlan(studentId);
  return (
    <Card>
      <h2 className="font-semibold">Plano contratado</h2>
      <p className="mt-2 text-sm text-neutral-500">{plan?.name} · {plan ? money(plan.price) : ""}</p>
      <p className="mt-1 text-sm text-neutral-500">Proxima fatura: {subscription?.nextDueDate}</p>
    </Card>
  );
}

export function AdminTrainerActions() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button className="h-10 rounded-lg bg-emerald-600 text-xs font-semibold text-white">Aprovar</button>
      <button className="h-10 rounded-lg bg-rose-50 text-xs font-semibold text-rose-800">Reprovar</button>
      <button className="h-10 rounded-lg border border-neutral-200 text-xs font-semibold">Bloquear</button>
      <button className="h-10 rounded-lg border border-neutral-200 text-xs font-semibold">Desbloquear</button>
    </div>
  );
}
