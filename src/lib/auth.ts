import { cookies } from "next/headers";
import { profiles, students } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AccessStatus, PaymentStatus, Profile, Student, UserRole } from "@/lib/types";

export type CurrentProfile = Profile &
  Partial<Pick<Student, "personalId" | "paymentStatus" | "accessStatus" | "goal" | "nextWorkout" | "adherence">> & {
  birthDate?: string;
  phone?: string;
};

function dbRoleToAppRole(role?: string): UserRole {
  if (role === "admin") return "admin";
  if (role === "trainer" || role === "personal") return "personal";
  return "aluno";
}

export async function getCurrentProfile(): Promise<CurrentProfile> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const store = await cookies();
  const cookieEmail = store.get("app-user-email")?.value ?? store.get("demo-user-email")?.value;
  let currentUser = data.user ?? null;

  if (admin && cookieEmail && currentUser?.email?.toLowerCase() !== cookieEmail.toLowerCase()) {
    const { data: usersData } = await admin.auth.admin.listUsers();
    currentUser = usersData.users.find((user) => user.email?.toLowerCase() === cookieEmail.toLowerCase()) ?? currentUser;
  }

  if (currentUser?.id && admin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, full_name, phone, status")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (profile) {
      const role = dbRoleToAppRole(profile.role);

      if (role === "aluno") {
        const { data: student } = await admin
          .from("students")
          .select("id, trainer_id, full_name, phone, birth_date, goal, status, access_status")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (student) {
          return {
            id: student.id,
            name: student.full_name ?? profile.full_name,
            email: currentUser.email ?? "",
            role: "aluno",
            personalId: student.trainer_id,
            paymentStatus: student.access_status === "released" ? "approved" : "overdue",
            accessStatus: student.access_status === "released" ? "active" : "blocked",
            goal: student.goal ?? "",
            nextWorkout: "Proximo treino",
            adherence: student.status === "active" ? 80 : 30,
            birthDate: student.birth_date ?? undefined,
            phone: student.phone ?? profile.phone ?? undefined,
          };
        }
      }

      if (role === "personal") {
        const { data: trainer } = await admin
          .from("trainers")
          .select("id, business_name, bio, approved_at, blocked_at")
          .eq("profile_id", profile.id)
          .maybeSingle();

        return {
          id: trainer?.id ?? profile.id,
          name: profile.full_name,
          email: currentUser.email ?? "",
          role,
          phone: profile.phone ?? undefined,
          approved: Boolean(trainer?.approved_at) || profile.status === "active",
          blocked: Boolean(trainer?.blocked_at) || profile.status === "blocked",
        };
      }

      return {
        id: profile.id,
        name: profile.full_name,
        email: currentUser.email ?? "",
        role,
        phone: profile.phone ?? undefined,
        approved: profile.status === "active",
        blocked: profile.status === "blocked",
      };
    }
  }

  const role = ((store.get("app-role")?.value ?? store.get("demo-role")?.value) as UserRole | undefined) ?? "aluno";
  const email = store.get("app-user-email")?.value ?? store.get("demo-user-email")?.value;
  const profile = profiles.find((item) => item.email === email && item.role === role) ?? profiles.find((item) => item.role === role) ?? profiles[2];

  if (role === "aluno") {
    const paymentStatus = store.get("app-payment-status")?.value as PaymentStatus | undefined;
    const accessStatus = store.get("app-access-status")?.value as AccessStatus | undefined;
    const student = students.find((item) => item.email === email) ?? students[0];
    return {
      ...student,
      paymentStatus: paymentStatus ?? student.paymentStatus,
      accessStatus: accessStatus ?? student.accessStatus,
    };
  }

  return profile;
}

export function canStudentOpenWorkouts(paymentStatus?: PaymentStatus, accessStatus?: AccessStatus) {
  return accessStatus === "active" && (paymentStatus === "paid" || paymentStatus === "approved");
}
