-- =============================================================
-- BACKSTAGE PRO — Schema Consolidado
-- Execute no SQL Editor do Supabase Dashboard
-- Seguro para rodar em banco já existente (IF NOT EXISTS + ALTER)
-- Ordem: profiles → clients → events → expenses → daily_work
--        → user_settings → ai_conversations
-- =============================================================

-- ──────────────────────────────────────────────────────────────
-- 001 · PROFILES
-- ──────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  name text,
  phone text,
  city text,
  state text,
  category text,
  category_label text,
  specialties text[],
  years_experience integer,
  daily_rate numeric,
  monthly_goal_events integer,
  monthly_goal_revenue numeric,
  avatar_url text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles'
    and policyname = 'Usuário acessa apenas seu próprio perfil'
  ) then
    create policy "Usuário acessa apenas seu próprio perfil"
      on profiles for all
      using (auth.uid() = id) with check (auth.uid() = id);
  end if;
end $$;

create index if not exists profiles_created_at_idx on profiles(created_at);

-- ──────────────────────────────────────────────────────────────
-- 003 · CLIENTS (antes de events por dependência de FK)
-- ──────────────────────────────────────────────────────────────
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  contact_person text,
  logo_url text,
  company text,
  city text,
  state text,
  policy_default_payment_model text,
  policy_allows_meio_e_dobra_juntos boolean default false,
  notes text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Colunas novas (caso a tabela já existisse sem elas)
alter table clients add column if not exists contact_person text;
alter table clients add column if not exists logo_url text;
alter table clients add column if not exists policy_default_payment_model text;
alter table clients add column if not exists policy_allows_meio_e_dobra_juntos boolean default false;

alter table clients enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'clients'
    and policyname = 'Usuário acessa apenas seus clientes'
  ) then
    create policy "Usuário acessa apenas seus clientes"
      on clients for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists clients_user_id_idx on clients(user_id);
create index if not exists clients_name_idx on clients(name);

-- ──────────────────────────────────────────────────────────────
-- 002 · EVENTS (depois de clients)
-- ──────────────────────────────────────────────────────────────
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  color text default '#22d3ee',
  status text default 'pending',
  payment_status text default 'pending',
  daily_cache_value numeric default 0,
  cache_valor_base numeric,
  payment_model text default 'HORAS_EXTRAS',
  payment_due_date date,
  observacoes_md text,
  paid boolean default false,
  auto_hours_applied boolean default false,
  description text,
  location text,
  category text,
  category_label text,
  estimated_revenue numeric,
  actual_revenue numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migrar event_date → start_date / end_date (schema antigo)
do $$ begin
  -- Adicionar start_date se não existe
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'events' and column_name = 'start_date'
  ) then
    alter table events add column start_date date;
    -- Copiar valor de event_date se existir
    if exists (
      select 1 from information_schema.columns
      where table_name = 'events' and column_name = 'event_date'
    ) then
      update events set start_date = event_date where start_date is null;
    end if;
  end if;

  -- Adicionar end_date se não existe
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'events' and column_name = 'end_date'
  ) then
    alter table events add column end_date date;
    -- Copiar valor de event_date se existir
    if exists (
      select 1 from information_schema.columns
      where table_name = 'events' and column_name = 'event_date'
    ) then
      update events set end_date = event_date where end_date is null;
    end if;
  end if;
end $$;

-- Adicionar colunas novas individualmente
alter table events add column if not exists start_time time;
alter table events add column if not exists end_time time;
alter table events add column if not exists color text default '#22d3ee';
alter table events add column if not exists paid boolean default false;
alter table events add column if not exists auto_hours_applied boolean default false;
alter table events add column if not exists daily_cache_value numeric default 0;
alter table events add column if not exists cache_valor_base numeric;
alter table events add column if not exists payment_model text default 'HORAS_EXTRAS';
alter table events add column if not exists payment_due_date date;
alter table events add column if not exists observacoes_md text;
alter table events add column if not exists paid_amount numeric;
alter table events add column if not exists paid_date date;

alter table events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'events'
    and policyname = 'Usuário acessa apenas seus eventos'
  ) then
    create policy "Usuário acessa apenas seus eventos"
      on events for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists events_user_id_idx on events(user_id);
