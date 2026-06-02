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

create index if not exists body_assessments_student_date_idx on public.body_assessments(student_id, assessment_date desc);
create index if not exists body_assessments_trainer_id_idx on public.body_assessments(trainer_id);
create index if not exists body_measurements_assessment_id_idx on public.body_measurements(assessment_id);
create index if not exists body_photos_assessment_id_idx on public.body_photos(assessment_id);

alter table public.body_assessments enable row level security;
alter table public.body_measurements enable row level security;
alter table public.body_photos enable row level security;

drop policy if exists "body_assessments_select_by_role" on public.body_assessments;
create policy "body_assessments_select_by_role"
on public.body_assessments for select
using (public.is_admin() or trainer_id = public.current_trainer_id() or student_id = public.current_student_id());

drop policy if exists "body_assessments_manage_trainer" on public.body_assessments;
create policy "body_assessments_manage_trainer"
on public.body_assessments for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

drop policy if exists "body_measurements_select_by_role" on public.body_measurements;
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

drop policy if exists "body_measurements_manage_trainer" on public.body_measurements;
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

drop policy if exists "body_photos_select_by_role" on public.body_photos;
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

drop policy if exists "body_photos_manage_trainer" on public.body_photos;
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
