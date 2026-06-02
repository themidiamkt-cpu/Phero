import type { BodyAssessment } from "@/lib/types";

export type Gender = BodyAssessment["gender"];
export type ProtocolType = BodyAssessment["protocolType"];

export type AssessmentInput = {
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  protocolType: ProtocolType;
  measurements: Record<string, number>;
};

export type AssessmentResult = {
  bodyFatPercentage: number;
  leanMass: number;
  fatMass: number;
  bmi: number;
  bmr: number;
};

export const jp3Fields: Record<Gender, string[]> = {
  male: ["chestSkinfold", "abdomenSkinfold", "thighSkinfold"],
  female: ["tricepsSkinfold", "suprailiacSkinfold", "thighSkinfold"],
};

export const jp7Fields = [
  "chestSkinfold",
  "midaxillarySkinfold",
  "tricepsSkinfold",
  "subscapularSkinfold",
  "abdomenSkinfold",
  "suprailiacSkinfold",
  "thighSkinfold",
];

export const circumferenceFields = [
  "neck",
  "chest",
  "waist",
  "abdomen",
  "rightArm",
  "leftArm",
  "rightThigh",
  "leftThigh",
  "rightCalf",
  "leftCalf",
  "hip",
];

export const measurementLabels: Record<string, string> = {
  chestSkinfold: "Peitoral",
  abdomenSkinfold: "Abdomen",
  thighSkinfold: "Coxa",
  tricepsSkinfold: "Triceps",
  suprailiacSkinfold: "Supra-iliaca",
  midaxillarySkinfold: "Axilar media",
  subscapularSkinfold: "Subescapular",
  neck: "Pescoco",
  chest: "Peito",
  waist: "Cintura",
  abdomen: "Abdomen",
  rightArm: "Braco direito",
  leftArm: "Braco esquerdo",
  rightThigh: "Coxa direita",
  leftThigh: "Coxa esquerda",
  rightCalf: "Panturrilha direita",
  leftCalf: "Panturrilha esquerda",
  hip: "Quadril",
};

export const protocolLabels: Record<ProtocolType, string> = {
  jp3: "Jackson & Pollock 3 Dobras",
  jp7: "Jackson & Pollock 7 Dobras",
  navy: "Circunferencias US Navy",
};

export const bodyAssessmentStoragePrefix = "phero:body-assessments:";

export function getActiveMeasurementFields(protocolType: ProtocolType, gender: Gender) {
  if (protocolType === "jp3") return jp3Fields[gender];
  if (protocolType === "jp7") return jp7Fields;
  return circumferenceFields.filter((field) => gender === "female" || field !== "hip");
}

export function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function calculateBodyAssessment(input: AssessmentInput): AssessmentResult {
  const { age, gender, height, measurements, protocolType, weight } = input;
  const heightM = height / 100;
  const bmi = weight && height ? weight / (heightM * heightM) : 0;
  let bodyFatPercentage = 0;

  if (protocolType === "navy") {
    const waist = measurements.waist || 0;
    const abdomen = measurements.abdomen || waist;
    const neck = measurements.neck || 0;
    const hip = measurements.hip || 0;
    bodyFatPercentage = gender === "male"
      ? 86.01 * Math.log10(Math.max(1, abdomen - neck)) - 70.041 * Math.log10(height) + 36.76
      : 163.205 * Math.log10(Math.max(1, waist + hip - neck)) - 97.684 * Math.log10(height) - 78.387;
  } else {
    const fields = getActiveMeasurementFields(protocolType, gender);
    const skinfoldSum = fields.reduce((total, field) => total + (measurements[field] || 0), 0);
    const density = protocolType === "jp3"
      ? gender === "male"
        ? 1.10938 - 0.0008267 * skinfoldSum + 0.0000016 * skinfoldSum * skinfoldSum - 0.0002574 * age
        : 1.0994921 - 0.0009929 * skinfoldSum + 0.0000023 * skinfoldSum * skinfoldSum - 0.0001392 * age
      : gender === "male"
        ? 1.112 - 0.00043499 * skinfoldSum + 0.00000055 * skinfoldSum * skinfoldSum - 0.00028826 * age
        : 1.097 - 0.00046971 * skinfoldSum + 0.00000056 * skinfoldSum * skinfoldSum - 0.00012828 * age;

    bodyFatPercentage = 495 / density - 450;
  }

  bodyFatPercentage = Math.max(3, Math.min(60, bodyFatPercentage));
  const fatMass = weight * (bodyFatPercentage / 100);
  const leanMass = weight - fatMass;
  const bmr = gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  return {
    bodyFatPercentage: round(bodyFatPercentage),
    fatMass: round(fatMass),
    leanMass: round(leanMass),
    bmi: round(bmi),
    bmr: Math.round(bmr),
  };
}

export function getSavedAssessments(studentId: string) {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(`${bodyAssessmentStoragePrefix}${studentId}`);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as BodyAssessment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(`${bodyAssessmentStoragePrefix}${studentId}`);
    return [];
  }
}

export function saveAssessment(studentId: string, assessment: BodyAssessment) {
  const current = getSavedAssessments(studentId).filter((item) => item.id !== assessment.id);
  const next = [assessment, ...current].sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
  window.localStorage.setItem(`${bodyAssessmentStoragePrefix}${studentId}`, JSON.stringify(next));
  return next;
}

export function mergeAssessments(initial: BodyAssessment[], saved: BodyAssessment[]) {
  const byId = new Map<string, BodyAssessment>();
  [...saved, ...initial].forEach((assessment) => byId.set(assessment.id, assessment));
  return [...byId.values()].sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
}

export function formatAssessmentDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
}
