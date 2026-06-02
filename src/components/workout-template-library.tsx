"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Eye, Heart, Loader2, Search, X } from "lucide-react";
import { Badge, Card, cn } from "@/components/ui";
import { getLocalFavoriteTemplateIds, toggleLocalFavoriteTemplate } from "@/lib/workout-template-local";
import { getTemplateFilterOptions } from "@/lib/workout-templates";
import type { Student, WorkoutTemplate } from "@/lib/types";

type Props = {
  initialStudentId?: string;
  students: Student[];
  templates: WorkoutTemplate[];
  trainerId: string;
};

const emptyFilter = "Todos";

type ApplyResult = {
  persisted?: boolean;
  workoutId?: string;
  workoutIds?: string[];
  error?: string;
};

type ApplyConfirmation = {
  templateName: string;
  studentName: string;
  studentId: string;
  workoutId?: string;
  workoutCount: number;
  persisted: boolean;
};

export function WorkoutTemplateLibrary({ initialStudentId, students, templates, trainerId }: Props) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    goal: emptyFilter,
    level: emptyFilter,
    category: emptyFilter,
    days: emptyFilter,
    location: emptyFilter,
    equipment: emptyFilter,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [studentId, setStudentId] = useState(initialStudentId ?? students[0]?.id ?? "");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => (typeof window === "undefined" ? [] : getLocalFavoriteTemplateIds()));
  const [feedback, setFeedback] = useState("");
  const [applyingTemplateId, setApplyingTemplateId] = useState("");
  const [confirmation, setConfirmation] = useState<ApplyConfirmation | null>(null);

  const options = getTemplateFilterOptions(templates);
  const filteredTemplates = useMemo(() => templates.filter((template) => {
    const matchesQuery = template.name.toLowerCase().includes(query.toLowerCase());
    const matchesGoal = filters.goal === emptyFilter || template.goal === filters.goal;
    const matchesLevel = filters.level === emptyFilter || template.level === filters.level;
    const matchesCategory = filters.category === emptyFilter || template.category === filters.category;
    const matchesDays = filters.days === emptyFilter || String(template.daysPerWeek) === filters.days;
    const matchesLocation = filters.location === emptyFilter || template.location === filters.location;
    const matchesEquipment = filters.equipment === emptyFilter || template.equipment.includes(filters.equipment);
    return matchesQuery && matchesGoal && matchesLevel && matchesCategory && matchesDays && matchesLocation && matchesEquipment;
  }), [filters, query, templates]);

  async function toggleFavorite(template: WorkoutTemplate) {
    const isFavorite = favoriteIds.includes(template.id);
    const next = toggleLocalFavoriteTemplate(template.id);
    setFavoriteIds(next);

    await fetch("/api/workout-templates/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId: template.id, trainerId, favorite: !isFavorite }),
    }).catch(() => undefined);
  }

  async function applyTemplate(template: WorkoutTemplate) {
    if (!studentId) {
      setFeedback("Selecione um aluno para aplicar o modelo.");
      return;
    }

    setApplyingTemplateId(template.id);
    setFeedback("");

    try {
      const response = await fetch("/api/workout-templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, studentId, trainerId }),
      });
      const result = (await response.json()) as ApplyResult;

      if (!response.ok) {
        setFeedback(result.error ?? "Nao foi possivel aplicar o modelo.");
        return;
      }

      const student = students.find((item) => item.id === studentId);
      const workoutIds = result.workoutIds ?? (result.workoutId ? [result.workoutId] : []);
      setConfirmation({
        templateName: template.name,
        studentName: student?.name ?? "o aluno",
        studentId,
        workoutId: result.workoutId ?? workoutIds[0],
        workoutCount: workoutIds.length || template.days.length || 1,
        persisted: Boolean(result.persisted),
      });
      setSelectedTemplate(null);
    } catch {
      setFeedback("Nao foi possivel aplicar o modelo agora.");
    } finally {
      setApplyingTemplateId("");
    }
  }

  return (
    <section className="space-y-4 px-5">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lbl">Biblioteca</p>
            <h2 className="mt-2 text-lg font-bold">Treinos Prontos</h2>
          </div>
          <Badge tone="blue">{filteredTemplates.length} modelos</Badge>
        </div>
        <label className="relative mt-4 block">
          <Search className="absolute left-3 top-3.5 size-4 text-neutral-400" />
          <input
            className="h-12 w-full rounded-[14px] border border-[var(--hair)] bg-white pl-10 pr-3 text-sm font-semibold outline-none focus:border-[var(--blue)]"
            placeholder="Buscar por nome"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <FilterSelect label="Objetivo" value={filters.goal} options={options.goals} onChange={(goal) => setFilters((current) => ({ ...current, goal }))} />
          <FilterSelect label="Nivel" value={filters.level} options={options.levels} onChange={(level) => setFilters((current) => ({ ...current, level }))} />
          <FilterSelect label="Categoria" value={filters.category} options={options.categories} onChange={(category) => setFilters((current) => ({ ...current, category }))} />
          <FilterSelect label="Dias" value={filters.days} options={options.days} onChange={(days) => setFilters((current) => ({ ...current, days }))} />
          <FilterSelect label="Local" value={filters.location} options={options.locations} onChange={(location) => setFilters((current) => ({ ...current, location }))} />
          <FilterSelect label="Equipamento" value={filters.equipment} options={options.equipment} onChange={(equipment) => setFilters((current) => ({ ...current, equipment }))} />
        </div>
      </Card>

      <Card>
        <label className="grid gap-2 text-sm font-semibold text-neutral-700">
          Aplicar para aluno
          <select className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none focus:border-[var(--blue)]" value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </label>
        {feedback ? (
          <p className="mt-3 flex gap-2 rounded-[14px] bg-[var(--red-wash)] px-3 py-2 text-sm font-bold text-[var(--red-ink)]">
            <X className="size-4 shrink-0" />
            {feedback}
          </p>
        ) : null}
      </Card>

      <div className="grid gap-3">
        {filteredTemplates.map((template) => {
          const isFavorite = favoriteIds.includes(template.id) || template.isFavorite;
          return (
            <Card key={template.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold">{template.name}</h3>
                  <p className="mt-2 text-sm leading-5 text-neutral-500">{template.description}</p>
                </div>
                <button type="button" onClick={() => toggleFavorite(template)} className={cn("grid size-10 shrink-0 place-items-center rounded-full", isFavorite ? "bg-[var(--red-wash)] text-[var(--red-ink)]" : "bg-[var(--surface)] text-neutral-500")} aria-label="Favoritar modelo">
                  <Heart className={cn("size-4", isFavorite && "fill-current")} />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="blue">{template.goal}</Badge>
                <Badge>{template.level}</Badge>
                <Badge tone="green">{template.category}</Badge>
                <Badge>{template.daysPerWeek}x semana</Badge>
                <Badge>{template.estimatedDurationMinutes} min</Badge>
                <Badge>{template.location}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setSelectedTemplate(template)} className="pressable flex h-11 items-center justify-center gap-2 rounded-[13px] border border-[var(--hair)] bg-white text-sm font-bold text-[var(--ink)]">
                  <Eye className="size-4" />
                  Ver detalhes
                </button>
                <button
                  type="button"
                  disabled={applyingTemplateId === template.id}
                  onClick={() => applyTemplate(template)}
                  className="pressable flex h-11 items-center justify-center gap-2 rounded-[13px] bg-[var(--blue)] text-sm font-bold text-white disabled:opacity-70"
                >
                  {applyingTemplateId === template.id ? <Loader2 className="size-4 animate-spin" /> : null}
                  {applyingTemplateId === template.id ? "Aplicando..." : "Usar modelo"}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedTemplate ? (
        <TemplateDetailsModal applying={applyingTemplateId === selectedTemplate.id} template={selectedTemplate} onApply={applyTemplate} onClose={() => setSelectedTemplate(null)} />
      ) : null}

      {confirmation ? (
        <ApplyConfirmationModal confirmation={confirmation} onClose={() => setConfirmation(null)} />
      ) : null}
    </section>
  );
}

function FilterSelect({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-neutral-500">
      {label}
      <select className="h-10 min-w-0 rounded-[12px] border border-[var(--hair)] bg-white px-2 text-xs font-bold text-[var(--ink)] outline-none" value={value} onChange={(event) => onChange(event.target.value)}>
        {[emptyFilter, ...options].map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TemplateDetailsModal({
  applying,
  onApply,
  onClose,
  template,
}: {
  applying: boolean;
  onApply: (template: WorkoutTemplate) => void;
  onClose: () => void;
  template: WorkoutTemplate;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/35 px-4 py-5">
      <div className="mx-auto w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="lbl">Detalhes do modelo</p>
            <h2 className="mt-2 text-xl font-bold">{template.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-[var(--surface)]">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-600">{template.description}</p>
        <div className="mt-4 grid gap-3">
          {template.days.map((day) => (
            <div key={day.id} className="rounded-[16px] border border-[var(--hair)] bg-[var(--surface)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{day.dayName}</h3>
                  <p className="mt-1 text-sm text-neutral-500">{day.focus}</p>
                </div>
                <Badge>{day.exercises.length} exercicios</Badge>
              </div>
              <div className="mt-3 grid gap-2">
                {day.exercises.map((exercise) => (
                  <div key={exercise.id} className="rounded-[12px] bg-white p-3">
                    <p className="text-sm font-bold">{exercise.exerciseOrder}. {exercise.exerciseName}</p>
                    <p className="mt-1 text-xs font-medium text-neutral-500">{exercise.sets} series · {exercise.reps} · descanso {exercise.restSeconds}s</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={applying}
          onClick={() => onApply(template)}
          className="pressable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white disabled:opacity-70"
        >
          {applying ? <Loader2 className="size-4 animate-spin" /> : null}
          {applying ? "Aplicando..." : "Usar modelo"}
        </button>
      </div>
    </div>
  );
}

function ApplyConfirmationModal({ confirmation, onClose }: { confirmation: ApplyConfirmation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/40 px-5 py-8">
      <div className="w-full max-w-md rounded-[24px] border border-[var(--hair)] bg-white p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--green-wash)] text-[var(--green)]">
            <Check className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="lbl">Modelo aplicado</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--ink)]">Treino criado para {confirmation.studentName}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-3)]">
              {confirmation.templateName} foi copiado em {confirmation.workoutCount} {confirmation.workoutCount === 1 ? "treino editavel" : "treinos editaveis"}. O modelo original nao foi alterado.
            </p>
            {!confirmation.persisted ? (
              <p className="mt-2 text-xs font-bold text-[var(--amber)]">Confirmacao local. Verifique a conexao do Supabase se o treino nao aparecer para o aluno.</p>
            ) : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="pressable h-12 rounded-[14px] border border-[var(--hair)] bg-white text-sm font-bold text-[var(--ink)]">
            Continuar
          </button>
          {confirmation.studentId ? (
            <Link href={`/app/personal/alunos/${confirmation.studentId}`} className="pressable flex h-12 items-center justify-center rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white">
              Ver aluno
            </Link>
          ) : (
            <button type="button" onClick={onClose} className="pressable h-12 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white">
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
