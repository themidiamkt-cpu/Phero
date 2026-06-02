import { getCurrentProfile } from "@/lib/auth";
import { ChevronRight, UserRound } from "lucide-react";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";
import { LogoutButton } from "@/components/logout-button";
import { ProfileForm } from "@/components/profile-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AlunoPerfilPage() {
  const profile = await getCurrentProfile();

  return (
    <>
      <ThemeToggle className="fixed right-[calc(50%-13rem)] top-5 z-30 max-[440px]:right-5" />
      <PageHeader eyebrow="Conta" title="Perfil" showBack={false} />
      <section className="px-5">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} size={64} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{profile.name}</h2>
              <p className="mt-1 truncate text-sm text-neutral-500">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="blue">Aluno</Badge>
                <Badge tone={profile.accessStatus === "active" ? "blue" : "danger"}>{profile.accessStatus === "active" ? "Teo Performance" : "Bloqueado"}</Badge>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-6">
          <p className="lbl mb-3">Conta</p>
          <Card className="p-0">
            <ProfileMenuItem icon={<UserRound className="size-4" />} title="Dados pessoais" subtitle="Nome, medidas, foto" expanded>
              <ProfileForm
                name={profile.name}
                email={profile.email}
                phone={profile.phone ?? ""}
                birthDate={profile.birthDate ?? ""}
                goal={profile.goal ?? "Ganhar massa magra"}
              />
            </ProfileMenuItem>
          </Card>
        </div>

        <LogoutButton />
      </section>
    </>
  );
}

function ProfileMenuItem({
  icon,
  title,
  subtitle,
  expanded = false,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  expanded?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <button type="button" className="flex w-full items-center gap-3 p-4 text-left">
        <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-[var(--surface)] text-[var(--ink)]">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[var(--ink)]">{title}</span>
          <span className="mt-1 block truncate text-xs font-medium text-neutral-500">{subtitle}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-neutral-400" />
      </button>
      {expanded ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}
