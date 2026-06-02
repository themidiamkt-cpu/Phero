import type {
  Assessment,
  BodyAssessment,
  Exercise,
  Lead,
  LeadStage,
  Payment,
  Plan,
  Profile,
  RunningWorkout,
  Student,
  Subscription,
  Trainer,
  Workout,
  WorkoutSet,
} from "@/lib/types";

export const profiles: Profile[] = [
  { id: "admin-1", name: "The Midia MKT", email: "themidiamkt@gmail.com", role: "admin" },
  {
    id: "personal-1",
    name: "Pedro Alves",
    email: "pedroalvesjr97@gmail.com",
    role: "personal",
    approved: true,
    blocked: false,
  },
  {
    id: "aluno-1",
    name: "Roberto Moura",
    email: "robertomoura.ads@gmail.com",
    role: "aluno",
  },
  {
    id: "aluno-4",
    name: "Hernany Ribeiro",
    email: "hernany.ribeiro@gmail.com",
    role: "aluno",
  },
];

export const trainers: Trainer[] = [
  {
    id: "personal-1",
    name: "Pedro Alves",
    email: "pedroalvesjr97@gmail.com",
    role: "personal",
    approved: true,
    blocked: false,
    specialty: "Hipertrofia e recomposicao",
    studentsCount: 24,
    monthlyRevenue: 18400,
  },
  {
    id: "personal-2",
    name: "Paula Nunes",
    email: "paula@formaprime.app",
    role: "personal",
    approved: false,
    blocked: false,
    specialty: "Performance feminina",
    studentsCount: 0,
    monthlyRevenue: 0,
  },
  {
    id: "personal-3",
    name: "Rafael Lima",
    email: "rafael@formaprime.app",
    role: "personal",
    approved: true,
    blocked: true,
    specialty: "Condicionamento",
    studentsCount: 11,
    monthlyRevenue: 7200,
  },
];

export const students: Student[] = [
  {
    id: "aluno-1",
    name: "Roberto Moura",
    email: "robertomoura.ads@gmail.com",
    role: "aluno",
    personalId: "personal-1",
    paymentStatus: "approved",
    accessStatus: "active",
    goal: "Ganhar massa magra",
    nextWorkout: "Inferiores A",
    adherence: 88,
  },
  {
    id: "aluno-4",
    name: "Hernany Ribeiro",
    email: "hernany.ribeiro@gmail.com",
    role: "aluno",
    personalId: "personal-1",
    paymentStatus: "approved",
    accessStatus: "active",
    goal: "Condicionamento e mobilidade",
    nextWorkout: "Treino pronto",
    adherence: 82,
  },
  {
    id: "aluno-2",
    name: "Mateus Rocha",
    email: "mateus@email.com",
    role: "aluno",
    personalId: "personal-1",
    paymentStatus: "overdue",
    accessStatus: "blocked",
    goal: "Voltar a correr",
    nextWorkout: "Mobilidade",
    adherence: 61,
  },
  {
    id: "aluno-3",
    name: "Camila Torres",
    email: "camila@email.com",
    role: "aluno",
    personalId: "personal-1",
    paymentStatus: "waiting_analysis",
    accessStatus: "blocked",
    goal: "Definicao",
    nextWorkout: "Superiores B",
    adherence: 74,
  },
];

export const workouts: Workout[] = [
  {
    id: "workout-1",
    studentId: "aluno-1",
    personalId: "personal-1",
    title: "Inferiores A",
    type: "strength",
    day: "Hoje",
    scheduledDate: "2026-05-31",
    duration: "54 min",
    status: "pending",
    exercises: ["Agachamento livre", "Leg press", "Mesa flexora", "Panturrilha"],
  },
  {
    id: "workout-2",
    studentId: "aluno-1",
    personalId: "personal-1",
    title: "Superiores B",
    type: "strength",
    day: "Quarta",
    scheduledDate: "2026-06-03",
    duration: "48 min",
    status: "done",
    exercises: ["Supino inclinado", "Remada baixa", "Desenvolvimento", "Triceps corda"],
  },
  {
    id: "workout-3",
    studentId: "aluno-2",
    personalId: "personal-1",
    title: "Mobilidade",
    type: "mobility",
    day: "Bloqueado",
    scheduledDate: "2026-05-31",
    duration: "32 min",
    status: "locked",
    exercises: ["Liberacao", "Quadril", "Core"],
  },
  {
    id: "workout-4",
    studentId: "aluno-1",
    personalId: "personal-1",
    title: "Corrida Z2",
    type: "running",
    day: "Sexta",
    scheduledDate: "2026-06-05",
    duration: "35 min",
    status: "pending",
    exercises: [],
  },
  {
    id: "workout-5",
    studentId: "aluno-1",
    personalId: "personal-1",
    title: "Hybrid Full Body",
    type: "hybrid",
    day: "Sabado",
    scheduledDate: "2026-06-06",
    duration: "62 min",
    status: "pending",
    exercises: ["Levantamento terra", "Bike intervalada", "Remada unilateral"],
  },
];

