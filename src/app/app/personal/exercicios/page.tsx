import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { ExerciseLibrary } from "@/components/mvp-widgets";

export default function PersonalExerciciosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Biblioteca"
        title="Exercicios"
        showBack={false}
        action={
          <Link href="/app/personal/exercicios/criar" className="pressable grid size-11 place-items-center rounded-full bg-[var(--blue)] text-white shadow-[0_8px_22px_rgba(10,132,255,.32)]">
            <Plus className="size-6" />
          </Link>
        }
      />
      <ExerciseLibrary />
    </>
  );
}
