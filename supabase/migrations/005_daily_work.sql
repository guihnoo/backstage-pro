-- Tabela de trabalho diário
create table daily_work (
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
  status text default 'pending', -- pending, completed, invoiced
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table daily_work enable row level security;

create policy "Usuário acessa apenas seus registros"
  on daily_work for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index daily_work_user_id_idx on daily_work(user_id);
create index daily_work_event_id_idx on daily_work(event_id);
create index daily_work_date_idx on daily_work(date);
