import { Save, Video } from "lucide-react";
import { BackButton } from "@/components/back-button";

const muscleGroups = ["Peito", "Costas", "Pernas", "Ombro", "Biceps", "Triceps", "Corrida"];

export default function NovoExercicioPage() {
  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pb-5 pt-7">
        <BackButton />
        <div className="min-w-0 flex-1 text-center">
          <p className="lbl">Novo exercicio</p>
        </div>
        <button className="pressable h-10 rounded-[12px] bg-[var(--blue)] px-4 text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.28)]">
          Salvar
        </button>
      </header>

      <section className="space-y-5 px-5">
        <label className="grid aspect-[2.15] cursor-pointer place-items-center rounded-[18px] border border-[var(--hair)] bg-[repeating-linear-gradient(135deg,#fbfbfc_0,#fbfbfc_9px,#f1f2f5_9px,#f1f2f5_11px)]">
          <span className="grid place-items-center gap-4 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-white shadow-sm">
              <Video className="size-6 text-[var(--ink)]" />
            </span>
            <span className="lbl">Enviar video do exercicio</span>
            <span className="text-xs font-medium text-neutral-400">MP4 · ate 60s · 1080p</span>
          </span>
          <input className="sr-only" type="file" accept="video/mp4,video/*" />
        </label>

        <label className="grid gap-2">
          <span className="lbl">Nome do exercicio</span>
          <input
            className="h-12 rounded-[14px] border border-[var(--hair)] bg-white px-4 text-sm font-medium text-[var(--ink)] outline-none focus:border-[var(--blue)]"
            defaultValue="Supino inclinado"
            placeholder="Nome do exercicio"
          />
        </label>

        <div>
          <p className="lbl mb-3">Grupo muscular</p>
          <div className="flex flex-wrap gap-2">
            {muscleGroups.map((group, index) => (
              <button
                key={group}
                type="button"
                className={index === 0 ? "pressable h-10 rounded-[12px] bg-[var(--blue)] px-4 text-sm font-bold text-white" : "pressable h-10 rounded-[12px] bg-white px-4 text-sm font-bold text-neutral-700 shadow-sm"}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-2">
          <span className="lbl">Descricao</span>
          <textarea
            className="min-h-28 rounded-[14px] border border-[var(--hair)] bg-white px-4 py-4 text-sm font-medium text-[var(--ink)] outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]"
            placeholder="Como executar o movimento..."
          />
        </label>

        <label className="grid gap-2">
          <span className="lbl">Observacoes</span>
          <textarea
            className="min-h-28 rounded-[14px] border border-[var(--hair)] bg-white px-4 py-4 text-sm font-medium text-[var(--ink)] outline-none placeholder:text-neutral-400 focus:border-[var(--blue)]"
            placeholder="Dicas, cuidados, respiracao..."
          />
        </label>

        <button className="pressable flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white shadow-[0_8px_22px_rgba(10,132,255,.28)]">
          <Save className="size-4" />
          Salvar exercicio
        </button>
      </section>
    </>
  );
}
