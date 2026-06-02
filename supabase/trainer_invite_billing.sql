-- Campos para convite de aluno, PIX do personal e cobrança da plataforma.

alter table public.trainers
  add column if not exists invite_code text,
  add column if not exists pix_key text,
  add column if not exists platform_subscription_status text not null default 'trial'
    check (platform_subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  add column if not exists platform_paid_until date;

create unique index if not exists trainers_invite_code_key
on public.trainers (invite_code)
where invite_code is not null;

update public.trainers t
set invite_code = upper(
  left(regexp_replace(coalesce(p.full_name, t.business_name, 'Personal'), '[^A-Za-z]', '', 'g'), 2)
  || lpad((floor(random() * 9000 + 1000))::int::text, 4, '0')
)
from public.profiles p
where p.id = t.profile_id
  and t.invite_code is null;

create table if not exists public.platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null unique references public.trainers(id) on delete cascade,
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'canceled')),
  current_period_end date,
  created_at timestamptz not null default now()
);

alter table public.platform_subscriptions enable row level security;

drop policy if exists "platform_subscriptions_select_owner_admin" on public.platform_subscriptions;
create policy "platform_subscriptions_select_owner_admin"
on public.platform_subscriptions for select
using (public.is_admin() or trainer_id = public.current_trainer_id());

drop policy if exists "platform_subscriptions_manage_admin" on public.platform_subscriptions;
create policy "platform_subscriptions_manage_admin"
on public.platform_subscriptions for all
using (public.is_admin())
with check (public.is_admin());

notify pgrst, 'reload schema';
