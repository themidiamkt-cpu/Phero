import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AdminTrainerAction = "approve" | "reject" | "block" | "unblock";
type RouteContext = {
  params: Promise<{ trainerId: string }>;
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const body = (await request.json().catch(() => ({}))) as { action?: AdminTrainerAction };
  const action = body.action;

  if (!action || !["approve", "reject", "block", "unblock"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Acao administrativa invalida." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  const currentUser = await findCurrentUser(request);
  if (!currentUser) {
    return NextResponse.json({ ok: false, error: "Sessao nao encontrada." }, { status: 401 });
  }

  const { data: adminProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", currentUser.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Apenas admin pode executar esta acao." }, { status: 403 });
  }

  const { trainerId } = await context.params;
  const { data: trainer, error: trainerError } = await admin
    .from("trainers")
    .select("id, profile_id")
    .eq("id", trainerId)
    .single();

  if (trainerError || !trainer) {
    return NextResponse.json({ ok: false, error: "Personal nao encontrado." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const trainerPatch =
    action === "approve"
      ? { approved_at: now, blocked_at: null }
      : action === "reject"
        ? { approved_at: null, blocked_at: null }
        : action === "block"
          ? { blocked_at: now }
          : { blocked_at: null };

  const profileStatus = action === "reject" ? "rejected" : action === "block" ? "blocked" : "active";

  const { error: updateTrainerError } = await admin
    .from("trainers")
    .update(trainerPatch)
    .eq("id", trainer.id);

  if (updateTrainerError) {
    return NextResponse.json({ ok: false, error: updateTrainerError.message }, { status: 500 });
  }

  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({ status: profileStatus })
    .eq("id", trainer.profile_id);

  if (updateProfileError) {
    return NextResponse.json({ ok: false, error: updateProfileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
