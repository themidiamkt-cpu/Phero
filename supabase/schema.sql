create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'trainer', 'student')),
  full_name text not null,
  avatar_url text,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text,
  document text,
  instagram text,
  bio text,
  hourly_rate numeric,
  approved_at timestamptz,
  blocked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete restrict,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  birth_date date,
  goal text,
  status text not null default 'active' check (status in ('active', 'blocked', 'inactive')),
  access_status text not null default 'blocked' check (access_status in ('released', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.trainers(id) on delete cascade,
  is_global boolean not null default false,
  name text not null,
  muscle_group text,
  category text,
  description text,
  video_url text,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  constraint exercises_global_owner_check check (
    (is_global = true and trainer_id is null)
    or
    (is_global = false and trainer_id is not null)
  )
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  workout_type text not null check (workout_type in ('strength', 'running', 'hybrid', 'functional', 'mobility', 'recovery')),
  description text,
  scheduled_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  sets int,
  reps text,
  load text,
  rest_time text,
  order_index int not null default 0,
  notes text
);

create table if not exists public.running_workouts (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null unique references public.workouts(id) on delete cascade,
  running_type text,
  distance_km numeric,
  target_time text,
  target_pace text,
  target_heart_rate text,
  notes text
);

create table if not exists public.workout_results (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text,
  feedback text,
  effort_level int check (effort_level between 1 and 10),
  completed_at timestamptz
);

create table if not exists public.running_results (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  distance_completed numeric,
  duration text,
  average_pace text,
  average_heart_rate text,
  effort_level int check (effort_level between 1 and 10),
  notes text,
  completed_at timestamptz
);

create table if not exists public.physical_assessments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  weight numeric,
  body_fat_percentage numeric,
  muscle_mass numeric,
  waist numeric,
  chest numeric,
  hip numeric,
  photos jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.body_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  assessment_date date not null,
  weight numeric not null,
  height numeric not null,
  age int not null,
  gender text not null check (gender in ('male', 'female')),
  protocol_type text not null check (protocol_type in ('jp3', 'jp7', 'navy')),
  body_fat_percentage numeric,
  lean_mass numeric,
  fat_mass numeric,
  bmi numeric,
  bmr numeric,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.body_assessments(id) on delete cascade,
  measurement_name text not null,
  measurement_value numeric not null
);

