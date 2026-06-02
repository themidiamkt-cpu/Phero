import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canAddStudent } from "@/lib/trainer-invite";

type CreateStudentPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  goal?: string;
  password?: string;
};

async function findCurrentUser(request: NextRequest): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) return data.user;

  const admin = createAdminClient();
  const fallbackEmail = (request.cookies.get("app-user-email")?.value ?? request.cookies.get("demo-user-email")?.value)?.trim().toLowerCase();
  if (!admin || !fallbackEmail) return null;

  const { data: usersData } = await admin.auth.admin.listUsers();
  return usersData.users.find((user) => user.email?.toLowerCase() === fallbackEmail) ?? null;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CreateStudentPayload;
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  const trainerUser = await findCurrentUser(request);
  if (!trainerUser) {
    return NextResponse.json({ ok: false, error: "Sessao nao encontrada. Entre novamente." }, { status: 401 });
  }

  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const phone = payload.phone?.trim() || null;
  const goal = payload.goal?.trim() || null;
  const password = payload.password?.trim() || "12345678";

  if (!fullName || !email) {
    return NextResponse.json({ ok: false, error: "Nome e email sao obrigatorios." }, { status: 400 });
  }

  const { data: trainerProfile, error: trainerProfileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("user_id", trainerUser.id)
    .single();

  if (trainerProfileError || !trainerProfile || trainerProfile.role !== "trainer") {
    return NextResponse.json({ ok: false, error: "Apenas personal pode criar aluno." }, { status: 403 });
  }

  const { data: trainer, error: trainerError } = await admin
    .from("trainers")
    .select("id, platform_subscription_status")
    .eq("profile_id", trainerProfile.id)
    .single();

  if (trainerError || !trainer) {
    return NextResponse.json({ ok: false, error: trainerError?.message ?? "Personal nao encontrado." }, { status: 500 });
  }

  const { count } = await admin
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("trainer_id", trainer.id);

  if (!canAddStudent(count ?? 0, trainer.platform_subscription_status)) {
    return NextResponse.json({ ok: false, error: "Voce atingiu o limite de 2 alunos gratuitos. Ative a assinatura da plataforma para cadastrar mais alunos." }, { status: 402 });
  }

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers.users.find((user) => user.email?.toLowerCase() === email);
  const userResult = existingUser
    ? { data: { user: existingUser }, error: null }
    : await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "student",
        },
      });

  if (userResult.error || !userResult.data.user) {
    return NextResponse.json({ ok: false, error: userResult.error?.message ?? "Nao foi possivel criar usuario." }, { status: 500 });
  }

  const user = userResult.data.user;

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...(user.user_metadata ?? {}),
      full_name: fullName,
      role: "student",
    },
  });

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        role: "student",
        full_name: fullName,
        phone,
        status: "active",
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ ok: false, error: profileError?.message ?? "Nao foi possivel criar perfil." }, { status: 500 });
  }

  const { data: student, error: studentError } = await admin
    .from("students")
    .upsert(
      {
        trainer_id: trainer.id,
        profile_id: profile.id,
        full_name: fullName,
        phone,
        birth_date: payload.birthDate || null,
        goal,
        status: "active",
        access_status: "released",
      },
      { onConflict: "profile_id" },
    )
    .select("id")
    .single();

  if (studentError || !student) {
    return NextResponse.json({ ok: false, error: studentError?.message ?? "Nao foi possivel criar aluno." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: student.id });
}
