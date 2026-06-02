import type { WorkoutTemplate } from "@/lib/types";

export const demoTrainerId = "personal-1";

const templateNames = [
  "Iniciante Academia 3x Semana",
  "Hipertrofia Feminina Glúteos e Pernas 4x",
  "Hipertrofia Masculina ABC",
  "Emagrecimento Feminino 4x",
  "Híbrido Musculação + Corrida 5km",
  "Treino em Casa Sem Equipamentos",
  "Treino 50+ Forca e Mobilidade",
  "Obesidade Baixo Impacto",
];

const templateMeta = [
  ["Condicionamento", "Iniciante", "Academia", 3, 50, "Academia", ["Maquinas", "Halteres"]],
  ["Hipertrofia", "Intermediario", "Pernas e gluteos", 4, 60, "Academia", ["Maquinas", "Barra", "Halteres"]],
  ["Hipertrofia", "Intermediario", "ABC", 3, 55, "Academia", ["Barra", "Halteres", "Cabos"]],
  ["Emagrecimento", "Iniciante", "Metabolico", 4, 45, "Academia", ["Maquinas", "Esteira"]],
  ["Performance", "Intermediario", "Hibrido", 5, 65, "Academia e rua", ["Halteres", "Esteira", "GPS"]],
  ["Saude", "Iniciante", "Casa", 3, 35, "Casa", ["Peso corporal"]],
  ["Longevidade", "Iniciante", "Forca e mobilidade", 3, 40, "Academia", ["Maquinas", "Elasticos"]],
  ["Emagrecimento", "Iniciante", "Baixo impacto", 4, 40, "Academia", ["Bike", "Maquinas"]],
] as const;

const dayPresets = [
  ["A", "Inferiores", ["Agachamento livre", "Leg press", "Mesa flexora"]],
  ["B", "Superiores", ["Supino inclinado", "Remada unilateral", "Desenvolvimento"]],
  ["C", "Core e condicionamento", ["Prancha com toque", "Bike intervalada", "Mobilidade de quadril"]],
  ["D", "Posterior e gluteos", ["Levantamento terra", "Cadeira abdutora", "Stiff com halteres"]],
  ["E", "Corrida", ["Corrida zona 2", "Educativos de corrida", "Alongamento posterior"]],
] as const;

export const initialWorkoutTemplates: WorkoutTemplate[] = templateNames.map((name, templateIndex) => {
  const [goal, level, category, daysPerWeek, estimatedDurationMinutes, location, equipment] = templateMeta[templateIndex];
  const days = Array.from({ length: daysPerWeek }, (_, dayIndex) => {
    const preset = dayPresets[dayIndex % dayPresets.length];
    const dayId = `template-${templateIndex + 1}-day-${dayIndex + 1}`;

    return {
      id: dayId,
      templateId: `template-${templateIndex + 1}`,
      dayOrder: dayIndex + 1,
      dayName: `Dia ${preset[0]}`,
      focus: preset[1],
      notes: dayIndex === 0 ? "Ajustar cargas por RPE 7 no primeiro contato." : "Manter tecnica limpa e registrar feedback.",
      exercises: preset[2].map((exerciseName, exerciseIndex) => ({
        id: `${dayId}-exercise-${exerciseIndex + 1}`,
        templateDayId: dayId,
        exerciseOrder: exerciseIndex + 1,
        exerciseName,
        muscleGroup: preset[1],
        sets: category === "Hibrido" && exerciseName.includes("Corrida") ? 1 : 3,
        reps: exerciseName.includes("Corrida") ? "5 km" : exerciseIndex === 0 ? "8-10" : "10-12",
        restSeconds: exerciseName.includes("Corrida") ? 0 : 60,
        technique: exerciseIndex === 0 ? "Progressao controlada" : undefined,
        notes: exerciseName.includes("Corrida") ? "Pace confortavel, zona 2." : "Ajustar amplitude conforme mobilidade.",
      })),
    };
  });

  return {
    id: `template-${templateIndex + 1}`,
    name,
    goal,
    level,
    category,
    daysPerWeek,
    estimatedDurationMinutes,
    location,
    equipment: [...equipment],
    description: `Modelo pronto para ${goal.toLowerCase()} com progressao simples e aplicacao rapida ao aluno.`,
    isActive: true,
    days,
    createdAt: "2026-06-01",
  };
});

export function getTemplateFilterOptions(templates: WorkoutTemplate[]) {
  return {
    goals: unique(templates.map((template) => template.goal)),
    levels: unique(templates.map((template) => template.level)),
    categories: unique(templates.map((template) => template.category)),
    days: unique(templates.map((template) => String(template.daysPerWeek))),
    locations: unique(templates.map((template) => template.location)),
    equipment: unique(templates.flatMap((template) => template.equipment)),
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
