-- Tabela de eventos
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  client_id uuid references clients(id),
  category text,
  category_label text,
  status text default 'pending', -- pending, confirmed, completed, cancelled
  payment_status text default 'pending', -- pending, paid, partial
  daily_rate numeric,
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
create index events_event_date_idx on events(event_date);
create index events_status_idx on events(status);
