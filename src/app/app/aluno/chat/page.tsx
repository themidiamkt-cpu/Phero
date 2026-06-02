import { PageHeader } from "@/components/ui";
import { QuickChat } from "@/components/quick-chat";
import { getCurrentProfile } from "@/lib/auth";
import { getTrainersData } from "@/lib/data";

export default async function AlunoChatPage() {
  const profile = await getCurrentProfile();
  const trainers = await getTrainersData();
  const trainer = trainers.find((item) => item.id === profile.personalId) ?? trainers[0];

  return (
    <>
      <PageHeader eyebrow="Chat" title="Falar com personal" />
      <QuickChat currentEmail={profile.email} mode="student" peerEmail={trainer?.email ?? ""} peerName={trainer?.name ?? "Personal"} />
    </>
  );
}