create table if not exists public.body_photos (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.body_assessments(id) on delete cascade,
  photo_type text not null check (photo_type in ('front', 'side', 'back')),
  photo_url text not null
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  price numeric not null,
  billing_cycle text not null check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom')),
  custom_days int check (custom_days is null or custom_days > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.student_subscriptions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  status text not null default 'pending' check (status in ('active', 'pending', 'overdue', 'canceled')),
  access_status text not null default 'blocked' check (access_status in ('released', 'blocked')),
  next_due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subscription_id uuid not null references public.student_subscriptions(id) on delete cascade,
  amount numeric not null,
  due_date date not null,
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'overdue', 'waiting_analysis', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  file_url text not null,
  file_type text,
  status text not null default 'waiting_analysis' check (status in ('waiting_analysis', 'approved', 'rejected')),
  uploaded_at timestamptz not null default now()
);

create table if not exists public.payment_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  receipt_id uuid references public.payment_receipts(id) on delete set null,
  webhook_payload jsonb,
  ai_result jsonb,
  confidence_score numeric,
  status text,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  receipt_id uuid references public.payment_receipts(id) on delete set null,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('pending', 'delivered', 'failed')),
  attempts int not null default 0,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('admin', 'trainer', 'student', 'automation', 'system')),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event text not null,
  payment_id uuid references public.payments(id) on delete set null,
  receipt_id uuid references public.payment_receipts(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  trainer_id uuid references public.trainers(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.access_locks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  reason text,
  locked_at timestamptz not null default now(),
  unlocked_at timestamptz,
  status text not null default 'active' check (status in ('active', 'released'))
);

create table if not exists public.crm_stages (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  stage_id uuid references public.crm_stages(id) on delete set null,
  notes text,
  status text,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references auth.users(id) on delete set null,
  sender_email text not null,
  sender_role text check (sender_role in ('admin', 'trainer', 'student')),
  recipient_email text not null,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint chat_messages_body_not_blank check (length(trim(body)) > 0),
  constraint chat_messages_sender_email_lower check (sender_email = lower(sender_email)),
  constraint chat_messages_recipient_email_lower check (recipient_email = lower(recipient_email))
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);
create index if not exists trainers_profile_id_idx on public.trainers(profile_id);
create index if not exists students_trainer_id_idx on public.students(trainer_id);
create index if not exists students_profile_id_idx on public.students(profile_id);
create index if not exists exercises_trainer_id_idx on public.exercises(trainer_id);
create index if not exists workouts_trainer_student_idx on public.workouts(trainer_id, student_id);
create index if not exists workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
create index if not exists running_workouts_workout_id_idx on public.running_workouts(workout_id);
create index if not exists workout_results_student_id_idx on public.workout_results(student_id);
create index if not exists running_results_student_id_idx on public.running_results(student_id);
create index if not exists physical_assessments_student_id_idx on public.physical_assessments(student_id);
create index if not exists body_assessments_student_date_idx on public.body_assessments(student_id, assessment_date desc);
create index if not exists body_assessments_trainer_id_idx on public.body_assessments(trainer_id);
create index if not exists body_measurements_assessment_id_idx on public.body_measurements(assessment_id);
create index if not exists body_photos_assessment_id_idx on public.body_photos(assessment_id);
create index if not exists plans_trainer_id_idx on public.plans(trainer_id);
create index if not exists student_subscriptions_student_id_idx on public.student_subscriptions(student_id);
create index if not exists payments_trainer_student_idx on public.payments(trainer_id, student_id);
create index if not exists payment_receipts_payment_id_idx on public.payment_receipts(payment_id);
create index if not exists payment_analysis_logs_payment_id_idx on public.payment_analysis_logs(payment_id);
create index if not exists payment_webhook_deliveries_payment_id_idx on public.payment_webhook_deliveries(payment_id);
create index if not exists financial_audit_logs_payment_id_idx on public.financial_audit_logs(payment_id);
create index if not exists financial_audit_logs_student_id_idx on public.financial_audit_logs(student_id);
create index if not exists access_locks_student_id_idx on public.access_locks(student_id);
create index if not exists crm_stages_trainer_id_idx on public.crm_stages(trainer_id);
create index if not exists crm_leads_trainer_id_idx on public.crm_leads(trainer_id);
create index if not exists chat_messages_sender_email_idx on public.chat_messages(sender_email);
create index if not exists chat_messages_recipient_email_idx on public.chat_messages(recipient_email);
create index if not exists chat_messages_pair_created_idx on public.chat_messages(sender_email, recipient_email, created_at);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.current_trainer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id
  from public.trainers t
  join public.profiles p on p.id = t.profile_id
  where p.user_id = auth.uid()
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.students s
  join public.profiles p on p.id = s.profile_id
  where p.user_id = auth.uid()
$$;

create or replace function public.can_access_trainer(target_trainer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or target_trainer_id = public.current_trainer_id()
$$;

create or replace function public.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or target_student_id = public.current_student_id()
    or exists (
      select 1
      from public.students s
      where s.id = target_student_id
        and s.trainer_id = public.current_trainer_id()
    )
$$;

create or replace function public.payment_belongs_to_current_student(target_payment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.payments p
    where p.id = target_payment_id
      and p.student_id = public.current_student_id()
  )
$$;

alter table public.profiles enable row level security;
alter table public.trainers enable row level security;
alter table public.students enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.running_workouts enable row level security;
alter table public.workout_results enable row level security;
alter table public.running_results enable row level security;
alter table public.physical_assessments enable row level security;
alter table public.body_assessments enable row level security;
alter table public.body_measurements enable row level security;
alter table public.body_photos enable row level security;
alter table public.plans enable row level security;
alter table public.student_subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.payment_analysis_logs enable row level security;
alter table public.payment_webhook_deliveries enable row level security;
alter table public.financial_audit_logs enable row level security;
alter table public.access_locks enable row level security;
alter table public.crm_stages enable row level security;
alter table public.crm_leads enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles_select_by_role"
on public.profiles for select
using (
  public.is_admin()
  or user_id = auth.uid()
  or id in (select profile_id from public.students where trainer_id = public.current_trainer_id())
);

create policy "profiles_insert_own"
on public.profiles for insert
with check (user_id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
on public.profiles for update
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy "chat_messages_select_participants_or_admin"
on public.chat_messages for select
using (
  public.is_admin()
  or lower(coalesce(auth.jwt() ->> 'email', '')) in (sender_email, recipient_email)
);

create policy "chat_messages_insert_sender"
on public.chat_messages for insert
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = sender_email
  or public.is_admin()
);

create policy "chat_messages_update_recipient_read"
on public.chat_messages for update
using (
  public.is_admin()
  or lower(coalesce(auth.jwt() ->> 'email', '')) = recipient_email
)
with check (
  public.is_admin()
  or lower(coalesce(auth.jwt() ->> 'email', '')) = recipient_email
);

create policy "trainers_select_by_role"
on public.trainers for select
using (
  public.is_admin()
  or id = public.current_trainer_id()
  or id in (select trainer_id from public.students where id = public.current_student_id())
);

create policy "trainers_insert_admin_or_own_profile"
on public.trainers for insert
with check (public.is_admin() or profile_id = public.current_profile_id());

create policy "trainers_update_admin_or_owner"
on public.trainers for update
using (public.is_admin() or id = public.current_trainer_id())
with check (public.is_admin() or id = public.current_trainer_id());

create policy "students_select_by_role"
on public.students for select
using (public.can_access_student(id));

create policy "students_insert_admin_or_trainer"
on public.students for insert
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "students_update_admin_or_trainer"
on public.students for update
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "exercises_select_by_role"
on public.exercises for select
using (
  public.is_admin()
  or (public.current_role() = 'trainer' and (is_global = true or trainer_id = public.current_trainer_id()))
  or exists (
    select 1
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.exercise_id = exercises.id
      and w.student_id = public.current_student_id()
  )
);

create policy "exercises_insert_admin_or_trainer_owner"
on public.exercises for insert
with check (
  public.is_admin()
  or (public.current_role() = 'trainer' and is_global = false and trainer_id = public.current_trainer_id())
);

create policy "exercises_update_admin_or_owner"
on public.exercises for update
using (public.is_admin() or (is_global = false and trainer_id = public.current_trainer_id()))
with check (public.is_admin() or (is_global = false and trainer_id = public.current_trainer_id()));

create policy "exercises_delete_admin_or_owner"
on public.exercises for delete
using (public.is_admin() or (is_global = false and trainer_id = public.current_trainer_id()));

create policy "workouts_select_by_role"
on public.workouts for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "workouts_insert_admin_or_trainer"
on public.workouts for insert
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "workouts_update_admin_or_trainer"
on public.workouts for update
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "workout_exercises_select_by_role"
on public.workout_exercises for select
using (
  public.is_admin()
  or exists (
    select 1 from public.workouts w
    where w.id = workout_exercises.workout_id
      and (w.trainer_id = public.current_trainer_id() or w.student_id = public.current_student_id())
  )
);

create policy "workout_exercises_manage_by_trainer"
on public.workout_exercises for all
using (
  public.is_admin()
  or exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.trainer_id = public.current_trainer_id())
)
with check (
  public.is_admin()
  or exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.trainer_id = public.current_trainer_id())
);

