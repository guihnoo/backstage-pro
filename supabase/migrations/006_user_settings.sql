-- Tabela de configurações do usuário
create table user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  theme text default 'dark', -- dark, light
  notifications_enabled boolean default true,
  email_notifications boolean default true,
  currency text default 'BRL',
  language text default 'pt-BR',
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Usuário acessa apenas suas configurações"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index user_settings_user_id_idx on user_settings(user_id);
