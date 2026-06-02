import { PageHeader } from "@/components/ui";
import { WorkoutList } from "@/components/domain-sections";
import Link from "next/link";

export default function PersonalTreinosPage() {
  return (
    <>
      <PageHeader eyebrow="Prescricao" title="Treinos" showBack={false} action={<Link className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white" href="/app/personal/treinos/novo">Novo</Link>} />
      <section className="mb-4 grid grid-cols-2 gap-2 px-5">
        <Link className="grid h-11 place-items-center rounded-[14px] bg-white text-sm font-bold text-[var(--ink)] shadow-sm" href="/app/personal/treinos-prontos">Modelos prontos</Link>
        <Link className="grid h-11 place-items-center rounded-[14px] bg-[var(--blue)] text-sm font-bold text-white" href="/app/personal/treinos/novo">Criar do zero</Link>
      </section>
      <WorkoutList />
    </>
  );
}
