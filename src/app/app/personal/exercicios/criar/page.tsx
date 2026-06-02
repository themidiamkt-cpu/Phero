import Link from "next/link";
import { Dumbbell, Layers3, Route } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";

export default function CriarNaBibliotecaPage() {
  return (
    <>
      <PageHeader eyebrow="Biblioteca" title="Adicionar" />
      <section className="grid gap-3 px-5">
        <Link href="/app/personal/exercicios/novo">
          <Card className="pressable">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-[16px] bg-[var(--blue-wash)] text-[var(--blue)]">
                <Dumbbell className="size-6" />
              </div>
              <div>
                <h2 className="font-bold">Novo exercicio</h2>
                <p className="mt-1 text-sm text-neutral-500">Cadastrar musculacao, corrida, mobilidade e instrucoes.</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/app/personal/exercicios/sequencias/novo">
          <Card className="pressable">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-[16px] bg-[var(--green-wash)] text-[var(--green)]">
                <Layers3 className="size-6" />
              </div>
              <div>
                <h2 className="font-bold">Nova sequencia</h2>
                <p className="mt-1 text-sm text-neutral-500">Montar bloco de musculacao ou corrida pre-programada.</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/app/personal/exercicios/corrida/novo">
          <Card className="pressable">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-[16px] bg-[var(--amber-wash)] text-[var(--amber)]">
                <Route className="size-6" />
              </div>
              <div>
                <h2 className="font-bold">Novo estilo de corrida</h2>
                <p className="mt-1 text-sm text-neutral-500">Salvar Z2, tiros, longao, progressivo e parametros de pace.</p>
              </div>
            </div>
          </Card>
        </Link>
      </section>
    </>
  );
}
