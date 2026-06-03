"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Dumbbell, Plus, Save, Trash2, X } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import type { Exercise, WorkoutTemplate } from "@/lib/types";

type TemplateDraft = {
  id?: string;
  name: string;
  goal: string;
  level: string;
  category: string;
  daysPerWeek: number;
  estimatedDurationMinutes: number;
  location: string;
  equipmentText: string;
  description: string;
  isNew?: boolean;
};

type GlobalSequence = {
  name: string;
  exercises: string[];
};

const initialSequences: GlobalSequence[] = [
  { name: "Inferiores completo", exercises: ["Agachamento livre", "Leg press", "Prancha com toque"] },
  { name: "Peito basico", exercises: ["Supino inclinado", "Crucifixo"] },
];

function templateToDraft(template?: WorkoutTemplate): TemplateDraft {
  return {
    id: template?.id,
    name: template?.name ?? "Novo treino pronto",
    goal: template?.goal ?? "Geral",
    level: template?.level ?? "Iniciante",
    category: template?.category ?? "Musculacao",
    daysPerWeek: template?.daysPerWeek ?? 1,
    estimatedDurationMinutes: template?.estimatedDurationMinutes ?? 45,
    location: template?.location ?? "Academia",
    equipmentText: template?.equipment.join(", ") ?? "",
    description: template?.description ?? "Descreva quando os personais devem usar este treino pronto.",
    isNew: !template,
  };
}

function exerciseCount(template: WorkoutTemplate) {
  return template.days.reduce((sum, day) => sum + day.exercises.length, 0);
}

function updatedLabel(template: WorkoutTemplate) {
  const value = template.createdAt ? new Date(template.createdAt) : new Date();
  if (Number.isNaN(value.getTime())) return "hoje";
  return new Intl.DateTimeFormat("pt-BR").format(value);
}

function draftPayload(draft: TemplateDraft) {
  return {
    name: draft.name,
    goal: draft.goal,
    level: draft.level,
    category: draft.category,
    daysPerWeek: draft.daysPerWeek,
    estimatedDurationMinutes: draft.estimatedDurationMinutes,
    location: draft.location,
    equipment: draft.equipmentText.split(",").map((item) => item.trim()).filter(Boolean),
    description: draft.description,
  };
}

function draftToTemplate(draft: TemplateDraft, current?: WorkoutTemplate, id?: string): WorkoutTemplate {
  return {
    id: id ?? draft.id ?? current?.id ?? "new",
    name: draft.name,
    goal: draft.goal,
    level: draft.level,
    category: draft.category,
    daysPerWeek: draft.daysPerWeek,
    estimatedDurationMinutes: draft.estimatedDurationMinutes,
    location: draft.location,
    equipment: draft.equipmentText.split(",").map((item) => item.trim()).filter(Boolean),
    description: draft.description,
    isActive: true,
    isFavorite: current?.isFavorite,
    days: current?.days ?? [],
    createdAt: current?.createdAt ?? new Date().toISOString(),
  };
}

