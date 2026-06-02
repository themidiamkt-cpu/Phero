alter table public.trainers
  add column if not exists hourly_rate numeric;

alter table public.plans
  add column if not exists custom_days int;

alter table public.plans
  drop constraint if exists plans_billing_cycle_check;

alter table public.plans
  add constraint plans_billing_cycle_check
  check (billing_cycle in ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom'));

alter table public.plans
  drop constraint if exists plans_custom_days_check;

alter table public.plans
  add constraint plans_custom_days_check
  check (custom_days is null or custom_days > 0);

notify pgrst, 'reload schema';
