-- Opcional: remove os alunos de teste antigos do banco.
-- Nao apaga os usuarios do Supabase Auth; apenas remove os vinculos do app.

delete from public.profiles
where user_id in (
  select id
  from auth.users
  where lower(email) in ('robertomoura.ads@gmail.com', 'hernany.ribeiro@gmail.com')
)
and role = 'student';

update auth.users
set
  raw_app_meta_data = raw_app_meta_data - 'role',
  raw_user_meta_data = raw_user_meta_data - 'role'
where lower(email) in ('robertomoura.ads@gmail.com', 'hernany.ribeiro@gmail.com');
