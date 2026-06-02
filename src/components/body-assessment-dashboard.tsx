"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, ChevronRight, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Badge, Card, Metric } from "@/components/ui";
import {
  formatAssessmentDate,
  mergeAssessments,
  protocolLabels,
} from "@/lib/body-assessment";
import type { BodyAssessment } from "@/lib/types";

type Props = {
  studentId: string;
  initialAssessments: BodyAssessment[];
};

const filters = [
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 ano", days: 365 },
  { label: "Todo periodo", days: 0 },
];

const chartMetrics = [
  { key: "weight", label: "Peso", unit: "kg", color: "#0A84FF" },
  { key: "bodyFatPercentage", label: "% Gordura", unit: "%", color: "#FF375F" },
  { key: "leanMass", label: "Massa magra", unit: "kg", color: "#1FAE5B" },
  { key: "fatMass", label: "Massa gorda", unit: "kg", color: "#FF9F0A" },
  { key: "waist", label: "Cintura", unit: "cm", color: "#5E5CE6" },
  { key: "abdomen", label: "Abdomen", unit: "cm", color: "#34849B" },
  { key: "rightArm", label: "Braco", unit: "cm", color: "#0E2034" },
  { key: "rightThigh", label: "Coxa", unit: "cm", color: "#7A5C00" },
] as const;

