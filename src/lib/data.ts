import { createAdminClient } from "@/lib/supabase/admin";
import { isPastDue } from "@/lib/billing-status";
import {
  assessments,
  crmLeads,
  crmStages,
  exercises,
  payments,
  students,
  workouts,
} from "@/lib/mock-data";
import type { BodyAssessment, Exercise, Payment, Plan, Student, Subscription, Trainer, Workout, WorkoutSet } from "@/lib/types";

type ProfileRow = { email?: string; full_name?: string; role?: string; status?: string; user_id?: string };
type ProfileJoin = ProfileRow | ProfileRow[] | null;
type AssessmentPhotoRow = { photo_type: "front" | "side" | "back"; photo_url: string };

function oneProfile(profile: ProfileJoin): ProfileRow | null | undefined {
  return Array.isArray(profile) ? profile[0] : profile;
}

function statusToPaymentStatus(status: string): Payment["status"] {
  if (status === "approved" || status === "paid") return "approved";
  if (status === "waiting_analysis" || status === "pending_review") return "waiting_analysis";
  if (status === "rejected") return "rejected";
  if (status === "overdue") return "overdue";
  return "pending";
}

function accessToDemo(status: string): Student["accessStatus"] {
  return status === "released" || status === "active" ? "active" : "blocked";
}

function billingCycleToLabel(cycle: string): string {
  const labels: Record<string, string> = {
    weekly: "Semanal",
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
    custom: "Personalizado",
  };

  return labels[cycle] ?? cycle;
}

