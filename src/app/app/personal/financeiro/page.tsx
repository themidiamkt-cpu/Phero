import { PageHeader } from "@/components/ui";
import { PersonalFinance } from "@/components/mvp-widgets";
import { getCurrentProfile } from "@/lib/auth";
import { getMvpData } from "@/lib/data";

export default async function PersonalFinanceiroPage() {
  const [profile, data] = await Promise.all([getCurrentProfile(), getMvpData()]);
  return (
    <>
      <PageHeader eyebrow="Recebimentos" title="Financeiro" showBack={false} />
      <PersonalFinance paymentItems={data.payments} studentItems={data.students} trainerId={profile.id} />
    </>
  );
}
