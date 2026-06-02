"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Camera, Check, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge, Card, PrimaryButton } from "@/components/ui";
import {
  calculateBodyAssessment,
  formatAssessmentDate,
  getActiveMeasurementFields,
  measurementLabels,
  protocolLabels,
} from "@/lib/body-assessment";
import type { BodyAssessment } from "@/lib/types";

type Props = {
  previousAssessment?: BodyAssessment;
  studentGoal?: string;
  studentId: string;
  trainerId: string;
};

const today = new Date().toISOString().slice(0, 10);

const initialMeasurements: Record<string, number> = {
  tricepsSkinfold: 15,
  suprailiacSkinfold: 16,
  thighSkinfold: 22,
  chestSkinfold: 12,
  abdomenSkinfold: 18,
  midaxillarySkinfold: 14,
  subscapularSkinfold: 16,
  neck: 34,
  chest: 96,
  waist: 88,
  abdomen: 90,
  rightArm: 33,
  leftArm: 32,
  rightThigh: 59,
  leftThigh: 58,
  rightCalf: 37,
  leftCalf: 36,
  hip: 99,
};

const photoTypes = [
  { key: "front", label: "Frente", fileName: "frente.jpg" },
  { key: "side", label: "Lateral", fileName: "lateral.jpg" },
  { key: "back", label: "Posterior", fileName: "posterior.jpg" },
] as const;

