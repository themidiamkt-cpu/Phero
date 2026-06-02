import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAddStudent, generateInviteCode, normalizeInviteCode } from "@/lib/trainer-invite";

type RegisterPayload = {
  role?: "student" | "trainer";
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  trainerCode?: string;
  consentLgpd?: boolean;
};

function isMissingInviteSchema(message?: string) {
  return Boolean(message?.includes("invite_code") || message?.includes("platform_subscription_status") || message?.includes("pix_key"));
}

const inviteSchemaError = "Banco ainda sem os campos de convite do personal. Rode o SQL supabase/trainer_invite_billing.sql no Supabase e tente novamente.";

export async function POST(request: Request) {
  const payload = (await request.json()) as RegisterPayload;
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  const role = payload.role;
  const fullName = payload.fullName?.trim();
  const email = payload.email?.trim().toLowerCase();
  const phone = payload.phone?.trim() || null;
  const password = payload.password?.trim();

  if (!role || !fullName || !email || !phone || !password) {
    return NextResponse.json({ ok: false, error: "Preencha nome, email, telefone e senha." }, { status: 400 });
  }

  if (!payload.consentLgpd) {
    return NextResponse.json({ ok: false, error: "O consentimento LGPD e obrigatorio." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers.users.find((user) => user.email?.toLowerCase() === email);
  if (existingUser) {
    return NextResponse.json({ ok: false, error: "Este email ja possui uma conta." }, { status: 409 });
  }

  if (role === "student") {
    const trainerCode = normalizeInviteCode(payload.trainerCode ?? "");
    if (!trainerCode) {
      return NextResponse.json({ ok: false, error: "Informe o codigo do personal." }, { status: 400 });
    }

    const { data: trainer, error: trainerError } = await admin
      .from("trainers")
      .select("id, platform_subscription_status")
      .eq("invite_code", trainerCode)
      .single();

    if (trainerError || !trainer) {
      if (isMissingInviteSchema(trainerError?.message)) {
        return NextResponse.json({ ok: false, error: inviteSchemaError }, { status: 500 });
      }
      return NextResponse.json({ ok: false, error: "Codigo do personal nao encontrado." }, { status: 404 });
    }

    const { count } = await admin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", trainer.id);

    if (!canAddStudent(count ?? 0, trainer.platform_subscription_status)) {
      return NextResponse.json({ ok: false, error: "Este personal atingiu o limite de 2 alunos gratuitos. Ele precisa ativar a assinatura da plataforma." }, { status: 402 });
    }

    const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student", consent_lgpd: true },
    });

    if (userError || !createdUser.user) {
      return NextResponse.json({ ok: false, error: userError?.message ?? "Nao foi possivel criar usuario." }, { status: 500 });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .insert({
        user_id: createdUser.user.id,
        role: "student",
        full_name: fullName,
        phone,
        status: "active",
      })
      .select("id")
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: profileError?.message ?? "Nao foi possivel criar perfil." }, { status: 500 });
    }

    const { data: student, error: studentError } = await admin
      .from("students")
      .insert({
        trainer_id: trainer.id,
        profile_id: profile.id,
        full_name: fullName,
        phone,
        status: "active",
        access_status: "released",
      })
      .select("id")
      .single();

    if (studentError || !student) {
      return NextResponse.json({ ok: false, error: studentError?.message ?? "Nao foi possivel criar aluno." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, role: "aluno", id: student.id });
  }

  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "trainer", consent_lgpd: true },
  });

  if (userError || !createdUser.user) {
    return NextResponse.json({ ok: false, error: userError?.message ?? "Nao foi possivel criar usuario." }, { status: 500 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      user_id: createdUser.user.id,
      role: "trainer",
      full_name: fullName,
      phone,
      status: "active",
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ ok: false, error: profileError?.message ?? "Nao foi possivel criar perfil." }, { status: 500 });
  }

  let inviteCode = generateInviteCode(fullName);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data: exists } = await admin.from("trainers").select("id").eq("invite_code", inviteCode).maybeSingle();
    if (!exists) break;
    inviteCode = generateInviteCode(fullName);
  }

  const { data: trainer, error: trainerError } = await admin
    .from("trainers")
    .insert({
      profile_id: profile.id,
      business_name: fullName,
      invite_code: inviteCode,
      platform_subscription_status: "trial",
      approved_at: new Date().toISOString(),
    })
    .select("id, invite_code")
    .single();

  if (trainerError || !trainer) {
    if (isMissingInviteSchema(trainerError?.message)) {
      return NextResponse.json({ ok: false, error: inviteSchemaError }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: trainerError?.message ?? "Nao foi possivel criar personal." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: "personal", id: trainer.id, inviteCode: trainer.invite_code });
}
