import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProfilePayload = {
  bio?: string;
  birthDate?: string;
  businessName?: string;
  document?: string;
  fullName?: string;
  goal?: string;
  hourlyRate?: string | number;
  instagram?: string;
  phone?: string;
  pixKey?: string;
  plans?: Array<{
    billingCycle?: string;
    customDays?: string | number | null;
    name?: string;
    price?: string | number;
  }>;
};

function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBillingCycle(value: string | undefined): string {
  const cycle = (value ?? "").trim().toLowerCase();
  const cycles: Record<string, string> = {
    anual: "annual",
    annual: "annual",
    custom: "custom",
    mensal: "monthly",
    monthly: "monthly",
    personalizado: "custom",
    quarterly: "quarterly",
    semanal: "weekly",
    semestral: "semiannual",
    semiannual: "semiannual",
    trimestral: "quarterly",
    weekly: "weekly",
  };

  return cycles[cycle] ?? "monthly";
}

function isSchemaCacheMissingColumn(message?: string | null): boolean {
  return Boolean(message?.includes("schema cache") || message?.includes("Could not find") || message?.includes("column"));
}

async function findUserFromRequest(request: NextRequest): Promise<User | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) return data.user;

  const admin = createAdminClient();
  const fallbackEmail = (request.cookies.get("app-user-email")?.value ?? request.cookies.get("demo-user-email")?.value)?.trim().toLowerCase();

  if (!admin || !fallbackEmail) return null;

  const { data: usersData } = await admin.auth.admin.listUsers();
  return usersData.users.find((user) => user.email?.toLowerCase() === fallbackEmail) ?? null;
}

export async function PATCH(request: NextRequest) {
  const payload = (await request.json()) as ProfilePayload;
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({ ok: false, error: "Supabase admin nao configurado." }, { status: 500 });
  }

  const user = await findUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Sessao nao encontrada. Entre novamente." }, { status: 401 });
  }

  const fullName = payload.fullName?.trim();
  const phone = payload.phone?.trim() || null;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      ...(fullName ? { full_name: fullName } : {}),
      phone,
      status: "active",
    })
    .eq("user_id", user.id)
    .select("id, role")
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ ok: false, error: profileError?.message ?? "Perfil nao encontrado no banco." }, { status: 500 });
  }

  if (fullName) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        full_name: fullName,
        role: profile.role,
      },
    });
  }

  if (profile.role === "student") {
    const { error } = await admin
      .from("students")
      .update({
        ...(fullName ? { full_name: fullName } : {}),
        phone,
        birth_date: payload.birthDate || null,
        goal: payload.goal?.trim() || null,
      })
      .eq("profile_id", profile.id);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (profile.role === "trainer") {
    const { data: trainer, error } = await admin
      .from("trainers")
      .update({
        business_name: payload.businessName?.trim() || null,
        document: payload.document?.trim() || null,
        instagram: payload.instagram?.trim() || null,
        bio: payload.bio?.trim() || null,
        pix_key: payload.pixKey?.trim() || null,
      })
      .eq("profile_id", profile.id)
      .select("id")
      .single();

    if (error || !trainer) return NextResponse.json({ ok: false, error: error?.message ?? "Personal nao encontrado." }, { status: 500 });

    const hourlyRate = toNullableNumber(payload.hourlyRate);
    if (hourlyRate !== null || payload.hourlyRate === "") {
      const { error: hourlyRateError } = await admin.from("trainers").update({ hourly_rate: hourlyRate }).eq("id", trainer.id);
      if (hourlyRateError && !isSchemaCacheMissingColumn(hourlyRateError.message)) {
        return NextResponse.json({ ok: false, error: hourlyRateError.message }, { status: 500 });
      }
    }

    if (Array.isArray(payload.plans)) {
      const cleanPlans = payload.plans
        .map((plan) => {
          const billingCycle = toBillingCycle(plan.billingCycle);
          const price = toNullableNumber(plan.price);
          const customDaysValue = toNullableNumber(plan.customDays);
          const customDays = billingCycle === "custom" && customDaysValue ? Math.floor(customDaysValue) : null;

          return {
            billing_cycle: billingCycle,
            custom_days: customDays && customDays > 0 ? customDays : null,
            name: plan.name?.trim() ?? "",
            price,
            trainer_id: trainer.id,
          };
        })
        .filter((plan) => plan.name && plan.price !== null && plan.price > 0);

      if (cleanPlans.length) {
        const { data: insertedPlans, error: insertPlansError } = await admin.from("plans").insert(cleanPlans).select("id");
        if (insertPlansError) {
          if (isSchemaCacheMissingColumn(insertPlansError.message)) {
            const fallbackPlans = cleanPlans.map((plan) => ({
              billing_cycle: plan.billing_cycle,
              name: plan.name,
              price: plan.price,
              trainer_id: plan.trainer_id,
            }));
            const { data: fallbackInsertedPlans, error: fallbackInsertError } = await admin.from("plans").insert(fallbackPlans).select("id");

            if (!fallbackInsertError) {
              const keepIds = (fallbackInsertedPlans ?? []).map((plan) => plan.id);
              const deleteQuery = admin.from("plans").delete().eq("trainer_id", trainer.id);
              const { error: deletePlansError } = keepIds.length ? await deleteQuery.not("id", "in", `(${keepIds.join(",")})`) : await deleteQuery;
              if (deletePlansError) return NextResponse.json({ ok: false, error: deletePlansError.message }, { status: 500 });

              return NextResponse.json({
                ok: true,
                warning: "Dados salvos. Rode a migration supabase/trainer_profile_plans.sql para salvar dias personalizados e valor por hora.",
              });
            }
          }

          return NextResponse.json({ ok: false, error: insertPlansError.message }, { status: 500 });
        }

        const keepIds = (insertedPlans ?? []).map((plan) => plan.id);
        const deleteQuery = admin.from("plans").delete().eq("trainer_id", trainer.id);
        const { error: deletePlansError } = keepIds.length ? await deleteQuery.not("id", "in", `(${keepIds.join(",")})`) : await deleteQuery;
        if (deletePlansError) return NextResponse.json({ ok: false, error: deletePlansError.message }, { status: 500 });
      } else {
        const { error: deletePlansError } = await admin.from("plans").delete().eq("trainer_id", trainer.id);
        if (deletePlansError) return NextResponse.json({ ok: false, error: deletePlansError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
