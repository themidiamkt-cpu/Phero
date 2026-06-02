export const freeStudentLimit = 2;

export function normalizeInviteCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function trainerInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] ?? "P";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "T";
  return `${first}${second}`.toUpperCase().replace(/[^A-Z]/g, "") || "PT";
}

export function generateInviteCode(name: string) {
  return `${trainerInitials(name)}${Math.floor(1000 + Math.random() * 9000)}`;
}

export function canAddStudent(studentCount: number, platformStatus?: string | null) {
  return platformStatus === "active" || studentCount < freeStudentLimit;
}
