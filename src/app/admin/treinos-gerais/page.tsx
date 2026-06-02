import { AlertTriangle, Check, Dumbbell, Globe2, Plus, Save } from "lucide-react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { exercises, workouts } from "@/lib/mock-data";

const globalTemplates = [
  {
    id: "global-strength-1",
    title: "Base Hipertrofia A",
    type: "Musculacao",
    level: "Intermediario",
    exercises: 8,
    updatedAt: "31/05/2026",
  },
  {
    id: "global-running-1",
    title: "Corrida Zona 2",
    type: "Corrida",
    level: "Todos",
    exercises: 1,
    updatedAt: "28/05/2026",
  },
  {
    id: "global-mobility-1",
    title: "Mobilidade de quadril",
    type: "Mobilidade",
    level: "Iniciante",
    exercises: 5,
    updatedAt: "21/05/2026",
  },
];

const globalSequences = [
  { name: "Inferiores completo", exercises: ["Agachamento livre", "Leg press", "Prancha com toque"] },
  { name: "Peito basico", exercises: ["Supino inclinado", "Crucifixo"] },
];

export default function AdminTreinosGeraisPage() {
  const globalExercises = exercises.filter((exercise) => exercise.source === "library");

  return (
    <>
      <PageHeader eyebrow="Admin global" title="Treinos gerais" />

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
              </div>
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="lbl">Modelos publicados</p>
              <button className="pressable flex h-10 items-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800">
                <Plus className="size-4" />
                Novo modelo
              </button>
            </div>
            <div className="grid gap-3">
              {globalTemplates.map((template) => (
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
                    <button className="h-10 rounded-[10px] border border-black bg-white text-sm font-semibold hover:bg-[var(--surface)]">Editar</button>
                    <button className="h-10 rounded-[10px] bg-black text-sm font-semibold text-white hover:bg-neutral-800">Duplicar</button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="lbl">Sequencias prontas globais</p>
              <button className="pressable flex h-10 items-center gap-2 rounded-[10px] bg-black px-4 text-sm font-semibold text-white hover:bg-neutral-800">
                <Plus className="size-4" />
                Nova sequencia
              </button>
            </div>
            <div className="grid gap-3">
              {globalSequences.map((sequence) => (
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
                    <button className="rounded-[10px] border border-[var(--hair)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface)]">Editar</button>
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
                <h2 className="mt-2 text-lg font-semibold">Base Hipertrofia A</h2>
              </div>
              <div className="grid size-11 place-items-center rounded-[10px] border border-[var(--hair)] bg-white text-black">
                <Globe2 className="size-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Nome do treino geral
                <input className="h-12 rounded-[10px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" defaultValue="Base Hipertrofia A" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Tipo
                <select className="h-12 rounded-[10px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" defaultValue="Musculacao">
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
                <select className="h-12 rounded-[10px] border border-[var(--hair)] bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" defaultValue="Intermediario">
                  <option>Iniciante</option>
                  <option>Intermediario</option>
                  <option>Avancado</option>
                  <option>Todos</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-neutral-700">
                Descricao global
                <textarea className="min-h-24 rounded-[10px] border border-[var(--hair)] bg-white px-3 py-3 text-sm font-medium outline-none transition focus:border-black focus:ring-4 focus:ring-black/5" defaultValue="Modelo base para prescricao de hipertrofia. Personais podem duplicar e adaptar por aluno." />
              </label>
            </div>

            <button className="pressable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-black text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.12)] hover:bg-neutral-800">
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
    </>
  );
}
