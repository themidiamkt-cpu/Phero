import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ templateId: string }>;
};

type TemplatePayload = {
  action?: "duplicate";
  name?: string;
  goal?: string;
  level?: string;
  category?: string;
  daysPerWeek?: number;
  estimatedDurationMinutes?: number;
  location?: string;
  equipment?: string[];
  description?: string;
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

async function requireAdmin(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return { admin: null, response: NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 }) };
  }

  const currentUser = await findCurrentUser(request);
  if (!currentUser) {
    return { admin: null, response: NextResponse.json({ ok: false, error: "Sessao nao encontrada." }, { status: 401 }) };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", currentUser.id)
    .single();

  if (profile?.role !== "admin") {
    return { admin: null, response: NextResponse.json({ ok: false, error: "Apenas admin pode alterar modelos globais." }, { status: 403 }) };
  }

  return { admin, response: null };
}

function normalizePayload(payload: TemplatePayload) {
  const name = payload.name?.trim();
  const goal = payload.goal?.trim() || "Geral";
  const level = payload.level?.trim() || "Iniciante";
  const category = payload.category?.trim() || "Musculacao";
  const daysPerWeek = Math.max(1, Math.min(7, Number(payload.daysPerWeek) || 1));
  const estimatedDurationMinutes = Math.max(10, Math.min(180, Number(payload.estimatedDurationMinutes) || 45));
  const location = payload.location?.trim() || "Academia";
  const equipment = (payload.equipment ?? []).map((item) => item.trim()).filter(Boolean);
  const description = payload.description?.trim() || "Modelo global criado pelo admin.";

  if (!name) return { error: "Nome do modelo e obrigatorio." };

  return {
    data: {
      name,
      goal,
      level,
      category,
      days_per_week: daysPerWeek,
      estimated_duration_minutes: estimatedDurationMinutes,
      location,
      equipment,
      description,
      is_active: true,
    },
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { admin, response } = await requireAdmin(request);
  if (!admin) return response;

  const { templateId } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as TemplatePayload;

  if (payload.action === "duplicate") {
    const { data: current, error: currentError } = await admin
      .from("workout_templates")
      .select("name, goal, level, category, days_per_week, estimated_duration_minutes, location, equipment, description")
      .eq("id", templateId)
      .single();

    if (currentError || !current) {
      return NextResponse.json({ ok: false, error: "Modelo nao encontrado." }, { status: 404 });
    }

    const { data: copy, error: copyError } = await admin
      .from("workout_templates")
      .insert({
        ...current,
        name: `${current.name} copia ${new Date().toLocaleDateString("pt-BR")}`,
        is_active: true,
      })
      .select("id")
      .single();

    if (copyError || !copy) {
      return NextResponse.json({ ok: false, error: copyError?.message ?? "Nao foi possivel duplicar modelo." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: copy.id });
  }

  const normalized = normalizePayload(payload);
  if ("error" in normalized) {
    return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  }

  const { error } = await admin
    .from("workout_templates")
    .update(normalized.data)
    .eq("id", templateId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { admin, response } = await requireAdmin(request);
  if (!admin) return response;

  const { templateId } = await context.params;
  const { error } = await admin
    .from("workout_templates")
    .update({ is_active: false })
    .eq("id", templateId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