export function BodyAssessmentForm({ previousAssessment, studentGoal, studentId, trainerId }: Props) {
  const router = useRouter();
  const [assessmentDate, setAssessmentDate] = useState(today);
  const [weight, setWeight] = useState(previousAssessment?.weight ?? 82);
  const [height, setHeight] = useState(previousAssessment?.height ?? 178);
  const [age, setAge] = useState(previousAssessment?.age ?? 32);
  const [gender, setGender] = useState<"male" | "female">(previousAssessment?.gender ?? "female");
  const [protocolType, setProtocolType] = useState<"jp3" | "jp7" | "navy">(previousAssessment?.protocolType ?? "jp3");
  const [measurements, setMeasurements] = useState({ ...initialMeasurements, ...(previousAssessment?.measurements ?? {}) });
  const [clientGoal, setClientGoal] = useState(studentGoal ?? "");
  const [notes, setNotes] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<Record<"front" | "side" | "back", string>>({
    front: "",
    side: "",
    back: "",
  });
  const [photoFiles, setPhotoFiles] = useState<Partial<Record<"front" | "side" | "back", File>>>({});
  const [feedback, setFeedback] = useState("");

  const activeFields = getActiveMeasurementFields(protocolType, gender);
  const result = useMemo(
    () => calculateBodyAssessment({ age, gender, height, measurements, protocolType, weight }),
    [age, gender, height, measurements, protocolType, weight],
  );

  const storageBasePath = `/avaliacoes/${studentId}/${assessmentDate}`;

  function updateMeasurement(field: string, value: number) {
    setMeasurements((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  function handlePhoto(type: "front" | "side" | "back", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoPreviews((current) => ({
      ...current,
      [type]: URL.createObjectURL(file),
    }));
    setPhotoFiles((current) => ({ ...current, [type]: file }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!weight || !height || !age) {
      setFeedback("Preencha peso, altura e idade antes de salvar.");
      return;
    }

    const missingMeasurement = activeFields.find((field) => !measurements[field]);
    if (missingMeasurement) {
      setFeedback(`Preencha ${measurementLabels[missingMeasurement]}.`);
      return;
    }

    const assessmentId = window.crypto.randomUUID();
    const photoUploads = Object.fromEntries(
      await Promise.all(
        photoTypes
          .filter((photo) => photoFiles[photo.key])
          .map(async (photo) => {
            const file = photoFiles[photo.key]!;
            return [
              photo.key,
              {
                fileName: photo.fileName,
                contentType: file.type || "image/jpeg",
                dataUrl: await fileToDataUrl(file),
              },
            ];
          }),
      ),
    );
    const assessment: BodyAssessment = {
      id: `body-${assessmentId}`,
      studentId,
      trainerId,
      assessmentDate,
      weight,
      height,
      age,
      gender,
      protocolType,
      ...result,
      clientGoal,
      notes,
      measurements: activeFields.reduce<Record<string, number>>((total, field) => {
        total[field] = measurements[field];
        return total;
      }, {
        waist: measurements.waist,
        abdomen: measurements.abdomen,
        rightArm: measurements.rightArm,
        leftArm: measurements.leftArm,
        rightThigh: measurements.rightThigh,
        leftThigh: measurements.leftThigh,
        hip: measurements.hip,
      }),
      photos: {
        front: "",
        side: "",
        back: "",
      },
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/body-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...assessment, photoUploads }),
      });
      const result = (await response.json()) as { persisted?: boolean; id?: string; error?: string };

      if (!response.ok) throw new Error(result.error ?? "Nao foi possivel salvar a avaliacao.");

      if (result.persisted && result.id) {
        setFeedback(`Avaliacao de ${formatAssessmentDate(assessmentDate)} salva no banco.`);
        router.push(`/app/personal/alunos/${studentId}/avaliacoes/${result.id}`);
        return;
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Nao foi possivel salvar no Supabase.");
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-5">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lbl">Dados gerais</p>
            <h2 className="mt-2 text-lg font-bold">Avaliacao presencial rapida</h2>
            {previousAssessment ? (
              <p className="mt-2 text-xs font-bold text-[var(--green)]">Dados preenchidos com base na avaliacao anterior de {formatAssessmentDate(previousAssessment.assessmentDate)}.</p>
            ) : (
              <p className="mt-2 text-xs font-medium text-neutral-500">Primeira avaliacao cadastrada para este aluno.</p>
            )}
          </div>
          <Badge tone="blue">5 min</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Data da avaliacao
            <input className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" type="date" value={assessmentDate} onChange={(event) => setAssessmentDate(event.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Peso (kg)" value={weight} onChange={setWeight} />
            <NumberInput label="Altura (cm)" value={height} onChange={setHeight} />
            <NumberInput label="Idade" value={age} onChange={setAge} />
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Sexo
              <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={gender} onChange={(event) => setGender(event.target.value as "male" | "female")}>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Metodo
            <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={protocolType} onChange={(event) => setProtocolType(event.target.value as "jp3" | "jp7" | "navy")}>
              <option value="jp3">Jackson & Pollock 3 Dobras</option>
              <option value="jp7">Jackson & Pollock 7 Dobras</option>
              <option value="navy">Circunferencias US Navy</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-neutral-700">
            Objetivo do cliente
            <textarea
              className="min-h-20 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]"
              placeholder="Ex: reduzir cintura, ganhar massa magra, melhorar performance..."
              value={clientGoal}
              onChange={(event) => setClientGoal(event.target.value)}
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lbl">{protocolType === "navy" ? "Circunferencias corporais" : "Dobras cutaneas"}</p>
            <h2 className="mt-2 font-bold">{protocolLabels[protocolType]}</h2>
          </div>
          <Badge tone={protocolType === "navy" ? "green" : "blue"}>{protocolType.toUpperCase()}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {activeFields.map((field) => (
            <NumberInput
              key={field}
              label={`${measurementLabels[field]} ${protocolType === "navy" ? "(cm)" : "(mm)"}`}
              value={measurements[field] ?? 0}
              onChange={(value) => updateMeasurement(field, value)}
            />
          ))}
        </div>
      </Card>

      <Card>
        <p className="lbl">Fotos de evolucao</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {photoTypes.map((photo) => (
            <label key={photo.key} className="relative grid aspect-[3/4] cursor-pointer place-items-center overflow-hidden rounded-[14px] border border-dashed border-[var(--hair)] bg-[var(--surface)]">
              {photoPreviews[photo.key] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreviews[photo.key]} alt={photo.label} className="h-full w-full object-cover" />
              ) : (
                <span className="grid place-items-center gap-2 text-center">
                  <Camera className="size-5 text-neutral-500" />
                  <span className="lbl">{photo.label}</span>
                </span>
              )}
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => handlePhoto(photo.key, event)} />
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs font-medium leading-5 text-neutral-500">Destino no Supabase Storage: {storageBasePath}/frente.jpg, lateral.jpg e posterior.jpg</p>
      </Card>

      <Card>
        <p className="lbl">Resultado automatico</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ResultCard label="% Gordura" value={`${result.bodyFatPercentage.toFixed(1)}%`} tone="red" />
          <ResultCard label="Massa gorda" value={`${result.fatMass.toFixed(1)} kg`} tone="amber" />
          <ResultCard label="Massa magra" value={`${result.leanMass.toFixed(1)} kg`} tone="green" />
          <ResultCard label="IMC" value={result.bmi.toFixed(1)} tone="blue" />
          <ResultCard label="TMB" value={`${Math.round(result.bmr)} kcal`} tone="dark" wide />
        </div>
      </Card>

      <Card>
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          Observacoes do personal
          <textarea className="min-h-24 rounded-[14px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]" placeholder="Postura, aderencia, contexto da avaliacao..." value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        {feedback ? (
          <p className="mt-4 flex items-center gap-2 rounded-[14px] bg-[var(--green-wash)] px-3 py-2 text-sm font-bold text-[var(--green)]">
            <Check className="size-4" />
            {feedback}
          </p>
        ) : null}
        <PrimaryButton className="mt-4 flex w-full items-center justify-center gap-2">
          <Save className="size-4" />
          Salvar avaliacao
        </PrimaryButton>
      </Card>
    </form>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      <input
        className="h-12 min-w-0 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]"
        inputMode="decimal"
        type="number"
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ResultCard({ label, value, tone, wide = false }: { label: string; value: string; tone: "red" | "amber" | "green" | "blue" | "dark"; wide?: boolean }) {
  const toneClass = {
    red: "bg-[var(--red-wash)] text-[var(--red-ink)]",
    amber: "bg-[var(--amber-wash)] text-[#9a5a00]",
    green: "bg-[var(--green-wash)] text-[var(--green)]",
    blue: "bg-[var(--blue-wash)] text-[var(--blue-ink)]",
    dark: "bg-[var(--ink)] text-white",
  }[tone];

  return (
    <div className={`rounded-[16px] p-3 ${toneClass} ${wide ? "col-span-2" : ""}`}>
      <p className="mono tnum text-xl font-bold">{value}</p>
      <p className={`lbl mt-2 ${tone === "dark" ? "text-white/60" : ""}`}>{label}</p>
    </div>
  );
}
