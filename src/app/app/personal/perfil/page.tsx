import { Avatar, Badge, Card, PageHeader, Stat } from "@/components/ui";
import { getCurrentProfile } from "@/lib/auth";
import { getMvpData, getTrainersData } from "@/lib/data";
import { LogoutButton } from "@/components/logout-button";
import { PersonalProfileForm } from "@/components/personal-profile-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function PersonalPerfilPage() {
  const profile = await getCurrentProfile();
  const [allTrainers, data] = await Promise.all([getTrainersData(), getMvpData()]);
  const trainer = allTrainers.find((item) => item.id === profile.id || item.email === profile.email) ?? {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: "personal" as const,
    approved: profile.approved ?? true,
    blocked: profile.blocked ?? false,
    specialty: "Personal trainer",
    studentsCount: 0,
    monthlyRevenue: 0,
  };
  const trainerStudents = data.students.filter((student) => student.personalId === trainer.id);
  const trainerRevenue = data.payments.filter((payment) => payment.personalId === trainer.id && (payment.status === "approved" || payment.status === "paid")).reduce((sum, payment) => sum + payment.amount, 0);
  const trainerPlans = data.plans
    .filter((plan) => plan.trainerId === trainer.id)
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: String(plan.price),
      billingCycle: plan.billingCycle,
      customDays: plan.customDays ? String(plan.customDays) : "",
    }));
  const platformActive = trainer.platformSubscriptionStatus === "active";

  return (
    <>
      <ThemeToggle className="fixed right-[calc(50%-13rem)] top-5 z-30 max-[440px]:right-5" />
      <PageHeader eyebrow="Perfil" title={profile.name} showBack={false} />
      <section className="px-5">
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} size={64} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{profile.name}</h2>
              <p className="mt-1 truncate text-sm text-neutral-500">{profile.email}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink-2)]">{trainer.specialty === "Personal trainer" ? "Personal trainer" : trainer.specialty}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Badge tone={trainer.approved ? "success" : "warning"}>{trainer.approved ? "Aprovado" : "Pendente"}</Badge>
            <Badge tone={trainer.blocked ? "danger" : "success"}>{trainer.blocked ? "Bloqueado" : "Ativo"}</Badge>
          </div>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Alunos" value={String(trainerStudents.length)} tone="light" />
          <Stat label="Receita" value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(trainerRevenue)} tone="green" />
        </div>

        <Card className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="lbl">Assinatura SaaS</p>
              <h2 className="mt-2 text-lg font-bold">{platformActive ? "Assinatura ativa" : "Plano gratuito"}</h2>
              <p className="mt-1 text-sm text-neutral-500">{trainerStudents.length}/2 alunos gratuitos usados.</p>
              <p className="mt-1 text-sm text-neutral-500">{platformActive ? "Cadastro de alunos liberado." : "Ative a assinatura para cadastrar mais de 2 alunos."}</p>
            </div>
            <Badge tone={platformActive ? "success" : trainerStudents.length >= 2 ? "warning" : "blue"} dot>
              {platformActive ? "ATIVA" : "GRATUITO"}
            </Badge>
          </div>
          <button className="pressable mt-4 h-11 w-full rounded-[14px] border border-[var(--hair)] bg-[var(--surface)] text-sm font-bold text-[var(--ink)]">
            {platformActive ? "Gerenciar assinatura" : "Ativar assinatura"}
          </button>
        </Card>

        <Card className="mt-4">
          <p className="lbl">Dados profissionais</p>
          <PersonalProfileForm
            name={profile.name}
            email={profile.email}
            phone={profile.phone ?? ""}
            businessName={trainer.businessName ?? ""}
            document={trainer.document ?? ""}
            instagram={trainer.instagram ?? ""}
            bio={trainer.bio ?? ""}
            hourlyRate={trainer.hourlyRate ? String(trainer.hourlyRate) : ""}
            inviteCode={trainer.inviteCode}
            pixKey={trainer.pixKey}
            platformSubscriptionStatus={trainer.platformSubscriptionStatus}
            studentCount={trainerStudents.length}
            plans={trainerPlans}
          />
          <LogoutButton />
        </Card>
      </section>
    </>
  );
}
