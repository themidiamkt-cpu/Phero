-- Rode depois de supabase/schema.sql.
-- Este seed sincroniza somente admin e personal existentes no Auth.
-- Alunos devem ser criados pela tela do personal para testar o fluxo real.

update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin'),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin', 'full_name', 'The Midia MKT')
where lower(email) = 'themidiamkt@gmail.com';

update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'trainer'),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'trainer', 'full_name', 'Pedro Alves')
where lower(email) = 'pedroalvesjr97@gmail.com';

insert into public.profiles (user_id, role, full_name, status)
select id, 'admin', 'The Midia MKT', 'active'
from auth.users
where lower(email) = 'themidiamkt@gmail.com'
on conflict (user_id) do update set
  role = excluded.role,
  full_name = excluded.full_name,
  status = excluded.status;

insert into public.profiles (user_id, role, full_name, status)
select id, 'trainer', 'Pedro Alves', 'active'
from auth.users
where lower(email) = 'pedroalvesjr97@gmail.com'
on conflict (user_id) do update set
  role = excluded.role,
  full_name = excluded.full_name,
  status = excluded.status;

insert into public.trainers (profile_id, business_name, bio, approved_at, blocked_at)
select p.id, 'Pedro Alves', 'Personal trainer', now(), null
from public.profiles p
join auth.users u on u.id = p.user_id
where lower(u.email) = 'pedroalvesjr97@gmail.com'
on conflict (profile_id) do update set
  business_name = excluded.business_name,
  bio = excluded.bio,
  approved_at = coalesce(public.trainers.approved_at, excluded.approved_at),
  blocked_at = null;
