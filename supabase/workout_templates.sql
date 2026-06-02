create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  goal text not null,
  level text not null,
  category text not null,
  days_per_week int not null,
  estimated_duration_minutes int not null,
  location text not null,
  equipment text[] not null default '{}'::text[],
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_template_days (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  day_order int not null,
  day_name text not null,
  focus text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (template_id, day_order)
);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.workout_template_days(id) on delete cascade,
  exercise_order int not null,
  exercise_name text not null,
  muscle_group text not null,
  sets int not null,
  reps text not null,
  rest_seconds int not null default 60,
  technique text,
  notes text,
  created_at timestamptz not null default now(),
  unique (template_day_id, exercise_order)
);

create table if not exists public.favorite_workout_templates (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trainer_id, template_id)
);

create index if not exists workout_template_days_template_idx on public.workout_template_days(template_id, day_order);
create index if not exists workout_template_exercises_day_idx on public.workout_template_exercises(template_day_id, exercise_order);
create index if not exists favorite_workout_templates_trainer_idx on public.favorite_workout_templates(trainer_id);

alter table public.workout_templates enable row level security;
alter table public.workout_template_days enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.favorite_workout_templates enable row level security;

drop policy if exists "workout_templates_select_authenticated" on public.workout_templates;
create policy "workout_templates_select_authenticated"
on public.workout_templates for select
using (auth.uid() is not null and is_active = true);

drop policy if exists "workout_templates_admin_manage" on public.workout_templates;
create policy "workout_templates_admin_manage"
on public.workout_templates for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "workout_template_days_select_authenticated" on public.workout_template_days;
create policy "workout_template_days_select_authenticated"
on public.workout_template_days for select
using (
  auth.uid() is not null
  and exists (select 1 from public.workout_templates wt where wt.id = workout_template_days.template_id and wt.is_active = true)
);

drop policy if exists "workout_template_days_admin_manage" on public.workout_template_days;
create policy "workout_template_days_admin_manage"
on public.workout_template_days for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "workout_template_exercises_select_authenticated" on public.workout_template_exercises;
create policy "workout_template_exercises_select_authenticated"
on public.workout_template_exercises for select
using (
  auth.uid() is not null
  and exists (
    select 1
    from public.workout_template_days wtd
    join public.workout_templates wt on wt.id = wtd.template_id
    where wtd.id = workout_template_exercises.template_day_id
      and wt.is_active = true
  )
);

drop policy if exists "workout_template_exercises_admin_manage" on public.workout_template_exercises;
create policy "workout_template_exercises_admin_manage"
on public.workout_template_exercises for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "favorite_workout_templates_select_owner" on public.favorite_workout_templates;
create policy "favorite_workout_templates_select_owner"
on public.favorite_workout_templates for select
using (public.is_admin() or trainer_id = public.current_trainer_id());

drop policy if exists "favorite_workout_templates_manage_owner" on public.favorite_workout_templates;
create policy "favorite_workout_templates_manage_owner"
on public.favorite_workout_templates for all
using (public.is_admin() or trainer_id = public.current_trainer_id())
with check (public.is_admin() or trainer_id = public.current_trainer_id());

insert into public.workout_templates (name, goal, level, category, days_per_week, estimated_duration_minutes, location, equipment, description, is_active)
values
  ('Iniciante Academia 3x Semana', 'Condicionamento', 'Iniciante', 'Academia', 3, 50, 'Academia', array['Maquinas','Halteres'], 'Modelo base para alunos iniciantes criarem consistencia com movimentos simples.', true),
  ('Hipertrofia Feminina Glúteos e Pernas 4x', 'Hipertrofia', 'Intermediario', 'Pernas e gluteos', 4, 60, 'Academia', array['Maquinas','Barra','Halteres'], 'Divisao com enfase em gluteos, quadriceps e posterior sem alterar o modelo original.', true),
  ('Hipertrofia Masculina ABC', 'Hipertrofia', 'Intermediario', 'ABC', 3, 55, 'Academia', array['Barra','Halteres','Cabos'], 'Modelo ABC equilibrado para progressao de cargas e volume semanal.', true),
  ('Emagrecimento Feminino 4x', 'Emagrecimento', 'Iniciante', 'Metabolico', 4, 45, 'Academia', array['Maquinas','Esteira'], 'Treino com musculacao e condicionamento para alto gasto energetico.', true),
  ('Híbrido Musculação + Corrida 5km', 'Performance', 'Intermediario', 'Hibrido', 5, 65, 'Academia e rua', array['Halteres','Esteira','GPS'], 'Modelo hibrido combinando forca e corrida para evoluir ate 5 km.', true),
  ('Treino em Casa Sem Equipamentos', 'Saude', 'Iniciante', 'Casa', 3, 35, 'Casa', array['Peso corporal'], 'Treino rapido para alunos online sem equipamentos.', true),
  ('Treino 50+ Força e Mobilidade', 'Longevidade', 'Iniciante', 'Forca e mobilidade', 3, 40, 'Academia', array['Maquinas','Elasticos'], 'Modelo de baixo risco para forca, equilibrio e mobilidade.', true),
  ('Obesidade Baixo Impacto', 'Emagrecimento', 'Iniciante', 'Baixo impacto', 4, 40, 'Academia', array['Bike','Maquinas'], 'Treino seguro com baixo impacto articular e progressao gradual.', true)