export function AdminGlobalTrainingManager({
  globalExercises,
  initialTemplates,
}: {
  globalExercises: Exercise[];
  initialTemplates: WorkoutTemplate[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [sequences, setSequences] = useState(initialSequences);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? "new");
  const [draft, setDraft] = useState<TemplateDraft>(() => templateToDraft(initialTemplates[0]));
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [selectedId, templates],
  );

  function selectTemplate(template: WorkoutTemplate) {
    setSelectedId(template.id);
    setDraft(templateToDraft(template));
    setError("");
    setNotice("");
    setIsEditorOpen(true);
  }

  function startNewTemplate() {
    const nextDraft = templateToDraft();
    setSelectedId("new");
    setDraft(nextDraft);
    setError("");
    setNotice("");
    setIsEditorOpen(true);
  }

  function closeEditor() {
    if (loadingAction === "save") return;
    setIsEditorOpen(false);
    setError("");
  }

  async function saveTemplate() {
    setError("");
    setNotice("");

    if (!draft.name.trim()) {
      setError("Informe o nome do treino pronto.");
      return;
    }

    setLoadingAction("save");
    try {
      const endpoint = draft.isNew || !draft.id ? "/api/admin/workout-templates" : `/api/admin/workout-templates/${draft.id}`;
      const response = await fetch(endpoint, {
        method: draft.isNew || !draft.id ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPayload(draft)),
      });
      const result = (await response.json().catch(() => ({}))) as { id?: string; error?: string };

      if (!response.ok) {
        setError(result.error ?? "Nao foi possivel salvar o treino pronto.");
        return;
      }

      const savedTemplate = draftToTemplate(draft, selectedTemplate, result.id);
      setTemplates((current) => {
        if (draft.isNew || !draft.id) return [savedTemplate, ...current];
        return current.map((template) => template.id === savedTemplate.id ? savedTemplate : template);
      });
      setSelectedId(savedTemplate.id);
      setDraft(templateToDraft(savedTemplate));
      setNotice(draft.isNew ? "Treino pronto criado com sucesso." : "Treino pronto atualizado com sucesso.");
      setIsEditorOpen(false);
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  async function duplicateTemplate(template: WorkoutTemplate) {
    setError("");
    setLoadingAction(`duplicate:${template.id}`);
    try {
      const response = await fetch(`/api/admin/workout-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Nao foi possivel duplicar o treino pronto.");
        return;
      }

      setNotice("Treino pronto duplicado com sucesso.");
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  async function deleteTemplate(template: WorkoutTemplate) {
    const confirmed = window.confirm(`Excluir o treino pronto "${template.name}"? Ele deixara de aparecer para os personais.`);
    if (!confirmed) return;

    setError("");
    setLoadingAction(`delete:${template.id}`);
    try {
      const response = await fetch(`/api/admin/workout-templates/${template.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Nao foi possivel excluir o treino pronto.");
        return;
      }

      setTemplates((current) => current.filter((item) => item.id !== template.id));
      if (selectedId === template.id) {
        const next = templates.find((item) => item.id !== template.id);
        setSelectedId(next?.id ?? "new");
        setDraft(templateToDraft(next));
      }
      setNotice("Treino pronto excluido.");
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  function createSequence() {
    const sequence = { name: `Nova sequencia ${sequences.length + 1}`, exercises: [] };
    setSequences((current) => [sequence, ...current]);
    setNotice("Nova sequencia criada.");
  }

  function editSequence(sequence: GlobalSequence) {
    setNotice(`${sequence.name} selecionada para revisao.`);
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
      {isEditorOpen ? (
        <TemplateEditorModal
          draft={draft}
          loading={loadingAction === "save"}
          onChange={setDraft}
          onClose={closeEditor}
          onSave={saveTemplate}
          selectedTemplate={selectedTemplate}
        />
      ) : null}

      <div className="space-y-4">
        <Card className="bg-[var(--surface)]">
          <div className="flex gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-[var(--hair)] bg-white text-black">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--ink)]">Treinos prontos globais</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Aqui voce cria bases de treino que aparecem para todos os personais. Eles podem duplicar uma base e adaptar para cada aluno.
              </p>
              {notice ? <p className="mt-3 rounded-[10px] bg-blue-50 px-3 py-2 text-sm font-bold text-blue-950">{notice}</p> : null}
              {error ? <p className="mt-3 rounded-[10px] bg-rose-50 px-3 py-2 text-sm font-bold text-rose-950">{error}</p> : null}
            </div>
          </div>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="lbl">Treinos prontos publicados</p>
            <button type="button" onClick={startNewTemplate} className="pressable flex h-10 items-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800">
              <Plus className="size-4" />
              Novo treino pronto
            </button>
          </div>
          <div className="grid gap-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{template.name}</h2>
                      <Badge tone="blue">{template.category}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      {template.level} · {exerciseCount(template)} exercicios · Atualizado em {updatedLabel(template)}
                    </p>
                  </div>
                  <Badge tone="success" dot>Publicado</Badge>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <button type="button" onClick={() => selectTemplate(template)} className="h-10 rounded-[10px] border border-black bg-white text-sm font-semibold hover:bg-[var(--surface)]">Editar</button>
                  <button type="button" disabled={loadingAction !== null} onClick={() => duplicateTemplate(template)} className="h-10 rounded-[10px] bg-black text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60">{loadingAction === `duplicate:${template.id}` ? "Duplicando..." : "Duplicar"}</button>
                  <button type="button" disabled={loadingAction !== null} onClick={() => deleteTemplate(template)} className="h-10 rounded-[10px] bg-rose-50 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60">
                    <span className="inline-flex items-center justify-center gap-2"><Trash2 className="size-4" /> Excluir</span>
                  </button>
                </div>
              </Card>
            ))}
            {!templates.length ? (
              <Card>
                <p className="text-sm font-semibold text-neutral-600">Nenhum treino pronto global cadastrado.</p>
                <p className="mt-1 text-xs font-medium text-neutral-500">Clique em Novo treino pronto para criar o primeiro.</p>
              </Card>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="lbl">Sequencias prontas globais</p>
            <button type="button" onClick={createSequence} className="pressable flex h-10 items-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800">
              <Plus className="size-4" />
              Nova sequencia
            </button>
          </div>
          <div className="grid gap-3">
            {sequences.map((sequence) => (
              <Card key={sequence.name}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{sequence.name}</h2>
                      <Badge tone="success">Global</Badge>
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      {sequence.exercises.length} exercicios · aparece para todos os personais
                    </p>
                  </div>
                  <button type="button" onClick={() => editSequence(sequence)} className="rounded-[10px] border border-[var(--hair)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface)]">Editar</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <Card>
          <p className="lbl">Biblioteca global</p>
          <div className="mt-4 grid gap-3">
            {globalExercises.slice(0, 4).map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-3 rounded-[12px] border border-[var(--hair)] bg-[var(--surface)] p-3">
                <div className="grid size-10 place-items-center rounded-[10px] bg-white text-black">
                  <Dumbbell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{exercise.name}</h3>
                  <p className="mt-1 text-xs font-medium text-neutral-500">{exercise.muscleGroup}</p>
                </div>
                <Check className="size-4 text-[var(--green)]" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="lbl">Impacto</p>
          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Um treino pronto e uma base global. Excluir aqui apenas despublica essa base para novos usos; os treinos ja aplicados aos alunos continuam preservados.
          </p>
        </Card>
      </aside>
    </section>
  );
}

function TemplateEditorModal({
  draft,
  loading,
  onChange,
  onClose,
  onSave,
  selectedTemplate,
}: {
  draft: TemplateDraft;
  loading: boolean;
  onChange: (draft: TemplateDraft) => void;
  onClose: () => void;
  onSave: () => void;
  selectedTemplate?: WorkoutTemplate;
}) {
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/40 px-4 py-5">
      <div
        aria-modal="true"
        className="mx-auto w-full max-w-lg rounded-[24px] border border-[var(--hair)] bg-white p-5 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="lbl">{draft.isNew ? "Novo treino pronto" : "Editar treino pronto"}</p>
            <h2 className="mt-2 truncate text-xl font-bold text-[var(--ink)]">{draft.name}</h2>
            {selectedTemplate ? <p className="mt-1 text-xs font-medium text-neutral-500">Editando treino pronto publicado</p> : null}
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <Field label="Nome do treino geral">
            <input className="admin-input" value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
          </Field>
          <Field label="Objetivo">
            <input className="admin-input" value={draft.goal} onChange={(event) => onChange({ ...draft, goal: event.target.value })} />
          </Field>
          <Field label="Tipo">
            <select className="admin-input" value={draft.category} onChange={(event) => onChange({ ...draft, category: event.target.value })}>
              <option>Musculacao</option>
              <option>Corrida</option>
              <option>Hibrido</option>
              <option>Funcional</option>
              <option>Mobilidade</option>
              <option>Recuperacao</option>
            </select>
          </Field>
          <Field label="Nivel">
            <select className="admin-input" value={draft.level} onChange={(event) => onChange({ ...draft, level: event.target.value })}>
              <option>Iniciante</option>
              <option>Intermediario</option>
              <option>Avancado</option>
              <option>Todos</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dias/semana">
              <input className="admin-input" type="number" min={1} max={7} value={draft.daysPerWeek} onChange={(event) => onChange({ ...draft, daysPerWeek: Number(event.target.value) })} />
            </Field>
            <Field label="Duracao min.">
              <input className="admin-input" type="number" min={10} max={180} value={draft.estimatedDurationMinutes} onChange={(event) => onChange({ ...draft, estimatedDurationMinutes: Number(event.target.value) })} />
            </Field>
          </div>
          <Field label="Local">
            <input className="admin-input" value={draft.location} onChange={(event) => onChange({ ...draft, location: event.target.value })} />
          </Field>
          <Field label="Equipamentos">
            <input className="admin-input" value={draft.equipmentText} onChange={(event) => onChange({ ...draft, equipmentText: event.target.value })} placeholder="Maquinas, Halteres" />
          </Field>
          <Field label="Descricao global">
            <textarea className="admin-input min-h-24 py-3" value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} />
          </Field>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" disabled={loading} onClick={onClose} className="pressable h-12 rounded-[14px] border border-[var(--hair)] bg-white text-sm font-bold text-[var(--ink)] disabled:opacity-60">
            Cancelar
          </button>
          <button type="button" disabled={loading} onClick={onSave} className="pressable flex h-12 items-center justify-center gap-2 rounded-[14px] bg-black text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">
            <Save className="size-4" />
            {loading ? "Salvando..." : draft.isNew ? "Criar" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-neutral-700">
      {label}
      {children}
    </label>
  );
}
