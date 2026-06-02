import { getCurrentProfile } from "@/lib/auth";
import { MobileAppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const role = profile.role === "personal" ? "personal" : "aluno";

  return <MobileAppShell role={role}>{children}</MobileAppShell>;
}