create policy "running_workouts_select_by_role"
on public.running_workouts for select
using (
  public.is_admin()
  or exists (
    select 1 from public.workouts w
    where w.id = running_workouts.workout_id
      and (w.trainer_id = public.current_trainer_id() or w.student_id = public.current_student_id())
  )
);

create policy "running_workouts_manage_by_trainer"
on public.running_workouts for all
using (
  public.is_admin()
  or exists (select 1 from public.workouts w where w.id = running_workouts.workout_id and w.trainer_id = public.current_trainer_id())
)
with check (
  public.is_admin()
  or exists (select 1 from public.workouts w where w.id = running_workouts.workout_id and w.trainer_id = public.current_trainer_id())
);

create policy "workout_results_select_by_role"
on public.workout_results for select
using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (select 1 from public.students s where s.id = workout_results.student_id and s.trainer_id = public.current_trainer_id())
);

create policy "workout_results_insert_student"
on public.workout_results for insert
with check (student_id = public.current_student_id() or public.is_admin());

create policy "workout_results_update_student_or_trainer"
on public.workout_results for update
using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (select 1 from public.students s where s.id = workout_results.student_id and s.trainer_id = public.current_trainer_id())
)
with check (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (select 1 from public.students s where s.id = workout_results.student_id and s.trainer_id = public.current_trainer_id())
);