on conflict (name) do update set
  goal = excluded.goal,
  level = excluded.level,
  category = excluded.category,
  days_per_week = excluded.days_per_week,
  estimated_duration_minutes = excluded.estimated_duration_minutes,
  location = excluded.location,
  equipment = excluded.equipment,
  description = excluded.description,
  is_active = true;

with selected_templates as (
  select id, days_per_week
  from public.workout_templates
  where name in (
    'Iniciante Academia 3x Semana',
    'Hipertrofia Feminina Glúteos e Pernas 4x',
    'Hipertrofia Masculina ABC',
    'Emagrecimento Feminino 4x',
    'Híbrido Musculação + Corrida 5km',
    'Treino em Casa Sem Equipamentos',
    'Treino 50+ Força e Mobilidade',
    'Obesidade Baixo Impacto'
  )
),
template_days as (
  select
    id as template_id,
    day_order,
    case day_order when 1 then 'Dia A' when 2 then 'Dia B' when 3 then 'Dia C' when 4 then 'Dia D' else 'Dia E' end as day_name,
    case day_order when 1 then 'Inferiores' when 2 then 'Superiores' when 3 then 'Core e condicionamento' when 4 then 'Posterior e gluteos' else 'Corrida' end as focus
  from selected_templates
  cross join lateral generate_series(1, days_per_week) as day_order
)
insert into public.workout_template_days (template_id, day_order, day_name, focus, notes)
select template_id, day_order, day_name, focus, 'Ajustar cargas e tecnicas conforme avaliacao do aluno.'
from template_days
on conflict (template_id, day_order) do update set
  day_name = excluded.day_name,
  focus = excluded.focus,
  notes = excluded.notes;

with day_rows as (
  select id, focus from public.workout_template_days
),
exercise_seed as (
  select id as template_day_id, 1 as exercise_order,
    case focus when 'Inferiores' then 'Agachamento livre' when 'Superiores' then 'Supino inclinado' when 'Core e condicionamento' then 'Prancha com toque' when 'Posterior e gluteos' then 'Levantamento terra' else 'Corrida zona 2' end as exercise_name,
    focus as muscle_group
  from day_rows
  union all
  select id, 2,
    case focus when 'Inferiores' then 'Leg press' when 'Superiores' then 'Remada unilateral' when 'Core e condicionamento' then 'Bike intervalada' when 'Posterior e gluteos' then 'Stiff com halteres' else 'Educativos de corrida' end,
    focus
  from day_rows
  union all
  select id, 3,
    case focus when 'Inferiores' then 'Mesa flexora' when 'Superiores' then 'Desenvolvimento' when 'Core e condicionamento' then 'Mobilidade de quadril' when 'Posterior e gluteos' then 'Cadeira abdutora' else 'Alongamento posterior' end,
    focus
  from day_rows
)
insert into public.workout_template_exercises (template_day_id, exercise_order, exercise_name, muscle_group, sets, reps, rest_seconds, technique, notes)
select
  template_day_id,
  exercise_order,
  exercise_name,
  muscle_group,
  case when exercise_name like 'Corrida%' then 1 else 3 end,
  case when exercise_name like 'Corrida%' then '5 km' else '10-12' end,
  case when exercise_name like 'Corrida%' then 0 else 60 end,
  'Progressao controlada',
  'Copiado para o aluno como treino editavel.'
from exercise_seed
on conflict (template_day_id, exercise_order) do update set
  exercise_name = excluded.exercise_name,
  muscle_group = excluded.muscle_group,
  sets = excluded.sets,
  reps = excluded.reps,
  rest_seconds = excluded.rest_seconds,
  technique = excluded.technique,
  notes = excluded.notes;