export const exercises: Exercise[] = [
  { id: "ex-1", personalId: "personal-1", name: "Agachamento livre", muscleGroup: "Pernas", source: "library", mediaPath: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
  { id: "ex-2", personalId: "personal-1", name: "Remada unilateral", muscleGroup: "Costas", source: "custom", mediaPath: "exercise-videos/remada.mp4" },
  { id: "ex-3", personalId: "personal-1", name: "Prancha com toque", muscleGroup: "Core", source: "custom", mediaPath: "exercise-videos/core.mp4" },
  { id: "ex-4", personalId: "personal-1", name: "Leg press", muscleGroup: "Pernas", source: "library" },
  { id: "ex-5", personalId: "personal-1", name: "Supino inclinado", muscleGroup: "Peito", source: "library" },
  { id: "ex-6", personalId: "global", name: "Crucifixo", muscleGroup: "Peito", source: "library" },
  { id: "ex-run-1", personalId: "global", name: "Corrida zona 2 continua", muscleGroup: "Corrida", source: "library" },
  { id: "ex-run-2", personalId: "global", name: "Tiros intervalados", muscleGroup: "Corrida", source: "library" },
  { id: "ex-run-3", personalId: "global", name: "Educativos de corrida", muscleGroup: "Corrida", source: "library" },
  { id: "ex-run-4", personalId: "global", name: "Longao progressivo", muscleGroup: "Corrida", source: "library" },
  { id: "ex-run-5", personalId: "global", name: "Caminhada corrida baixo impacto", muscleGroup: "Corrida", source: "library" },
];

export const payments: Payment[] = [
  { id: "pay-1", studentId: "aluno-1", personalId: "personal-1", amount: 420, dueDate: "2026-06-05", status: "approved" },
  { id: "pay-4", studentId: "aluno-1", personalId: "personal-1", amount: 420, dueDate: "2026-06-15", status: "pending" },
  { id: "pay-2", studentId: "aluno-2", personalId: "personal-1", amount: 380, dueDate: "2026-05-20", status: "overdue" },
  { id: "pay-3", studentId: "aluno-3", personalId: "personal-1", amount: 450, dueDate: "2026-05-28", status: "waiting_analysis", proofUrl: "payment-receipts/personal-1/aluno-3/camila-maio.pdf" },
];

export const workoutSets: Record<string, WorkoutSet[]> = {
  "workout-1": [
    { exerciseId: "ex-1", sets: 4, reps: "8-10", load: "60kg", restTime: "90s", notes: "Controle a descida." },
    { exerciseId: "ex-4", sets: 4, reps: "10", load: "120kg", restTime: "75s" },
    { exerciseId: "ex-3", sets: 3, reps: "40s", load: "Peso corporal", restTime: "45s" },
  ],
  "workout-5": [
    { exerciseId: "ex-1", sets: 3, reps: "8", load: "55kg", restTime: "60s" },
    { exerciseId: "ex-2", sets: 3, reps: "12 cada lado", load: "18kg", restTime: "60s" },
  ],
};

export const runningWorkouts: RunningWorkout[] = [
  {
    workoutId: "workout-4",
    runningType: "Zona 2 continua",
    distanceKm: 5,
    targetTime: "35 min",
    targetPace: "7:00/km",
    targetHeartRate: "135-150 bpm",
    notes: "Manter respiracao confortavel e cadencia constante.",
  },
];

export const assessments: Assessment[] = [
  {
    id: "assess-1",
    studentId: "aluno-1",
    weight: 64.2,
    bodyFatPercentage: 22.4,
    muscleMass: 43.1,
    waist: 72,
    chest: 88,
    hip: 99,
    photos: ["Frente", "Lado", "Costas"],
    createdAt: "2026-05-28",
  },
];

export const bodyAssessments: BodyAssessment[] = [
  {
    id: "body-2",
    studentId: "aluno-1",
    trainerId: "personal-1",
    assessmentDate: "2026-04-28",
    weight: 85,
    height: 178,
    age: 32,
    gender: "female",
    protocolType: "jp3",
    bodyFatPercentage: 22,
    leanMass: 66.3,
    fatMass: 18.7,
    bmi: 26.8,
    bmr: 1624,
    notes: "Primeira avaliacao presencial com dobras.",
    measurements: {
      triceps: 18,
      suprailiac: 20,
      thigh: 26,
      waist: 95,
      abdomen: 97,
      rightArm: 32,
      leftArm: 31,
      rightThigh: 58,
      leftThigh: 57,
    },
    photos: {
      front: "/avaliacoes/aluno-1/2026-04-28/frente.jpg",
      side: "/avaliacoes/aluno-1/2026-04-28/lateral.jpg",
      back: "/avaliacoes/aluno-1/2026-04-28/posterior.jpg",
    },
    createdAt: "2026-04-28",
  },
  {
    id: "body-1",
    studentId: "aluno-1",
    trainerId: "personal-1",
    assessmentDate: "2026-05-28",
    weight: 82,
    height: 178,
    age: 32,
    gender: "female",
    protocolType: "jp3",
    bodyFatPercentage: 18,
    leanMass: 67.2,
    fatMass: 14.8,
    bmi: 25.9,
    bmr: 1610,
    notes: "Boa evolucao de cintura e melhora visual em posterior.",
    measurements: {
      triceps: 15,
      suprailiac: 16,
      thigh: 22,
      waist: 88,
      abdomen: 90,
      rightArm: 33,
      leftArm: 32,
      rightThigh: 59,
      leftThigh: 58,
    },
    photos: {
      front: "/avaliacoes/aluno-1/2026-05-28/frente.jpg",
      side: "/avaliacoes/aluno-1/2026-05-28/lateral.jpg",
      back: "/avaliacoes/aluno-1/2026-05-28/posterior.jpg",
    },
    createdAt: "2026-05-28",
  },
];

export function getBodyAssessmentsByStudent(studentId: string) {
  return bodyAssessments
    .filter((assessment) => assessment.studentId === studentId)
    .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
}

export function getBodyAssessmentById(id: string) {
  return bodyAssessments.find((assessment) => assessment.id === id);
}

export const plans: Plan[] = [
  { id: "plan-1", trainerId: "personal-1", name: "Consultoria Premium", price: 420, billingCycle: "Mensal" },
  { id: "plan-2", trainerId: "personal-1", name: "Corrida + Forca", price: 380, billingCycle: "Mensal" },
];

export const subscriptions: Subscription[] = [
  { id: "sub-1", studentId: "aluno-1", trainerId: "personal-1", planId: "plan-1", status: "active", accessStatus: "released", nextDueDate: "2026-06-05" },
  { id: "sub-2", studentId: "aluno-2", trainerId: "personal-1", planId: "plan-2", status: "overdue", accessStatus: "blocked", nextDueDate: "2026-05-20" },
  { id: "sub-3", studentId: "aluno-3", trainerId: "personal-1", planId: "plan-1", status: "pending", accessStatus: "blocked", nextDueDate: "2026-05-28" },
];

export const crmStages: LeadStage[] = [
  { id: "stage-1", trainerId: "personal-1", name: "Novo lead", orderIndex: 1 },
  { id: "stage-2", trainerId: "personal-1", name: "Em conversa", orderIndex: 2 },
  { id: "stage-3", trainerId: "personal-1", name: "Aluno ativo", orderIndex: 3 },
  { id: "stage-4", trainerId: "personal-1", name: "Renovacao", orderIndex: 4 },
  { id: "stage-5", trainerId: "personal-1", name: "Inativo", orderIndex: 5 },
];

export const crmLeads: Lead[] = [
  { id: "lead-1", trainerId: "personal-1", name: "Joao Pereira", phone: "(11) 99999-0101", email: "joao@email.com", stageId: "stage-1", status: "novo", notes: "Quer perder peso." },
  { id: "lead-2", trainerId: "personal-1", name: "Renata Alves", phone: "(21) 98888-0202", email: "renata@email.com", stageId: "stage-2", status: "quente", notes: "Pediu proposta trimestral." },
  { id: "lead-3", trainerId: "personal-1", name: "Hernany Ribeiro", phone: "(31) 97777-0303", email: "hernany.ribeiro@gmail.com", stageId: "stage-3", status: "ativo", notes: "Plano premium." },
];

export const weeklyFrequency = [
  { day: "Seg", done: true },
  { day: "Ter", done: true },
  { day: "Qua", done: false },
  { day: "Qui", done: true },
  { day: "Sex", done: false },
  { day: "Sab", done: false },
  { day: "Dom", done: false },
];

export function getStudentPlan(studentId: string) {
  const subscription = subscriptions.find((item) => item.studentId === studentId);
  const plan = plans.find((item) => item.id === subscription?.planId);
  return { subscription, plan };
}

export function getWorkoutById(id: string) {
  return workouts.find((workout) => workout.id === id);
}

export function getExerciseById(id: string) {
  return exercises.find((exercise) => exercise.id === id);
}

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
