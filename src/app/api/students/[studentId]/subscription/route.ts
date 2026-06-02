import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isPastDue } from "@/lib/billing-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Payload = {
  nextDueDate?: string;
  planId?: string;
  startDate?: string;
};

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const target = new Date(date);
  target.setDate(1);
  target.setMonth(target.getMonth() + months);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

function addDays(date: Date, days: number) {
  const target = new Date(date);
  target.setDate(target.getDate() + days);
  return target;
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function calculateNextDueDate(startDate: string, plan: { billing_cycle: string; custom_days?: number | null }) {
  const date = new Date(`${startDate}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "";

  switch (plan.billing_cycle) {
    case "weekly":
      return toISODate(addDays(date, 7));
    case "quarterly":
      return toISODate(addMonthsClamped(date, 3));
    case "semiannual":
      return toISODate(addMonthsClamped(date, 6));
    case "annual":
      return toISODate(addMonthsClamped(date, 12));
    case "custom":
      return toISODate(addDays(date, plan.custom_days ?? 30));
    case "monthly":
    default:
      return toISODate(addMonthsClamped(date, 1));
  }
}

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

export async function PUT(request: NextRequest, context: RouteContext<"/api/students/[studentId]/subscription">) {
  const { studentId } = await context.params;
  const payload = (await request.json()) as Payload;
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  if (!payload.planId || (!payload.startDate && !payload.nextDueDate)) {
    return NextResponse.json({ ok: false, error: "Selecione um plano e informe a data inicial." }, { status: 400 });
  }

  const user = await findCurrentUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sessao nao encontrada." }, { status: 401 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "trainer") {
    return NextResponse.json({ ok: false, error: "Apenas personal pode alterar plano de aluno." }, { status: 403 });
  }

  const { data: trainer } = await admin
    .from("trainers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!trainer) {
    return NextResponse.json({ ok: false, error: "Personal nao encontrado." }, { status: 404 });
  }

  const { data: student } = await admin
    .from("students")
    .select("id, trainer_id")
    .eq("id", studentId)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (!student) {
    return NextResponse.json({ ok: false, error: "Aluno nao encontrado para este personal." }, { status: 404 });
  }

  const { data: plan } = await admin
    .from("plans")
    .select("id, trainer_id, price, billing_cycle, custom_days")
    .eq("id", payload.planId)
    .eq("trainer_id", trainer.id)
    .maybeSingle();

  if (!plan) {
    return NextResponse.json({ ok: false, error: "Plano nao encontrado para este personal." }, { status: 404 });
  }

  const nextDueDate = payload.startDate ? calculateNextDueDate(payload.startDate, plan) : payload.nextDueDate ?? "";

  if (!nextDueDate) {
    return NextResponse.json({ ok: false, error: "Data inicial invalida." }, { status: 400 });
  }

  const { data: currentSubscription, error: currentError } = await admin
    .from("student_subscriptions")
    .select("id")
    .eq("student_id", student.id)
    .eq("trainer_id", trainer.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json({ ok: false, error: currentError.message }, { status: 500 });
  }

  const subscriptionStatus = isPastDue(nextDueDate) ? "overdue" : "active";
  const subscriptionAccessStatus = isPastDue(nextDueDate) ? "blocked" : "released";
  let subscriptionId = currentSubscription?.id ?? "";

  if (currentSubscription?.id) {
    const { data: updatedSubscription, error } = await admin
      .from("student_subscriptions")
      .update({
        access_status: subscriptionAccessStatus,
        next_due_date: nextDueDate,
        plan_id: plan.id,
        status: subscriptionStatus,
      })
      .eq("id", currentSubscription.id)
      .select("id")
      .single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    subscriptionId = updatedSubscription.id;
  } else {
    const { data: createdSubscription, error } = await admin.from("student_subscriptions").insert({
      access_status: subscriptionAccessStatus,
      next_due_date: nextDueDate,
      plan_id: plan.id,
      status: subscriptionStatus,
      student_id: student.id,
      trainer_id: trainer.id,
    }).select("id").single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    subscriptionId = createdSubscription.id;
  }

  await admin
    .from("students")
    .update({ access_status: subscriptionAccessStatus })
    .eq("id", student.id)
    .eq("trainer_id", trainer.id);

  const { data: existingPayment } = await admin
    .from("payments")
    .select("id, status")
    .eq("subscription_id", subscriptionId)
    .eq("due_date", nextDueDate)
    .maybeSingle();

  if (existingPayment?.id) {
    if (existingPayment.status !== "approved" && existingPayment.status !== "paid") {
      const { error } = await admin
        .from("payments")
        .update({
          amount: plan.price,
          status: subscriptionStatus === "overdue" ? "overdue" : "pending",
        })
        .eq("id", existingPayment.id);

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("payments").insert({
      amount: plan.price,
      due_date: nextDueDate,
      status: subscriptionStatus === "overdue" ? "overdue" : "pending",
      student_id: student.id,
      subscription_id: subscriptionId,
      trainer_id: trainer.id,
    });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, nextDueDate });
}