create policy "running_results_select_by_role"
on public.running_results for select
using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (select 1 from public.students s where s.id = running_results.student_id and s.trainer_id = public.current_trainer_id())
);

create policy "running_results_insert_student"
on public.running_results for insert
with check (student_id = public.current_student_id() or public.is_admin());

create policy "running_results_update_student_or_trainer"
on public.running_results for update
using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (select 1 from public.students s where s.id = running_results.student_id and s.trainer_id = public.current_trainer_id())
)
with check (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (select 1 from public.students s where s.id = running_results.student_id and s.trainer_id = public.current_trainer_id())
);

create policy "physical_assessments_select_by_role"
on public.physical_assessments for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "physical_assessments_manage_trainer"
on public.physical_assessments for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "body_assessments_select_by_role"
on public.body_assessments for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "body_assessments_manage_trainer"
on public.body_assessments for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "body_measurements_select_by_role"
on public.body_measurements for select
using (
  public.is_admin()
  or exists (
    select 1 from public.body_assessments ba
    where ba.id = body_measurements.assessment_id
      and (ba.trainer_id = public.current_trainer_id() or ba.student_id = public.current_student_id())
  )
);

create policy "body_measurements_manage_trainer"
on public.body_measurements for all
using (
  public.is_admin()
  or exists (select 1 from public.body_assessments ba where ba.id = body_measurements.assessment_id and ba.trainer_id = public.current_trainer_id())
)
with check (
  public.is_admin()
  or exists (select 1 from public.body_assessments ba where ba.id = body_measurements.assessment_id and ba.trainer_id = public.current_trainer_id())
);

create policy "body_photos_select_by_role"
on public.body_photos for select
using (
  public.is_admin()
  or exists (
    select 1 from public.body_assessments ba
    where ba.id = body_photos.assessment_id
      and (ba.trainer_id = public.current_trainer_id() or ba.student_id = public.current_student_id())
  )
);

create policy "body_photos_manage_trainer"
on public.body_photos for all
using (
  public.is_admin()
  or exists (select 1 from public.body_assessments ba where ba.id = body_photos.assessment_id and ba.trainer_id = public.current_trainer_id())
)
with check (
  public.is_admin()
  or exists (select 1 from public.body_assessments ba where ba.id = body_photos.assessment_id and ba.trainer_id = public.current_trainer_id())
);

create policy "plans_select_by_role"
on public.plans for select
using (
  public.is_admin()
  or trainer_id = public.current_trainer_id()
  or trainer_id in (select trainer_id from public.students where id = public.current_student_id())
);