create index if not exists events_start_date_idx on events(start_date);
create index if not exists events_status_idx on events(status);
create index if not exists events_client_id_idx on events(client_id);

-- ──────────────────────────────────────────────────────────────
-- 004 · EXPENSES
-- ──────────────────────────────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade,
  title text not null,
  category text,
  amount numeric not null,
  expense_date date not null,
  payment_method text,
  notes text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Colunas novas caso tabela já exista
alter table expenses add column if not exists expense_date date;
alter table expenses add column if not exists payment_method text;
alter table expenses add column if not exists receipt_url text;

-- Migrar date → expense_date (schema antigo)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'expenses' and column_name = 'date'
  ) and exists (
    select 1 from information_schema.columns
    where table_name = 'expenses' and column_name = 'expense_date'
  ) then
    update expenses set expense_date = date::date where expense_date is null;
  end if;
end $$;

alter table expenses enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'expenses'
    and policyname = 'Usuário acessa apenas suas despesas'
  ) then
    create policy "Usuário acessa apenas suas despesas"
      on expenses for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists expenses_user_id_idx on expenses(user_id);
create index if not exists expenses_event_id_idx on expenses(event_id);
create index if not exists expenses_date_idx on expenses(expense_date);

-- ──────────────────────────────────────────────────────────────
-- 005 · DAILY_WORK
-- ──────────────────────────────────────────────────────────────
create table if not exists daily_work (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references events(id) on delete cascade,
  date date not null,
  entry_time text,
  exit_time text,
  total_hours numeric default 0,
  overtime_hours numeric default 0,
  daily_cache numeric default 0,
  notes text,
  photo_url text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migrar work_date → date e hours_worked → total_hours (schema antigo)
do $$ begin
  -- Adicionar coluna date se não existe
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'daily_work' and column_name = 'date'
  ) then
    alter table daily_work add column date date;
    if exists (
      select 1 from information_schema.columns
      where table_name = 'daily_work' and column_name = 'work_date'
    ) then
      update daily_work set date = work_date where date is null;
    end if;
  end if;

  -- Adicionar total_hours se não existe
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'daily_work' and column_name = 'total_hours'
  ) then
    alter table daily_work add column total_hours numeric default 0;
    if exists (
      select 1 from information_schema.columns
      where table_name = 'daily_work' and column_name = 'hours_worked'
    ) then
      update daily_work set total_hours = hours_worked where total_hours = 0;
    end if;
  end if;
end $$;

-- Colunas novas
alter table daily_work add column if not exists entry_time text;
alter table daily_work add column if not exists exit_time text;
alter table daily_work add column if not exists overtime_hours numeric default 0;
alter table daily_work add column if not exists daily_cache numeric default 0;
alter table daily_work add column if not exists photo_url text;

alter table daily_work enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'daily_work'
    and policyname = 'Usuário acessa apenas seus registros'
  ) then
    create policy "Usuário acessa apenas seus registros"
      on daily_work for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists daily_work_user_id_idx on daily_work(user_id);
create index if not exists daily_work_event_id_idx on daily_work(event_id);
create index if not exists daily_work_date_idx on daily_work(date);

-- ──────────────────────────────────────────────────────────────
-- 006 · USER_SETTINGS
-- ──────────────────────────────────────────────────────────────
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  theme text default 'dark',
  notifications_enabled boolean default true,
  email_notifications boolean default true,
  currency text default 'BRL',
  language text default 'pt-BR',
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'user_settings'
    and policyname = 'Usuário acessa apenas suas configurações'
  ) then
    create policy "Usuário acessa apenas suas configurações"
      on user_settings for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists user_settings_user_id_idx on user_settings(user_id);

-- ──────────────────────────────────────────────────────────────
-- 007 · AI_CONVERSATIONS
-- ──────────────────────────────────────────────────────────────
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  messages jsonb default '[]',
  context jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table ai_conversations enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'ai_conversations'
    and policyname = 'Usuário acessa apenas suas conversas'
  ) then
    create policy "Usuário acessa apenas suas conversas"
      on ai_conversations for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists ai_conversations_user_id_idx on ai_conversations(user_id);
create index if not exists ai_conversations_created_at_idx on ai_conversations(created_at desc);