export function BodyAssessmentDashboard({ studentId, initialAssessments }: Props) {
  const [remoteAssessments, setRemoteAssessments] = useState(initialAssessments);
  const [activeFilter, setActiveFilter] = useState(filters[4]);
  const [activeMetric, setActiveMetric] = useState<(typeof chartMetrics)[number]>(chartMetrics[1]);

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

  const filteredAssessments = useMemo(() => {
    if (!activeFilter.days) return assessments;

    const start = new Date();
    start.setDate(start.getDate() - activeFilter.days);
    return assessments.filter((assessment) => new Date(`${assessment.assessmentDate}T12:00:00`) >= start);
  }, [activeFilter, assessments]);

  const current = assessments[0];
  const previous = assessments[1];

  if (!current) {
    return (
      <section className="px-5">
        <Card>
          <p className="lbl">Historico vazio</p>
          <h2 className="mt-2 text-lg font-bold">Nenhuma avaliacao cadastrada</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">Crie a primeira avaliacao para liberar comparacao, graficos e fotos de evolucao.</p>
        </Card>
      </section>
    );
  }

  const comparison = previous ? [
    { label: "Peso", before: previous.weight, after: current.weight, unit: "kg", goodWhenDown: true },
    { label: "Gordura", before: previous.bodyFatPercentage, after: current.bodyFatPercentage, unit: "%", goodWhenDown: true },
    { label: "Cintura", before: previous.measurements.waist, after: current.measurements.waist, unit: "cm", goodWhenDown: true },
    { label: "Massa magra", before: previous.leanMass, after: current.leanMass, unit: "kg", goodWhenDown: false },
  ] : [];

  return (
    <section className="space-y-4 px-5">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lbl">Dashboard de evolucao</p>
            <h2 className="mt-2 text-lg font-bold">Atual vs anterior</h2>
          </div>
          <Badge tone="success">{current.protocolType.toUpperCase()}</Badge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Metric value={`${current.weight}`} unit="kg" label="Peso" tone="blue" />
          <Metric value={`${current.bodyFatPercentage}`} unit="%" label="Gordura" tone="red" />
          <Metric value={`${current.leanMass}`} unit="kg" label="Magra" tone="green" />
        </div>
        {previous ? (
          <div className="mt-4 grid gap-2">
            {comparison.map((item) => {
              const diff = Number((item.after - item.before).toFixed(1));
              const positive = item.goodWhenDown ? diff <= 0 : diff >= 0;
              return (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--surface)] p-3">
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="mt-1 text-xs font-medium text-neutral-500">{item.before} {item.unit} to {item.after} {item.unit}</p>
                  </div>
                  <Badge tone={positive ? "success" : "warning"}>{diff > 0 ? "+" : ""}{diff} {item.unit}</Badge>
                </div>
              );
            })}
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter.label}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={filter.label === activeFilter.label ? "h-9 shrink-0 rounded-[12px] bg-[var(--blue)] px-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "h-9 shrink-0 rounded-[12px] bg-[var(--surface)] px-3 text-xs font-bold text-neutral-500 hover:bg-[var(--blue)] hover:text-white"}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {chartMetrics.map((metric) => (
            <button
              key={metric.key}
              type="button"
              onClick={() => setActiveMetric(metric)}
              className={metric.key === activeMetric.key ? "h-9 shrink-0 rounded-[12px] bg-[var(--blue)] px-3 text-xs font-bold text-white shadow-[0_8px_18px_rgba(10,132,255,.24)]" : "h-9 shrink-0 rounded-[12px] bg-white px-3 text-xs font-bold text-neutral-600 shadow-sm hover:bg-[var(--blue)] hover:text-white"}
            >
              {metric.label}
            </button>
          ))}
        </div>
        <EvolutionChart assessments={filteredAssessments} metric={activeMetric} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="lbl">Fotos antes e depois</p>
          <Camera className="size-4 text-neutral-400" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[previous, current].map((assessment, index) => (
            <div key={assessment?.id ?? index} className="overflow-hidden rounded-[16px] bg-[var(--surface)]">
              <div className="grid aspect-[3/4] place-items-center overflow-hidden bg-[repeating-linear-gradient(135deg,#fbfbfc_0,#fbfbfc_9px,#f1f2f5_9px,#f1f2f5_11px)]">
                {getAssessmentPhoto(assessment) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getAssessmentPhoto(assessment)} alt={index === 0 ? "Foto anterior" : "Foto atual"} className="h-full w-full object-cover" />
                ) : (
                  <span className="lbl">{index === 0 ? "Anterior" : "Atual"}</span>
                )}
              </div>
              <p className="px-3 py-2 text-xs font-bold text-neutral-500">{assessment ? formatAssessmentDate(assessment.assessmentDate) : "Sem foto"}</p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <p className="lbl mb-3">Historico de avaliacoes</p>
        <div className="grid gap-3">
          {assessments.map((assessment) => (
            <Link key={assessment.id} href={`/app/personal/alunos/${studentId}/avaliacoes/${assessment.id}`}>
              <Card className="pressable">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{formatAssessmentDate(assessment.assessmentDate)}</h2>
                      <Badge tone="blue">{assessment.protocolType.toUpperCase()}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">
                      {assessment.weight} kg · {assessment.bodyFatPercentage}% gordura · {assessment.leanMass} kg massa magra
                    </p>
                    <p className="mt-1 text-xs font-medium text-neutral-400">{protocolLabels[assessment.protocolType]}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-neutral-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function getAssessmentPhoto(assessment?: BodyAssessment) {
  if (!assessment) return "";
  return assessment.photos.front || assessment.photos.side || assessment.photos.back || "";
}

function EvolutionChart({
  assessments,
  metric,
}: {
  assessments: BodyAssessment[];
  metric: (typeof chartMetrics)[number];
}) {
  const values = assessments
    .slice()
    .reverse()
    .map((assessment) => ({
      date: assessment.assessmentDate,
      value: metric.key in assessment
        ? Number(assessment[metric.key as keyof BodyAssessment])
        : Number(assessment.measurements[metric.key] ?? 0),
    }))
    .filter((item) => Number.isFinite(item.value) && item.value > 0);

  const max = Math.max(...values.map((item) => item.value), 1);
  const min = Math.min(...values.map((item) => item.value), max);
  const range = Math.max(1, max - min);
  const points = values.map((item, index) => {
    const x = 8 + index * (88 / Math.max(1, values.length - 1));
    const y = 96 - ((item.value - min) / range) * 70;
    return `${x},${y}`;
  }).join(" ");

  const first = values[0]?.value ?? 0;
  const last = values[values.length - 1]?.value ?? 0;
  const diff = Number((last - first).toFixed(1));

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="lbl">{metric.label}</p>
          <h3 className="mt-1 text-xl font-bold">{last || "--"} {metric.unit}</h3>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] bg-[var(--surface)] px-3 py-2 text-sm font-bold text-[var(--ink)]">
          {diff <= 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
          {diff > 0 ? "+" : ""}{diff} {metric.unit}
        </div>
      </div>
      <svg viewBox="0 0 104 112" className="mt-2 h-40 w-full">
        <polyline points={points} fill="none" stroke={metric.color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
        {points.split(" ").filter(Boolean).map((point) => {
          const [x, y] = point.split(",");
          return <circle key={point} cx={x} cy={y} r="2.5" fill={metric.color} />;
        })}
      </svg>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[14px] bg-[var(--surface)] p-3">
          <Scale className="size-4 text-neutral-400" />
          <p className="lbl mt-2">Primeiro registro</p>
          <p className="mono mt-1 text-lg font-bold">{first || "--"} {metric.unit}</p>
        </div>
        <div className="rounded-[14px] bg-[var(--surface)] p-3">
          <Scale className="size-4 text-neutral-400" />
          <p className="lbl mt-2">Ultimo registro</p>
          <p className="mono mt-1 text-lg font-bold">{last || "--"} {metric.unit}</p>
        </div>
      </div>
    </div>
  );
}
