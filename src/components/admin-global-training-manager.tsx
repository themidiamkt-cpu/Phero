"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Dumbbell, Globe2, Plus, Save } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { workouts } from "@/lib/mock-data";
import type { Exercise } from "@/lib/types";

type GlobalTemplate = {
  id: string;
  title: string;
  type: string;
  level: string;
  exercises: number;
  updatedAt: string;
  description: string;
};

type GlobalSequence = {
  name: string;
  exercises: string[];
};

const initialTemplates: GlobalTemplate[] = [
  {
    id: "global-strength-1",
    title: "Base Hipertrofia A",
    type: "Musculacao",
    level: "Intermediario",
    exercises: 8,
    updatedAt: "31/05/2026",
    description: "Modelo base para prescricao de hipertrofia. Personais podem duplicar e adaptar por aluno.",
  },
  {
    id: "global-running-1",
    title: "Corrida Zona 2",
    type: "Corrida",
    level: "Todos",
    exercises: 1,
    updatedAt: "28/05/2026",
    description: "Modelo base para corrida continua em zona 2.",
  },
  {
    id: "global-mobility-1",
    title: "Mobilidade de quadril",
    type: "Mobilidade",
    level: "Iniciante",
    exercises: 5,
    updatedAt: "21/05/2026",
    description: "Sequencia base para mobilidade e aquecimento.",
  },
];

const initialSequences: GlobalSequence[] = [
  { name: "Inferiores completo", exercises: ["Agachamento livre", "Leg press", "Prancha com toque"] },
  { name: "Peito basico", exercises: ["Supino inclinado", "Crucifixo"] },
];

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

export function AdminGlobalTrainingManager({ globalExercises }: { globalExercises: Exercise[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [sequences, setSequences] = useState(initialSequences);
  const [selectedId, setSelectedId] = useState(initialTemplates[0].id);
  const [notice, setNotice] = useState("");
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId) ?? templates[0],
    [selectedId, templates],
  );
  const [draft, setDraft] = useState(selectedTemplate);

  function editTemplate(template: GlobalTemplate) {
    setSelectedId(template.id);
    setDraft(template);
    setNotice(`${template.title} carregado no editor rapido.`);
  }

  function duplicateTemplate(template: GlobalTemplate) {
    const copy = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      title: `${template.title} copia`,
      updatedAt: todayLabel(),
    };
    setTemplates((current) => [copy, ...current]);
    setSelectedId(copy.id);
    setDraft(copy);
    setNotice("Modelo duplicado e carregado no editor.");
  }

  function createTemplate() {
    const template = {
      id: `global-template-${Date.now()}`,
      title: "Novo modelo global",
      type: "Musculacao",
      level: "Iniciante",
      exercises: 0,
      updatedAt: todayLabel(),
      description: "Descreva quando os personais devem usar este modelo.",
    };
    setTemplates((current) => [template, ...current]);
    setSelectedId(template.id);
    setDraft(template);
    setNotice("Novo modelo criado no editor.");
  }

  function saveTemplate() {
    const updated = { ...draft, updatedAt: todayLabel() };
    setTemplates((current) => current.map((template) => (template.id === updated.id ? updated : template)));
    setNotice("Alteracao global salva nesta tela.");
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
      <div className="space-y-4">
        <Card className="bg-[var(--surface)]">
          <div className="flex gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-[10px] border border-[var(--hair)] bg-white text-black">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--ink)]">Edicao global</h2>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Qualquer alteracao feita aqui altera os modelos base de treino para todos os personais da plataforma.
              </p>
              {notice ? <p className="mt-3 rounded-[10px] bg-blue-50 px-3 py-2 text-sm font-bold text-blue-950">{notice}</p> : null}
            </div>
          </div>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="lbl">Modelos publicados</p>
            <button type="button" onClick={createTemplate} className="pressable flex h-10 items-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800">
              <Plus className="size-4" />
              Novo modelo
            </button>
          </div>
          <div className="grid gap-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{template.title}</h2>
                      <Badge tone="blue">{template.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-neutral-500">
                      {template.level} · {template.exercises} exercicios · Atualizado em {template.updatedAt}
                    </p>
                  </div>
                  <Badge tone="success" dot>Publicado</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => editTemplate(template)} className="h-10 rounded-[10px] border border-black bg-white text-sm font-semibold hover:bg-[var(--surface)]">Editar</button>
                  <button type="button" onClick={() => duplicateTemplate(template)} className="h-10 rounded-[10px] bg-black text-sm font-semibold text-white hover:bg-neutral-800">Duplicar</button>
                </div>
              </Card>
            ))}
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl">Editor rapido</p>
              <h2 className="mt-2 text-lg font-semibold">{draft.title}</h2>
            </div>
            <div className="grid size-11 place-items-center rounded-[10px] border border-[var(--hair)] bg-white text-black">
              <Globe2 className="size-5" />
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Nome do treino geral
              <input className="h-12 rounded-[10px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Tipo
              <select className="h-12 rounded-[10px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>
                <option>Musculacao</option>
                <option>Corrida</option>
                <option>Hibrido</option>
                <option>Funcional</option>
                <option>Mobilidade</option>
                <option>Recuperacao</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Nivel
              <select className="h-12 rounded-[10px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value })}>
                <option>Iniciante</option>
                <option>Intermediario</option>
                <option>Avancado</option>
                <option>Todos</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-neutral-700">
              Descricao global
              <textarea className="min-h-24 rounded-[10px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </label>
          </div>

          <button type="button" onClick={saveTemplate} className="pressable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-black text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.12)] hover:bg-neutral-800">
            <Save className="size-4" />
            Salvar alteracao global
          </button>
        </Card>

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
            {workouts.length} treinos usam a estrutura base. Em producao, este editor deve gravar em tabelas globais versionadas para auditoria.
          </p>
        </Card>
      </aside>
    </section>
  );
}
