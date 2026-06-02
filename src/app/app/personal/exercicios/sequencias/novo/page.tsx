"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { PageHeader, Badge, Card } from "@/components/ui";
import { exercises } from "@/lib/mock-data";

type ReadySequence = {
  name: string;
  owner: string;
  scope: "Global" | "Personal";
  count: number;
  items?: string[];
};

const savedSequencesKey = "phero:exercise-sequences";

const readySequences = [
  { name: "Inferiores completo", owner: "Admin", scope: "Global", count: 3, items: ["Agachamento livre", "Leg press", "Prancha com toque"] },
  { name: "Peito basico", owner: "Admin", scope: "Global", count: 2, items: ["Supino inclinado", "Crucifixo"] },
  { name: "Corrida Z2 5km", owner: "Admin", scope: "Global", count: 2, items: ["Educativos de corrida", "Corrida zona 2 continua"] },
  { name: "Intervalado iniciante", owner: "Admin", scope: "Global", count: 2, items: ["Educativos de corrida", "Tiros intervalados"] },
  { name: "Longao progressivo", owner: "Admin", scope: "Global", count: 2, items: ["Corrida zona 2 continua", "Longao progressivo"] },
  { name: "Baixo impacto corrida", owner: "Admin", scope: "Global", count: 2, items: ["Caminhada corrida baixo impacto", "Educativos de corrida"] },
] satisfies ReadySequence[];

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

function currentOwnerKey() {
  return decodeURIComponent(readCookie("app-user-email") ?? readCookie("demo-user-email") ?? "voce").toLowerCase();
}

function personalSequencesKey(ownerKey: string) {
  return `${savedSequencesKey}:${ownerKey}`;
}

function isVisibleSequence(sequence: ReadySequence, ownerKey: string) {
  return sequence.scope === "Global" || sequence.owner === ownerKey || sequence.owner === "Voce";
}

export default function NovaSequenciaPage() {
  const [sequenceName, setSequenceName] = useState("");
  const [selectedExercises, setSelectedExercises] = useState(exercises.slice(0, 3).map((exercise) => exercise.name));
  const [selectedExercise, setSelectedExercise] = useState(exercises[0]?.name ?? "");
  const [sequences, setSequences] = useState<ReadySequence[]>(readySequences);
  const [ownerKey, setOwnerKey] = useState("voce");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const currentOwner = currentOwnerKey();
      setOwnerKey(currentOwner);
      const savedSequences =
        window.localStorage.getItem(personalSequencesKey(currentOwner)) ??
        window.localStorage.getItem(savedSequencesKey);
      if (!savedSequences) {
        setSequences(readySequences);
        return;
      }

      try {
        const parsedSequences = JSON.parse(savedSequences) as ReadySequence[];
        if (Array.isArray(parsedSequences)) {
          const visiblePersonalSequences = parsedSequences
            .filter((sequence) => sequence.scope === "Personal")
            .filter((sequence) => isVisibleSequence(sequence, currentOwner))
            .map((sequence) => ({ ...sequence, owner: currentOwner }));
          window.localStorage.setItem(personalSequencesKey(currentOwner), JSON.stringify(visiblePersonalSequences));
          setSequences([...visiblePersonalSequences, ...readySequences]);
        }
      } catch {
        window.localStorage.removeItem(personalSequencesKey(currentOwner));
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  function addExercise() {
    if (!selectedExercise || selectedExercises.includes(selectedExercise)) return;
    setSelectedExercises((current) => [...current, selectedExercise]);
    setFeedback("");
  }

  function removeExercise(name: string) {
    setSelectedExercises((current) => current.filter((exercise) => exercise !== name));
    setFeedback("");
  }

  function saveSequence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = sequenceName.trim();
    if (!trimmedName) {
      setFeedback("Informe um nome para salvar a sequencia.");
      return;
    }

    if (!selectedExercises.length) {
      setFeedback("Adicione pelo menos um exercicio.");
      return;
    }

    const nextSequence: ReadySequence = {
      name: trimmedName,
      owner: ownerKey,
      scope: "Personal",
      count: selectedExercises.length,
      items: selectedExercises,
    };

    const personalSequences = sequences.filter((sequence) => sequence.scope === "Personal" && isVisibleSequence(sequence, ownerKey));
    const nextPersonalSequences = [
      nextSequence,
      ...personalSequences.filter((sequence) => sequence.name.toLowerCase() !== trimmedName.toLowerCase()),
    ];

    window.localStorage.setItem(personalSequencesKey(ownerKey), JSON.stringify(nextPersonalSequences));
    setSequences([...nextPersonalSequences, ...readySequences]);
    setSequenceName("");
    setFeedback("Sequencia salva.");
  }

  return (
    <>
      <PageHeader eyebrow="Sequencia pronta" title="Novo bloco" />
      <section className="space-y-4 px-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <p className="lbl">Criar sequencia pessoal</p>
            <Badge tone="blue">Personal</Badge>
          </div>
          <form onSubmit={saveSequence} className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Nome da sequencia
              <input
                className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                placeholder="Ex: Inferiores completo"
                value={sequenceName}
                onChange={(event) => {
                  setSequenceName(event.target.value);
                  setFeedback("");
                }}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Adicionar exercicio
              <div className="grid grid-cols-[1fr_44px] gap-2">
                <select
                  className="h-12 min-w-0 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
                  value={selectedExercise}
                  onChange={(event) => setSelectedExercise(event.target.value)}
                >
                  {exercises.map((exercise) => (
                    <option key={exercise.id}>{exercise.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addExercise}
                  className="pressable grid h-12 place-items-center rounded-[14px] bg-[var(--blue)] text-white"
                  aria-label="Adicionar exercicio na sequencia"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            </label>

            <div className="grid gap-2">
              {selectedExercises.map((exercise, index) => (
                <div key={exercise} className="flex items-center gap-3 rounded-[14px] border border-[var(--hair)] bg-[var(--surface)] p-3">
                  <span className="mono grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[var(--blue)]">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{exercise}</span>
                  <button
                    type="button"
                    onClick={() => removeExercise(exercise)}
                    className="pressable grid size-8 place-items-center rounded-full bg-white text-neutral-500"
                    aria-label={`Remover ${exercise}`}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            {feedback ? (
              <p className="rounded-[12px] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink-2)]">{feedback}</p>
            ) : null}

            <button
              type="submit"
              className="pressable flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.28)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!sequenceName.trim() || !selectedExercises.length}
            >
              <Save className="size-4" />
              Salvar sequencia
            </button>
          </form>
        </Card>

        <Card>
          <p className="lbl">Sequencias disponiveis</p>
          <div className="mt-4 grid gap-2">
            {sequences.filter((sequence) => isVisibleSequence(sequence, ownerKey)).map((sequence) => (
              <div key={`${sequence.owner}-${sequence.name}`} className="rounded-[14px] border border-[var(--hair)] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold">{sequence.name}</h3>
                      <Badge tone={sequence.scope === "Global" ? "success" : "blue"}>{sequence.scope}</Badge>
                    </div>
                    <p className="mt-1 text-xs font-medium text-neutral-500">
                      {sequence.count} exercicios · {sequence.scope === "Personal" ? "Voce" : sequence.owner}
                    </p>
                  </div>
                  <button className="pressable rounded-[10px] bg-white px-3 py-2 text-xs font-bold text-[var(--blue)]">Editar</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
