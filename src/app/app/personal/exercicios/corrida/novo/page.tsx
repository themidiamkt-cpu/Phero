"use client";

import { FormEvent, useEffect, useState } from "react";
import { Route, Save, Trash2 } from "lucide-react";
import { PageHeader, Badge, Card } from "@/components/ui";

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

const savedRunningStylesKey = "phero:running-styles";

const defaultRunningStyles: RunningStyle[] = [
  {
    id: "style-z2-5k",
    name: "Z2 5km",
    runningType: "Zona 2 continua",
    distanceKm: "5",
    targetPace: "7:00/km",
    targetTime: "35 min",
    targetHeartRate: "135-150 bpm",
    notes: "Manter respiracao confortavel e cadencia constante.",
  },
  {
    id: "style-tiros-iniciante",
    name: "Tiros iniciante",
    runningType: "1 min forte / 2 min leve",
    distanceKm: "3",
    targetPace: "RPE 7/10 nos tiros",
    targetTime: "28 min",
    targetHeartRate: "150-170 bpm",
    notes: "Aquecer antes dos tiros e controlar recuperacao.",
  },
  {
    id: "style-caminhada-corrida",
    name: "Caminhada + corrida",
    runningType: "Baixo impacto",
    distanceKm: "2",
    targetPace: "Confortavel",
    targetTime: "25 min",
    targetHeartRate: "120-145 bpm",
    notes: "Alternar caminhada rapida com corrida leve.",
  },
];

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

function currentOwnerKey() {
  return decodeURIComponent(readCookie("app-user-email") ?? readCookie("demo-user-email") ?? "voce").toLowerCase();
}

function runningStylesKey(ownerKey: string) {
  return `${savedRunningStylesKey}:${ownerKey}`;
}

export default function NovoEstiloCorridaPage() {
  const [ownerKey, setOwnerKey] = useState("voce");
  const [styles, setStyles] = useState<RunningStyle[]>(defaultRunningStyles);
  const [name, setName] = useState("");
  const [runningType, setRunningType] = useState("Zona 2 continua");
  const [distanceKm, setDistanceKm] = useState("5");
  const [targetPace, setTargetPace] = useState("7:00/km");
  const [targetTime, setTargetTime] = useState("35 min");
  const [targetHeartRate, setTargetHeartRate] = useState("135-150 bpm");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      const currentOwner = currentOwnerKey();
      setOwnerKey(currentOwner);
      const savedStyles = window.localStorage.getItem(runningStylesKey(currentOwner));

      if (!savedStyles) {
        setStyles(defaultRunningStyles);
        return;
      }

      try {
        const parsedStyles = JSON.parse(savedStyles) as RunningStyle[];
        setStyles([...parsedStyles, ...defaultRunningStyles]);
      } catch {
        window.localStorage.removeItem(runningStylesKey(currentOwner));
      }
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  function saveStyle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFeedback("Informe um nome para o estilo.");
      return;
    }

    const nextStyle: RunningStyle = {
      id: `running-style-${window.crypto.randomUUID()}`,
      name: trimmedName,
      runningType: runningType.trim(),
      distanceKm: distanceKm.trim(),
      targetPace: targetPace.trim(),
      targetTime: targetTime.trim(),
      targetHeartRate: targetHeartRate.trim(),
      notes: notes.trim(),
    };
    const customStyles = styles.filter((style) => !defaultRunningStyles.some((defaultStyle) => defaultStyle.id === style.id));
    const nextCustomStyles = [
      nextStyle,
      ...customStyles.filter((style) => style.name.toLowerCase() !== trimmedName.toLowerCase()),
    ];

    window.localStorage.setItem(runningStylesKey(ownerKey), JSON.stringify(nextCustomStyles));
    setStyles([...nextCustomStyles, ...defaultRunningStyles]);
    setName("");
    setFeedback("Estilo de corrida salvo.");
  }

  function removeStyle(id: string) {
    const nextCustomStyles = styles
      .filter((style) => style.id !== id)
      .filter((style) => !defaultRunningStyles.some((defaultStyle) => defaultStyle.id === style.id));

    window.localStorage.setItem(runningStylesKey(ownerKey), JSON.stringify(nextCustomStyles));
    setStyles([...nextCustomStyles, ...defaultRunningStyles]);
    setFeedback("Estilo removido.");
  }

  return (
    <>
      <PageHeader eyebrow="Corrida" title="Novo estilo" />
      <section className="space-y-4 px-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl">Estilo de corrida</p>
              <h2 className="mt-2 font-bold">Parametros reutilizaveis</h2>
            </div>
            <Badge tone="amber">Corrida</Badge>
          </div>

          <form onSubmit={saveStyle} className="mt-4 grid gap-3">
            <Field label="Nome do estilo" value={name} onChange={setName} placeholder="Ex: Z2 iniciante 30 min" />
            <Field label="Tipo de corrida" value={runningType} onChange={setRunningType} placeholder="Zona 2, tiro, longao..." />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Distancia (km)" value={distanceKm} onChange={setDistanceKm} placeholder="5" />
              <Field label="Pace" value={targetPace} onChange={setTargetPace} placeholder="7:00/km" />
              <Field label="Tempo" value={targetTime} onChange={setTargetTime} placeholder="35 min" />
              <Field label="FC alvo" value={targetHeartRate} onChange={setTargetHeartRate} placeholder="135-150 bpm" />
            </div>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Observacoes
              <textarea
                className="min-h-24 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium text-[var(--ink)] outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]"
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Aquecimento, intensidade, terreno, cuidados..."
                value={notes}
              />
            </label>
            <button className="pressable flex h-12 items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.28)]">
              <Save className="size-4" />
              Salvar estilo
            </button>
            {feedback ? <p className="rounded-[12px] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink-2)]">{feedback}</p> : null}
          </form>
        </Card>

        <Card>
          <p className="lbl">Estilos disponiveis</p>
          <div className="mt-4 grid gap-2">
            {styles.map((style) => {
              const isDefault = defaultRunningStyles.some((defaultStyle) => defaultStyle.id === style.id);

              return (
                <div key={style.id} className="rounded-[14px] border border-[var(--hair)] bg-[var(--surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold">{style.name}</h3>
                        <Badge tone={isDefault ? "success" : "blue"}>{isDefault ? "Global" : "Personal"}</Badge>
                      </div>
                      <p className="mt-1 text-xs font-medium text-neutral-500">
                        {style.runningType} · {style.distanceKm} km · {style.targetTime} · {style.targetPace}
                      </p>
                    </div>
                    {isDefault ? (
                      <Route className="mt-1 size-4 shrink-0 text-neutral-400" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeStyle(style.id)}
                        className="pressable grid size-8 shrink-0 place-items-center rounded-full bg-white text-neutral-500"
                        aria-label="Remover estilo"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </>
  );
}

function Field({
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
        className="h-12 min-w-0 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium text-[var(--ink)] outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