create policy "plans_manage_trainer"
on public.plans for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "student_subscriptions_select_by_role"
on public.student_subscriptions for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "student_subscriptions_manage_trainer"
on public.student_subscriptions for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "payments_select_by_role"
on public.payments for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "payments_manage_trainer"
on public.payments for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "payment_receipts_select_by_role"
on public.payment_receipts for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "payment_receipts_insert_student_owner"
on public.payment_receipts for insert
with check (
  student_id = public.current_student_id()
  and public.payment_belongs_to_current_student(payment_id)
  and exists (
    select 1
    from public.payments p
    where p.id = payment_receipts.payment_id
      and p.student_id = payment_receipts.student_id
      and p.trainer_id = payment_receipts.trainer_id
  )
);

create policy "payment_receipts_update_admin_or_trainer"
on public.payment_receipts for update
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "payment_analysis_logs_select_by_role"
on public.payment_analysis_logs for select
using (
  public.is_admin()
  or exists (
    select 1 from public.payments p
    where p.id = payment_analysis_logs.payment_id
      and (p.trainer_id = public.current_trainer_id() or p.student_id = public.current_student_id())
  )
);

create policy "payment_analysis_logs_insert_admin_or_trainer"
on public.payment_analysis_logs for insert
with check (
  public.is_admin()
  or exists (
    select 1 from public.payments p
    where p.id = payment_analysis_logs.payment_id
      and p.trainer_id = public.current_trainer_id()
  )
);

create policy "payment_webhook_deliveries_select_by_role"
on public.payment_webhook_deliveries for select
using (
  public.is_admin()
  or exists (
    select 1 from public.payments p
    where p.id = payment_webhook_deliveries.payment_id
      and (p.trainer_id = public.current_trainer_id() or p.student_id = public.current_student_id())
  )
);

create policy "payment_webhook_deliveries_insert_admin_or_trainer"
on public.payment_webhook_deliveries for insert
with check (
  public.is_admin()
  or exists (
    select 1 from public.payments p
    where p.id = payment_webhook_deliveries.payment_id
      and p.trainer_id = public.current_trainer_id()
  )
);

create policy "financial_audit_logs_select_by_role"
on public.financial_audit_logs for select
using (
  public.is_admin()
  or trainer_id = public.current_trainer_id()
  or student_id = public.current_student_id()
);

create policy "financial_audit_logs_insert_admin_or_trainer"
on public.financial_audit_logs for insert
with check (
  public.is_admin()
  or trainer_id = public.current_trainer_id()
  or actor_type in ('automation', 'system')
);

create policy "access_locks_select_by_role"
on public.access_locks for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

create policy "access_locks_manage_trainer"
on public.access_locks for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "crm_stages_select_trainer"
on public.crm_stages for select
using (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "crm_stages_manage_trainer"
on public.crm_stages for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "crm_leads_select_trainer"
on public.crm_leads for select
using (public.is_admin() or trainer_id = public.current_trainer_id());

create policy "crm_leads_manage_trainer"
on public.crm_leads for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('exercise-videos', 'exercise-videos', false, 104857600, array['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']),
  ('assessment-photos', 'assessment-photos', false, 20971520, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 20971520, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage_avatars_read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "storage_avatars_write_own"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "storage_exercise_videos_read"
on storage.objects for select
using (
  bucket_id = 'exercise-videos'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = public.current_trainer_id()::text
    or exists (
      select 1
      from public.students s
      where s.id = public.current_student_id()
        and s.trainer_id::text = (storage.foldername(name))[1]
    )
  )
);

create policy "storage_exercise_videos_write_trainer"
on storage.objects for insert
with check (
  bucket_id = 'exercise-videos'
  and (public.is_admin() or (storage.foldername(name))[1] = public.current_trainer_id()::text)
);

create policy "storage_assessment_photos_read"
on storage.objects for select
using (
  bucket_id = 'assessment-photos'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = public.current_trainer_id()::text
    or (storage.foldername(name))[2] = public.current_student_id()::text
  )
);

