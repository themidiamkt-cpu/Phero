import { PageHeader } from "@/components/ui";
import { QuickChat } from "@/components/quick-chat";
import { getCurrentProfile } from "@/lib/auth";
import { getStudentsData } from "@/lib/data";

export default async function PersonalChatPage() {
  const profile = await getCurrentProfile();
  const students = await getStudentsData();
  const student = students.find((item) => item.personalId === profile.id);

  return (
    <>
      <PageHeader eyebrow="Chat" title="Conversas" />
      <QuickChat currentEmail={profile.email} mode="trainer" peerEmail={student?.email ?? ""} peerName={student?.name ?? "Aluno"} />
    </>
  );
}
