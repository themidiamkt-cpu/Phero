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

create index if not exists chat_messages_sender_email_idx on public.chat_messages(sender_email);
create index if not exists chat_messages_recipient_email_idx on public.chat_messages(recipient_email);
create index if not exists chat_messages_pair_created_idx on public.chat_messages(sender_email, recipient_email, created_at);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_participants_or_admin" on public.chat_messages;
create policy "chat_messages_select_participants_or_admin"
on public.chat_messages for select
using (
  lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) in ('admin')
  or lower(coalesce(auth.jwt() ->> 'email', '')) in (sender_email, recipient_email)
);

drop policy if exists "chat_messages_insert_sender" on public.chat_messages;
create policy "chat_messages_insert_sender"
on public.chat_messages for insert
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = sender_email
  or lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) in ('admin')
);

drop policy if exists "chat_messages_update_recipient_read" on public.chat_messages;
create policy "chat_messages_update_recipient_read"
on public.chat_messages for update
using (
  lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) in ('admin')
  or lower(coalesce(auth.jwt() ->> 'email', '')) = recipient_email
)
with check (
  lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '')) in ('admin')
  or lower(coalesce(auth.jwt() ->> 'email', '')) = recipient_email
);