create policy "storage_assessment_photos_write_trainer"
on storage.objects for insert
with check (
  bucket_id = 'assessment-photos'
  and (public.is_admin() or (storage.foldername(name))[1] = public.current_trainer_id()::text)
);

create policy "storage_payment_receipts_read"
on storage.objects for select
using (
  bucket_id = 'payment-receipts'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = public.current_trainer_id()::text
    or (storage.foldername(name))[2] = public.current_student_id()::text
  )
);

create policy "storage_payment_receipts_upload_student_owner"
on storage.objects for insert
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[2] = public.current_student_id()::text
  and exists (
    select 1
    from public.students s
    where s.id = public.current_student_id()
      and s.trainer_id::text = (storage.foldername(name))[1]
  )
);

create or replace function public.apply_payment_analysis_result(
  target_payment_id uuid,
  target_receipt_id uuid,
  result_status text,
  result_confidence_score numeric default null,
  result_reason text default null,
  result_ai_result jsonb default '{}'::jsonb,
  result_webhook_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_record public.payments%rowtype;
begin
  if result_status not in ('approved', 'rejected') then
    raise exception 'Invalid payment analysis status: %', result_status;
  end if;

  select * into payment_record
  from public.payments
  where id = target_payment_id;

  if not found then
    raise exception 'Payment not found: %', target_payment_id;
  end if;

  if result_status = 'approved' then
    update public.payments
    set status = 'approved', paid_at = now()
    where id = target_payment_id;

    update public.payment_receipts
    set status = 'approved'
    where id = target_receipt_id;

    update public.student_subscriptions
    set status = 'active', access_status = 'released'
    where id = payment_record.subscription_id;

    update public.students
    set access_status = 'released'
    where id = payment_record.student_id;

    update public.access_locks
    set status = 'released', unlocked_at = now()
    where student_id = payment_record.student_id
      and status = 'active';
  else
    update public.payments
    set status = 'rejected'
    where id = target_payment_id;

    update public.payment_receipts
    set status = 'rejected'
    where id = target_receipt_id;

    update public.student_subscriptions
    set access_status = 'blocked'
    where id = payment_record.subscription_id;

    update public.students
    set access_status = 'blocked'
    where id = payment_record.student_id;
  end if;

  insert into public.payment_analysis_logs (
    payment_id,
    receipt_id,
    webhook_payload,
    ai_result,
    confidence_score,
    status,
    reason
  )
  values (
    target_payment_id,
    target_receipt_id,
    result_webhook_payload,
    result_ai_result,
    result_confidence_score,
    result_status,
    result_reason
  );
end;
$$;

create or replace function public.run_daily_payment_lock()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_count integer := 0;
  payment_record record;
begin
  for payment_record in
    select id, student_id, trainer_id, subscription_id
    from public.payments
    where due_date < current_date
      and status <> 'approved'
  loop
    update public.payments
    set status = 'overdue'
    where id = payment_record.id;

    update public.student_subscriptions
    set status = 'overdue', access_status = 'blocked'
    where id = payment_record.subscription_id;

    update public.students
    set access_status = 'blocked'
    where id = payment_record.student_id;

    insert into public.access_locks (student_id, trainer_id, reason, status)
    select payment_record.student_id, payment_record.trainer_id, 'Inadimplência', 'active'
    where not exists (
      select 1
      from public.access_locks al
      where al.student_id = payment_record.student_id
        and al.status = 'active'
        and al.reason = 'Inadimplência'
    );

    insert into public.payment_analysis_logs (payment_id, status, reason)
    values (payment_record.id, 'overdue', 'Bloqueio automatico diario por inadimplencia');

    locked_count := locked_count + 1;
  end loop;

  return locked_count;
end;
$$;
