import { PageHeader } from "@/components/ui";
import { TrainerTable } from "@/components/domain-sections";
import { getMvpData } from "@/lib/data";

export default async function AdminPersonaisPage() {
  const data = await getMvpData();
  const trainers = data.trainers.map((trainer) => ({
    ...trainer,
    studentsCount: data.students.filter((student) => student.personalId === trainer.id).length,
    monthlyRevenue: data.payments
      .filter((payment) => payment.personalId === trainer.id && (payment.status === "approved" || payment.status === "paid"))
      .reduce((sum, payment) => sum + payment.amount, 0),
  }));

  return (
    <>
      <PageHeader eyebrow="Admin" title="Personais" />
      <TrainerTable trainerItems={trainers} />
    </>
  );
}
