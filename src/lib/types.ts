export type UserRole = "admin" | "personal" | "aluno";

export type PaymentStatus = "pending" | "overdue" | "waiting_analysis" | "approved" | "rejected" | "paid" | "pending_review";

export type AccessStatus = "active" | "blocked";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  approved?: boolean;
  blocked?: boolean;
};

export type Student = Profile & {
  role: "aluno";
  personalId: string;
  paymentStatus: PaymentStatus;
  accessStatus: AccessStatus;
  goal: string;
  nextWorkout: string;
  adherence: number;
};

export type Trainer = Profile & {
  role: "personal";
  approved: boolean;
  blocked: boolean;
  businessName?: string;
  document?: string;
  instagram?: string;
  bio?: string;
  hourlyRate?: number;
  specialty: string;
  studentsCount: number;
  monthlyRevenue: number;
  inviteCode?: string;
  pixKey?: string;
  platformSubscriptionStatus?: "trial" | "active" | "past_due" | "canceled";
  platformPaidUntil?: string;
};

export type Workout = {
  id: string;
  studentId: string;
  personalId: string;
  title: string;
  type?: "strength" | "running" | "hybrid" | "functional" | "mobility" | "recovery";
  day: string;
  scheduledDate?: string;
  duration: string;
  status: "available" | "locked" | "done" | "pending";
  exercises: string[];
  sets?: WorkoutSet[];
  running?: RunningWorkout;
};

export type Exercise = {
  id: string;
  personalId: string;
  name: string;
  muscleGroup: string;
  mediaPath?: string;
  source: "library" | "custom";
};

export type Payment = {
  id: string;
  studentId: string;
  personalId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  proofUrl?: string;
  receiptId?: string;
  receiptStatus?: PaymentStatus;
};

export type WorkoutSet = {
  exerciseId: string;
  exerciseName?: string;
  muscleGroup?: string;
  mediaPath?: string;
  sets: number;
  reps: string;
  load: string;
  restTime: string;
  notes?: string;
};

export type RunningWorkout = {
  workoutId: string;
  runningType: string;
  distanceKm: number;
  targetTime: string;
  targetPace: string;
  targetHeartRate: string;
  notes: string;
};

export type WorkoutTemplateExercise = {
  id: string;
  templateDayId: string;
  exerciseOrder: number;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  technique?: string;
  notes?: string;
};

export type WorkoutTemplateDay = {
  id: string;
  templateId: string;
  dayOrder: number;
  dayName: string;
  focus: string;
  notes?: string;
  exercises: WorkoutTemplateExercise[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  goal: string;
  level: string;
  category: string;
  daysPerWeek: number;
  estimatedDurationMinutes: number;
  location: string;
  equipment: string[];
  description: string;
  isActive: boolean;
  isFavorite?: boolean;
  days: WorkoutTemplateDay[];
  createdAt: string;
};

export type Assessment = {
  id: string;
  studentId: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  waist: number;
  chest: number;
  hip: number;
  photos: string[];
  createdAt: string;
};

export type BodyAssessment = {
  id: string;
  studentId: string;
  trainerId: string;
  assessmentDate: string;
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
  protocolType: "jp3" | "jp7" | "navy";
  bodyFatPercentage: number;
  leanMass: number;
  fatMass: number;
  bmi: number;
  bmr: number;
  clientGoal?: string;
  notes?: string;
  measurements: Record<string, number>;
  photos: Record<"front" | "side" | "back", string>;
  createdAt: string;
};

export type Plan = {
  id: string;
  trainerId: string;
  name: string;
  price: number;
  billingCycle: string;
  customDays?: number | null;
};

export type Subscription = {
  id: string;
  studentId: string;
  trainerId: string;
  planId: string;
  status: "active" | "pending" | "overdue" | "canceled";
  accessStatus: "released" | "blocked";
  nextDueDate: string;
};

export type LeadStage = {
  id: string;
  trainerId: string;
  name: string;
  orderIndex: number;
};

export type Lead = {
  id: string;
  trainerId: string;
  name: string;
  phone: string;
  email: string;
  stageId: string;
  status: string;
  notes: string;
};
