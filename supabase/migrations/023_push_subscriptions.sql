-- Web Push subscriptions (PWA no celular)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

create policy "Usuário gerencia suas subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- Preferências de push (opt-in por tipo)
alter table user_settings
  add column if not exists push_enabled boolean default false,
  add column if not exists push_events boolean default true,
  add column if not exists push_payments boolean default true,
  add column if not exists push_goals boolean default false;
