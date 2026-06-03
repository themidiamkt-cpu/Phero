import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type TemplatePayload = {
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

export async function POST(request: NextRequest) {
  const { admin, response } = await requireAdmin(request);
  if (!admin) return response;

  const payload = (await request.json().catch(() => ({}))) as TemplatePayload;
  const normalized = normalizePayload(payload);
  if ("error" in normalized) {
    return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  }

  const { data: template, error } = await admin
    .from("workout_templates")
    .insert(normalized.data)
    .select("id")
    .single();

  if (error || !template) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Nao foi possivel criar modelo." }, { status: 500 });
  }

  await admin.from("workout_template_days").insert({
    template_id: template.id,
    day_order: 1,
    day_name: "Dia A",
    focus: normalized.data.goal,
    notes: "Ajustar exercicios conforme objetivo do aluno.",
  });

  return NextResponse.json({ ok: true, id: template.id });
}
