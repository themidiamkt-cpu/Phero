import { LockKeyhole } from "lucide-react";
import { canStudentOpenWorkouts, getCurrentProfile } from "@/lib/auth";
import { isSubscriptionBlocked } from "@/lib/billing-status";
import { PageHeader, Card } from "@/components/ui";
import { StudentWorkoutTabs } from "@/components/mvp-widgets";
import { getMvpData, getStudentFinanceData } from "@/lib/data";

export default async function AlunoTreinosPage() {
  const profile = await getCurrentProfile();
  const [data, finance] = await Promise.all([getMvpData(), getStudentFinanceData(profile.id)]);
  const student = data.students.find((item) => item.id === profile.id);
  const paymentStatus = student?.paymentStatus ?? profile.paymentStatus;
  const accessStatus = student?.accessStatus ?? profile.accessStatus;
  const canTrain = canStudentOpenWorkouts(paymentStatus, accessStatus) && !isSubscriptionBlocked(finance.subscription);

  return (
    <>
      <PageHeader eyebrow="Treinos" title="Plano da semana" showBack={false} />
      {!canTrain ? (
        <Card className="mx-5 bg-rose-50">
          <LockKeyhole className="size-5 text-rose-700" />
          <h2 className="mt-3 font-semibold">Treinos indisponiveis</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">Regularize o financeiro para liberar o acesso.</p>
        </Card>
      ) : null}
      <div className="mt-4">
        <StudentWorkoutTabs locked={!canTrain} items={data.workouts} studentId={profile.id} />
      </div>
    </>
  );
}
