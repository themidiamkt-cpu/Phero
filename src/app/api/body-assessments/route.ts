import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";
import type { BodyAssessment } from "@/lib/types";

type PhotoUpload = {
  contentType?: string;
  dataUrl?: string;
  fileName?: string;
};

type CreateAssessmentPayload = BodyAssessment & {
  photoUploads?: Partial<Record<"front" | "side" | "back", PhotoUpload>>;
};

type AssessmentPhotoRow = { photo_type: "front" | "side" | "back"; photo_url: string };

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

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get("studentId");
  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  const supabase = createAdminClient();

  if (!studentId) {
    return NextResponse.json({ error: "studentId obrigatorio." }, { status: 400 });
  }

  if (!supabase || !isUuid(studentId)) {
    return NextResponse.json({ error: "Supabase indisponivel ou studentId invalido." }, { status: 400 });
  }

  let query = supabase
    .from("body_assessments")
    .select("*, body_measurements(measurement_name, measurement_value), body_photos(photo_type, photo_url)")
    .eq("student_id", studentId)
    .order("assessment_date", { ascending: false });

  if (assessmentId && isUuid(assessmentId)) query = query.eq("id", assessmentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assessments = await Promise.all((data ?? []).map(async (assessment) => ({
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
      measurements: Object.fromEntries((assessment.body_measurements ?? []).map((item: { measurement_name: string; measurement_value: number | string }) => [item.measurement_name, Number(item.measurement_value)])),
      photos: await normalizeAssessmentPhotos(assessment.body_photos, supabase),
      createdAt: assessment.created_at,
    })));

  return NextResponse.json({
    persisted: true,
    assessments,
  });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CreateAssessmentPayload;
  const supabase = createAdminClient();

  if (!payload.studentId || !payload.trainerId || !payload.assessmentDate) {
    return NextResponse.json({ error: "Dados obrigatorios ausentes." }, { status: 400 });
  }

  if (!supabase || !isUuid(payload.studentId) || !isUuid(payload.trainerId)) {
    return NextResponse.json({
      error: "Supabase indisponivel ou IDs invalidos para salvar avaliacao real.",
    }, { status: 400 });
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("body_assessments")
    .insert({
      student_id: payload.studentId,
      trainer_id: payload.trainerId,
      assessment_date: payload.assessmentDate,
      weight: payload.weight,
      height: payload.height,
      age: payload.age,
      gender: payload.gender,
      protocol_type: payload.protocolType,
      body_fat_percentage: payload.bodyFatPercentage,
      lean_mass: payload.leanMass,
      fat_mass: payload.fatMass,
      bmi: payload.bmi,
      bmr: payload.bmr,
      notes: payload.notes ?? null,
    })
    .select("id")
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json({ error: assessmentError?.message ?? "Nao foi possivel salvar a avaliacao." }, { status: 500 });
  }

  if (payload.clientGoal?.trim()) {
    await supabase
      .from("students")
      .update({ goal: payload.clientGoal.trim() })
      .eq("id", payload.studentId);
  }

  const measurements = Object.entries(payload.measurements).map(([measurementName, measurementValue]) => ({
    assessment_id: assessment.id,
    measurement_name: measurementName,
    measurement_value: measurementValue,
  }));

  if (measurements.length) {
    const { error } = await supabase.from("body_measurements").insert(measurements);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let uploadedPhotos: Partial<Record<"front" | "side" | "back", string>>;
  try {
    uploadedPhotos = await uploadAssessmentPhotos({
      assessmentDate: payload.assessmentDate,
      photos: payload.photoUploads ?? {},
      studentId: payload.studentId,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nao foi possivel enviar as fotos." }, { status: 500 });
  }
  const photos = Object.entries({ ...payload.photos, ...uploadedPhotos })
    .filter(([, photoUrl]) => Boolean(photoUrl))
    .map(([photoType, photoUrl]) => ({
      assessment_id: assessment.id,
      photo_type: photoType,
      photo_url: photoUrl,
    }));

  if (photos.length) {
    const { error } = await supabase.from("body_photos").insert(photos);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ persisted: true, id: assessment.id });
}

async function uploadAssessmentPhotos({
  assessmentDate,
  photos,
  studentId,
}: {
  assessmentDate: string;
  photos: Partial<Record<"front" | "side" | "back", PhotoUpload>>;
  studentId: string;
}) {
  const supabase = createAdminClient();
  const uploaded: Partial<Record<"front" | "side" | "back", string>> = {};
  if (!supabase) return uploaded;

  await supabase.storage.createBucket("avaliacoes", { public: true }).catch(() => undefined);

  for (const [photoType, photo] of Object.entries(photos) as Array<["front" | "side" | "back", PhotoUpload]>) {
    if (!photo.dataUrl) continue;

    const base64 = photo.dataUrl.includes(",") ? photo.dataUrl.split(",")[1] : photo.dataUrl;
    const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
    const fallbackName = photoType === "front" ? "frente.jpg" : photoType === "side" ? "lateral.jpg" : "posterior.jpg";
    const fileName = photo.fileName || fallbackName;
    const path = `${studentId}/${assessmentDate}/${fileName}`;

    const { error } = await supabase.storage.from("avaliacoes").upload(path, bytes, {
      contentType: photo.contentType || "image/jpeg",
      upsert: true,
    });

    if (error) throw new Error(`Nao foi possivel enviar a foto ${fallbackName}: ${error.message}`);

    const { data } = supabase.storage.from("avaliacoes").getPublicUrl(path);
    uploaded[photoType] = data.publicUrl;
  }

  return uploaded;
}
