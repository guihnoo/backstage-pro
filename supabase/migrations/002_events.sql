-- Tabela de eventos
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  color text default '#22d3ee',
  status text default 'pending', -- pending, confirmed, completed, cancelled
  payment_status text default 'pending', -- pending, paid, partial, unpaid
  daily_cache_value numeric default 0,
  cache_valor_base numeric,
  payment_model text default 'HORAS_EXTRAS', -- HORAS_EXTRAS, MEIO_CACHE_E_DOBRA
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

alter table events enable row level security;

create policy "Usuário acessa apenas seus eventos"
  on events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index events_user_id_idx on events(user_id);
create index events_start_date_idx on events(start_date);
create index events_status_idx on events(status);
create index events_client_id_idx on events(client_id);
