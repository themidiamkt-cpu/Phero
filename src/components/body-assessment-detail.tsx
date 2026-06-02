"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Card } from "@/components/ui";
import {
  formatAssessmentDate,
  measurementLabels,
  mergeAssessments,
  protocolLabels,
} from "@/lib/body-assessment";
import type { BodyAssessment } from "@/lib/types";

type Props = {
  studentId: string;
  assessmentId: string;
  initialAssessments: BodyAssessment[];
};

const photoLabels = {
  front: "Frente",
  side: "Lateral",
  back: "Posterior",
};

export function BodyAssessmentDetail({ studentId, assessmentId, initialAssessments }: Props) {
  const [remoteAssessments, setRemoteAssessments] = useState(initialAssessments);

  useEffect(() => {
    let active = true;

    fetch(`/api/body-assessments?studentId=${encodeURIComponent(studentId)}`)
      .then((response) => response.json())
      .then((data: { assessments?: BodyAssessment[] }) => {
        if (active && data.assessments?.length) setRemoteAssessments(data.assessments);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [studentId]);

  const assessments = useMemo(
    () => mergeAssessments(remoteAssessments, []),
    [remoteAssessments],
  );
  const assessment = assessments.find((item) => item.id === assessmentId) ?? initialAssessments.find((item) => item.id === assessmentId);
  const currentIndex = assessments.findIndex((item) => item.id === assessment?.id);
  const previous = currentIndex >= 0 ? assessments[currentIndex + 1] : undefined;

  if (!assessment) {
    return (
      <section className="px-5">
        <Card>
          <p className="lbl">Avaliacao nao encontrada</p>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Volte ao historico e selecione uma avaliacao disponivel.</p>
        </Card>
      </section>
    );
  }

  const comparisons = [
    { label: "Peso", before: previous?.weight, after: assessment.weight, unit: "kg", goodWhenDown: true },
    { label: "Percentual de gordura", before: previous?.bodyFatPercentage, after: assessment.bodyFatPercentage, unit: "%", goodWhenDown: true },
    { label: "Cintura", before: previous?.measurements.waist, after: assessment.measurements.waist, unit: "cm", goodWhenDown: true },
    { label: "Massa magra", before: previous?.leanMass, after: assessment.leanMass, unit: "kg", goodWhenDown: false },
  ];

  return (
    <section className="space-y-4 px-5">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lbl">Resultado</p>
            <h2 className="mt-2 text-lg font-bold">{formatAssessmentDate(assessment.assessmentDate)}</h2>
            <p className="mt-1 text-sm text-neutral-500">{protocolLabels[assessment.protocolType]}</p>
          </div>
          <Badge tone="blue">{assessment.protocolType.toUpperCase()}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Result label="Gordura" value={`${assessment.bodyFatPercentage}%`} tone="red" />
          <Result label="Massa gorda" value={`${assessment.fatMass} kg`} tone="amber" />
          <Result label="Massa magra" value={`${assessment.leanMass} kg`} tone="green" />
          <Result label="IMC" value={String(assessment.bmi)} tone="blue" />
          <Result label="TMB" value={`${assessment.bmr} kcal`} tone="dark" wide />
        </div>
      </Card>

      <Card>
        <p className="lbl">Atual vs anterior</p>
        <div className="mt-4 grid gap-3">
          {comparisons.map((item) => {
            const before = item.before;
            const hasBefore = typeof before === "number";
            const diff = hasBefore ? Number((item.after - before).toFixed(1)) : 0;
            const positive = item.goodWhenDown ? diff <= 0 : diff >= 0;
            return (
              <div key={item.label} className="rounded-[16px] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold">{item.label}</h2>
                    <p className="mt-1 text-xs font-medium text-neutral-500">
                      {hasBefore ? before : "--"} {item.unit} to {item.after} {item.unit}
                    </p>
                  </div>
                  <Badge tone={hasBefore && positive ? "success" : "warning"}>{hasBefore ? `${diff > 0 ? "+" : ""}${diff} ${item.unit}` : "sem base"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <p className="lbl">Medidas registradas</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Object.entries(assessment.measurements).map(([key, value]) => (
            <div key={key} className="rounded-[14px] bg-[var(--surface)] p-3">
              <p className="text-sm font-bold">{measurementLabels[key] ?? key}</p>
              <p className="mono mt-1 text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="lbl">Fotos</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {Object.entries(assessment.photos).map(([type, path]) => (
            <div key={type} className="overflow-hidden rounded-[14px] bg-[var(--surface)]">
              <div className="grid aspect-[3/4] place-items-center overflow-hidden bg-[repeating-linear-gradient(135deg,#fbfbfc_0,#fbfbfc_9px,#f1f2f5_9px,#f1f2f5_11px)]">
                {path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={path} alt={`Foto ${photoLabels[type as keyof typeof photoLabels]}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="lbl">{photoLabels[type as keyof typeof photoLabels]}</span>
                )}
              </div>
              <p className="truncate px-2 py-2 text-[10px] font-semibold text-neutral-400">{path || "Sem foto"}</p>
            </div>
          ))}
        </div>
      </Card>

      {assessment.notes ? (
        <Card>
          <p className="lbl">Observacoes</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600">{assessment.notes}</p>
        </Card>
      ) : null}
    </section>
  );
}

function Result({ label, value, tone, wide = false }: { label: string; value: string; tone: "red" | "amber" | "green" | "blue" | "dark"; wide?: boolean }) {
  const toneClass = {
    red: "bg-[var(--red-wash)] text-[var(--red-ink)]",
    amber: "bg-[var(--amber-wash)] text-[#9a5a00]",
    green: "bg-[var(--green-wash)] text-[var(--green)]",
    blue: "bg-[var(--blue-wash)] text-[var(--blue-ink)]",
    dark: "bg-[var(--ink)] text-white",
  }[tone];

  return (
    <div className={`rounded-[16px] p-3 ${toneClass} ${wide ? "col-span-2" : ""}`}>
      <p className="mono text-xl font-bold">{value}</p>
      <p className={`lbl mt-2 ${tone === "dark" ? "text-white/60" : ""}`}>{label}</p>
    </div>
  );
}