function storagePathFromAssessmentPhoto(value: string) {
  if (!value.startsWith("/avaliacoes/")) return "";
  return value.replace(/^\/avaliacoes\//, "").replace(/^\/+/, "");
}

async function normalizeAssessmentPhotoUrl(photoUrl: string, supabase: NonNullable<ReturnType<typeof createAdminClient>>) {
  const value = photoUrl.trim();
  if (!value || ["front", "side", "back"].includes(value)) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const storagePath = storagePathFromAssessmentPhoto(value);
  if (!storagePath) return "";

  const slashIndex = storagePath.lastIndexOf("/");
  const directory = slashIndex >= 0 ? storagePath.slice(0, slashIndex) : "";
  const fileName = slashIndex >= 0 ? storagePath.slice(slashIndex + 1) : storagePath;
  const { data, error } = await supabase.storage.from("avaliacoes").list(directory);
  if (error || !data?.some((item) => item.name === fileName)) return "";

  return supabase.storage.from("avaliacoes").getPublicUrl(storagePath).data.publicUrl;
}

async function normalizeAssessmentPhotos(
  photos: AssessmentPhotoRow[] | null | undefined,
  supabase: NonNullable<ReturnType<typeof createAdminClient>>,
) {
  const entries = await Promise.all(
    (photos ?? []).map(async (photo) => [
      photo.photo_type,
      await normalizeAssessmentPhotoUrl(photo.photo_url, supabase),
    ] as const),
  );

  return {
    front: entries.find(([type]) => type === "front")?.[1] ?? "",
    side: entries.find(([type]) => type === "side")?.[1] ?? "",
    back: entries.find(([type]) => type === "back")?.[1] ?? "",
  };
}

export async function getStudentsData(): Promise<Student[]> {
  const supabase = createAdminClient();
  if (!supabase) return students;

  const { data, error } = await supabase
    .from("students")
    .select("id, trainer_id, full_name, phone, goal, status, access_status, profiles(user_id,full_name,status)")
    .order("created_at", { ascending: false });

  if (error) return [];
  if (!data?.length) return [];

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const emailByUserId = new Map(usersData.users.map((user) => [user.id, user.email ?? ""]));

  return (data as Array<{
    id: string;
    trainer_id: string;
    full_name: string;
    goal: string | null;
    status: string;
    access_status: string;
    profiles: ProfileJoin;
  }>).map((student) => {
    const profile = oneProfile(student.profiles);
    return ({
    id: student.id,
    name: student.full_name,
    email: profile?.user_id ? emailByUserId.get(profile.user_id) ?? "" : "",
    role: "aluno",
    personalId: student.trainer_id,
    paymentStatus: student.access_status === "released" ? "approved" : "overdue",
    accessStatus: accessToDemo(student.access_status),
    goal: student.goal ?? "Sem objetivo cadastrado",
    nextWorkout: "Proximo treino",
    adherence: student.status === "active" ? 80 : 35,
  });
  });
}

export async function getTrainersData(): Promise<Trainer[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let { data, error } = await supabase
    .from("trainers")
    .select("id, business_name, document, instagram, bio, hourly_rate, approved_at, blocked_at, invite_code, pix_key, platform_subscription_status, platform_paid_until, profiles(user_id,full_name,role,status)")
    .order("created_at", { ascending: false });

  if (error?.message.includes("hourly_rate")) {
    const fallback = await supabase
      .from("trainers")
      .select("id, business_name, document, instagram, bio, approved_at, blocked_at, invite_code, pix_key, platform_subscription_status, platform_paid_until, profiles(user_id,full_name,role,status)")
      .order("created_at", { ascending: false });
    data = fallback.data?.map((trainer) => ({ ...trainer, hourly_rate: null })) ?? null;
    error = fallback.error;
  }

  if (error) return [];
  if (!data?.length) return [];

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const emailByUserId = new Map(usersData.users.map((user) => [user.id, user.email ?? ""]));

  return (data as Array<{
    id: string;
    business_name: string | null;
    document: string | null;
    instagram: string | null;
    bio: string | null;
    hourly_rate: number | string | null;
    approved_at: string | null;
    blocked_at: string | null;
    invite_code: string | null;
    pix_key: string | null;
    platform_subscription_status: Trainer["platformSubscriptionStatus"] | null;
    platform_paid_until: string | null;
    profiles: ProfileJoin;
  }>)
    .filter((trainer) => oneProfile(trainer.profiles)?.role === "trainer")
    .map((trainer) => {
    const profile = oneProfile(trainer.profiles);
    return {
      id: trainer.id,
      name: profile?.full_name ?? trainer.business_name ?? "Personal",
      email: profile?.user_id ? emailByUserId.get(profile.user_id) ?? "" : "",
      role: "personal",
      approved: Boolean(trainer.approved_at),
      blocked: Boolean(trainer.blocked_at) || profile?.status === "blocked",
      specialty: trainer.bio ?? trainer.business_name ?? "Personal trainer",
      businessName: trainer.business_name ?? undefined,
      document: trainer.document ?? undefined,
      instagram: trainer.instagram ?? undefined,
      bio: trainer.bio ?? undefined,
      hourlyRate: trainer.hourly_rate === null ? undefined : Number(trainer.hourly_rate),
      studentsCount: 0,
      monthlyRevenue: 0,
      inviteCode: trainer.invite_code ?? undefined,
      pixKey: trainer.pix_key ?? undefined,
      platformSubscriptionStatus: trainer.platform_subscription_status ?? "trial",
      platformPaidUntil: trainer.platform_paid_until ?? undefined,
    };
  });
}

export async function getPaymentsData(): Promise<Payment[]> {
  const supabase = createAdminClient();
  if (!supabase) return payments;

  const { data, error } = await supabase
    .from("payments")
    .select("id, trainer_id, student_id, amount, due_date, status, payment_receipts(id,file_url,status,uploaded_at)")
    .order("due_date", { ascending: false });

  if (error) return [];
  if (!data?.length) return [];

  return (data as Array<{
    id: string;
    trainer_id: string;
    student_id: string;
    amount: number | string;
    due_date: string;
    status: string;
    payment_receipts?: Array<{ id?: string; file_url?: string; status?: string; uploaded_at?: string }> | null;
  }>).map((payment) => {
    const receipt = Array.isArray(payment.payment_receipts)
      ? [...payment.payment_receipts].sort((a, b) => String(b.uploaded_at ?? "").localeCompare(String(a.uploaded_at ?? "")))[0]
      : undefined;

    return {
    id: payment.id,
    studentId: payment.student_id,
    personalId: payment.trainer_id,
    amount: Number(payment.amount),
    dueDate: payment.due_date,
    status: statusToPaymentStatus(payment.status),
    proofUrl: receipt?.file_url,
    receiptId: receipt?.id,
    receiptStatus: receipt?.status ? statusToPaymentStatus(receipt.status) : undefined,
  };
  });
}

export async function getWorkoutsData(): Promise<Workout[]> {
  const supabase = createAdminClient();
  if (!supabase) return workouts;

  const { data, error } = await supabase
    .from("workouts")
    .select("id, trainer_id, student_id, title, workout_type, scheduled_date, status, running_workouts(running_type, distance_km, target_time, target_pace, target_heart_rate, notes), workout_exercises(id, exercise_id, sets, reps, load, rest_time, order_index, notes, exercises(name, muscle_group, video_url, image_url))")
    .order("scheduled_date", { ascending: true });

  if (error) return [];
  if (!data?.length) return [];

  return (data as Array<{
    id: string;
    trainer_id: string;
    student_id: string;
    title: string;
    workout_type: Workout["type"];
    scheduled_date: string | null;
    status: string;
    running_workouts?: Array<{
      distance_km: number | string | null;
      notes: string | null;
      running_type: string | null;
      target_heart_rate: string | null;
      target_pace: string | null;
      target_time: string | null;
    }> | {
      distance_km: number | string | null;
      notes: string | null;
      running_type: string | null;
      target_heart_rate: string | null;
      target_pace: string | null;
      target_time: string | null;
    } | null;
    workout_exercises?: Array<{
      exercise_id: string;
      sets: number | null;
      reps: string | null;
      load: string | null;
      rest_time: string | null;
      order_index: number | null;
      notes: string | null;
      exercises?: {
        name: string | null;
        muscle_group: string | null;
        video_url: string | null;
        image_url: string | null;
      } | Array<{
        name: string | null;
        muscle_group: string | null;
        video_url: string | null;
        image_url: string | null;
      }> | null;
    }> | null;
  }>).map((workout) => {
    const runningRow = Array.isArray(workout.running_workouts) ? workout.running_workouts[0] : workout.running_workouts;
    const sets = (workout.workout_exercises ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((item): WorkoutSet => {
        const exercise = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
        return {
          exerciseId: item.exercise_id,
          exerciseName: exercise?.name ?? "Exercicio",
          muscleGroup: exercise?.muscle_group ?? undefined,
          mediaPath: exercise?.video_url ?? exercise?.image_url ?? undefined,
          sets: item.sets ?? 1,
          reps: item.reps ?? "A definir",
          load: item.load ?? "A definir",
          restTime: item.rest_time ?? "60s",
          notes: item.notes ?? undefined,
        };
      });

    return {
      id: workout.id,
      studentId: workout.student_id,
      personalId: workout.trainer_id,
      title: workout.title,
      type: workout.workout_type,
      day: workout.scheduled_date ?? "Sem data",
      scheduledDate: workout.scheduled_date ?? undefined,
      duration: runningRow?.target_time ?? "45 min",
      status: workout.status === "completed" ? "done" : "pending",
      exercises: sets.map((set) => set.exerciseName ?? "Exercicio"),
      sets,
      running: runningRow
        ? {
            workoutId: workout.id,
            runningType: runningRow.running_type ?? "Corrida",
            distanceKm: Number(runningRow.distance_km ?? 0),
            targetTime: runningRow.target_time ?? "30 min",
            targetPace: runningRow.target_pace ?? "Livre",
            targetHeartRate: runningRow.target_heart_rate ?? "Zona livre",
            notes: runningRow.notes ?? "",
          }
        : undefined,
    };
  });
}

export async function getExercisesData(): Promise<Exercise[]> {
  const supabase = createAdminClient();
  if (!supabase) return exercises;

  const { data, error } = await supabase
    .from("exercises")
    .select("id, trainer_id, is_global, name, muscle_group, video_url, image_url")
    .order("created_at", { ascending: false });

  if (error) return [];
  if (!data?.length) return [];

  const databaseExercises: Exercise[] = (data as Array<{
    id: string;
    trainer_id: string | null;
    is_global: boolean;
    name: string;
    muscle_group: string | null;
    video_url: string | null;
    image_url: string | null;
  }>).map((exercise) => ({
    id: exercise.id,
    personalId: exercise.trainer_id ?? "global",
    name: exercise.name,
    muscleGroup: exercise.muscle_group ?? "Geral",
    mediaPath: exercise.video_url ?? exercise.image_url ?? undefined,
    source: exercise.is_global ? "library" : "custom",
  }));

  const exerciseNames = new Set(databaseExercises.map((exercise) => exercise.name.toLowerCase()));
  const runningLibrary = exercises.filter((exercise) => exercise.muscleGroup === "Corrida" && !exerciseNames.has(exercise.name.toLowerCase()));

  return [...databaseExercises, ...runningLibrary];
}

export async function getPlansData(): Promise<Plan[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let { data, error } = await supabase
    .from("plans")
    .select("id, trainer_id, name, price, billing_cycle, custom_days")
    .order("created_at", { ascending: true });

  if (error?.message.includes("custom_days")) {
    const fallback = await supabase
      .from("plans")
      .select("id, trainer_id, name, price, billing_cycle")
      .order("created_at", { ascending: true });
    data = fallback.data?.map((plan) => ({ ...plan, custom_days: null })) ?? null;
    error = fallback.error;
  }

  if (error) return [];
  if (!data?.length) return [];

  return (data as Array<{
    id: string;
    trainer_id: string;
    name: string;
    price: number | string;
    billing_cycle: string;
    custom_days: number | null;
  }>).map((plan) => ({
    id: plan.id,
    trainerId: plan.trainer_id,
    name: plan.name,
    price: Number(plan.price),
    billingCycle: billingCycleToLabel(plan.billing_cycle),
    customDays: plan.custom_days,
  }));
}

export async function getStudentFinanceData(studentId: string): Promise<{
  payments: Payment[];
  plan: Plan | null;
  subscription: Subscription | null;
}> {
  const supabase = createAdminClient();
  if (!supabase) return { payments: [], plan: null, subscription: null };

  const [{ data: paymentRows }, { data: subscriptionRow }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, trainer_id, student_id, amount, due_date, status, payment_receipts(id,file_url,status,uploaded_at)")
      .eq("student_id", studentId)
      .order("due_date", { ascending: false }),
    supabase
      .from("student_subscriptions")
      .select("id, trainer_id, student_id, plan_id, status, access_status, next_due_date, plans(id, trainer_id, name, price, billing_cycle, custom_days)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let paymentsData = ((paymentRows ?? []) as Array<{
    id: string;
    trainer_id: string;
    student_id: string;
    amount: number | string;
    due_date: string;
    status: string;
    payment_receipts?: Array<{ id?: string; file_url?: string; status?: string; uploaded_at?: string }> | null;
  }>).map((payment) => {
    const receipt = Array.isArray(payment.payment_receipts)
      ? [...payment.payment_receipts].sort((a, b) => String(b.uploaded_at ?? "").localeCompare(String(a.uploaded_at ?? "")))[0]
      : undefined;

    return {
    id: payment.id,
    studentId: payment.student_id,
    personalId: payment.trainer_id,
    amount: Number(payment.amount),
    dueDate: payment.due_date,
    status: statusToPaymentStatus(payment.status),
    proofUrl: receipt?.file_url,
    receiptId: receipt?.id,
    receiptStatus: receipt?.status ? statusToPaymentStatus(receipt.status) : undefined,
  };
  });

  const subscriptionData = subscriptionRow as
    | {
        id: string;
        trainer_id: string;
        student_id: string;
        plan_id: string | null;
        status: Subscription["status"];
        access_status: Subscription["accessStatus"];
        next_due_date: string | null;
        plans:
          | { id: string; trainer_id: string; name: string; price: number | string; billing_cycle: string; custom_days?: number | null }
          | { id: string; trainer_id: string; name: string; price: number | string; billing_cycle: string; custom_days?: number | null }[]
          | null;
      }
    | null;

  const planRow = Array.isArray(subscriptionData?.plans) ? subscriptionData?.plans[0] : subscriptionData?.plans;
  const dueDatePayment = subscriptionData?.next_due_date
    ? paymentsData.find((payment) => payment.dueDate === subscriptionData.next_due_date)
    : undefined;
  const dueDatePaymentApproved = dueDatePayment?.status === "approved" || dueDatePayment?.status === "paid";
  const subscriptionIsPastDue = isPastDue(subscriptionData?.next_due_date) && !dueDatePaymentApproved;

  if (subscriptionData && dueDatePaymentApproved && subscriptionData.access_status !== "released") {
    await Promise.all([
      supabase
        .from("student_subscriptions")
        .update({ access_status: "released", status: "active" })
        .eq("id", subscriptionData.id),
      supabase
        .from("students")
        .update({ access_status: "released" })
        .eq("id", subscriptionData.student_id),
    ]);
    subscriptionData.access_status = "released";
    subscriptionData.status = "active";
  }

  if (subscriptionData && subscriptionIsPastDue && subscriptionData.access_status !== "blocked") {
    await Promise.all([
      supabase
        .from("student_subscriptions")
        .update({ access_status: "blocked", status: "overdue" })
        .eq("id", subscriptionData.id),
      supabase
        .from("students")
        .update({ access_status: "blocked" })
        .eq("id", subscriptionData.student_id),
      supabase
        .from("payments")
        .update({ status: "overdue" })
        .eq("subscription_id", subscriptionData.id)
        .eq("due_date", subscriptionData.next_due_date)
        .in("status", ["pending", "waiting_analysis"]),
    ]);
  }

  const hasPaymentForDueDate = Boolean(
    subscriptionData?.next_due_date &&
    paymentsData.some((payment) => payment.dueDate === subscriptionData.next_due_date),
  );

  if (subscriptionData?.next_due_date && planRow && !hasPaymentForDueDate) {
    const { data: createdPayment } = await supabase
      .from("payments")
      .insert({
        amount: planRow.price,
        due_date: subscriptionData.next_due_date,
        status: subscriptionIsPastDue ? "overdue" : "pending",
        student_id: subscriptionData.student_id,
        subscription_id: subscriptionData.id,
        trainer_id: subscriptionData.trainer_id,
      })
      .select("id, trainer_id, student_id, amount, due_date, status")
      .maybeSingle();

    if (createdPayment) {
      paymentsData = [
        {
          id: createdPayment.id,
          studentId: createdPayment.student_id,
          personalId: createdPayment.trainer_id,
          amount: Number(createdPayment.amount),
          dueDate: createdPayment.due_date,
          proofUrl: undefined,
          receiptId: undefined,
          receiptStatus: undefined,
          status: statusToPaymentStatus(createdPayment.status),
        },
        ...paymentsData,
      ];
    }
  }

  return {
    payments: paymentsData,
    plan: planRow
      ? {
          id: planRow.id,
          trainerId: planRow.trainer_id,
          name: planRow.name,
          price: Number(planRow.price),
          billingCycle: billingCycleToLabel(planRow.billing_cycle),
          customDays: planRow.custom_days ?? null,
        }
      : null,
    subscription: subscriptionData
      ? {
          id: subscriptionData.id,
          studentId: subscriptionData.student_id,
          trainerId: subscriptionData.trainer_id,
          planId: subscriptionData.plan_id ?? "",
          status: subscriptionIsPastDue ? "overdue" : subscriptionData.status,
          accessStatus: subscriptionIsPastDue ? "blocked" : subscriptionData.access_status,
          nextDueDate: subscriptionData.next_due_date ?? "",
        }
      : null,
  };
}

export async function getBodyAssessmentsData(studentId: string): Promise<BodyAssessment[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("body_assessments")
    .select("*, body_measurements(measurement_name, measurement_value), body_photos(photo_type, photo_url)")
    .eq("student_id", studentId)
    .order("assessment_date", { ascending: false });

  if (error || !data?.length) return [];

  const rows = data as Array<{
    id: string;
    student_id: string;
    trainer_id: string;
    assessment_date: string;
    weight: number | string;
    height: number | string;
    age: number;
    gender: BodyAssessment["gender"];
    protocol_type: BodyAssessment["protocolType"];
    body_fat_percentage: number | string;
    lean_mass: number | string;
    fat_mass: number | string;
    bmi: number | string;
    bmr: number | string;
    notes: string | null;
    created_at: string;
    body_measurements?: Array<{ measurement_name: string; measurement_value: number | string }> | null;
    body_photos?: AssessmentPhotoRow[] | null;
  }>;

  return Promise.all(rows.map(async (assessment) => ({
    id: assessment.id,
    studentId: assessment.student_id,
    trainerId: assessment.trainer_id,
    assessmentDate: assessment.assessment_date,
    weight: Number(assessment.weight),
    height: Number(assessment.height),
    age: assessment.age,
    gender: assessment.gender,
    protocolType: assessment.protocol_type,
    bodyFatPercentage: Number(assessment.body_fat_percentage),
    leanMass: Number(assessment.lean_mass),
    fatMass: Number(assessment.fat_mass),
    bmi: Number(assessment.bmi),
    bmr: Number(assessment.bmr),
    notes: assessment.notes ?? undefined,
    measurements: Object.fromEntries((assessment.body_measurements ?? []).map((item) => [item.measurement_name, Number(item.measurement_value)])),
    photos: await normalizeAssessmentPhotos(assessment.body_photos, supabase),
    createdAt: assessment.created_at,
  })));
}

export async function getMvpData() {
  const [studentsData, trainersData, paymentsData, workoutsData, exercisesData, plansData] = await Promise.all([
    getStudentsData(),
    getTrainersData(),
    getPaymentsData(),
    getWorkoutsData(),
    getExercisesData(),
    getPlansData(),
  ]);
  const studentsWithPaymentStatus = studentsData.map((student) => {
    const latestPayment = paymentsData.find((payment) => payment.studentId === student.id);

    if (!latestPayment) return student;

    return {
      ...student,
      paymentStatus: latestPayment.status,
      accessStatus: latestPayment.status === "approved" || latestPayment.status === "paid" ? student.accessStatus : "blocked",
    };
  });

  return {
    students: studentsWithPaymentStatus,
    trainers: trainersData,
    payments: paymentsData,
    workouts: workoutsData,
    exercises: exercisesData,
    assessments,
    plans: plansData,
    subscriptions: [],
    crmStages,
    crmLeads,
  };
}
