create table event_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  title text,
  color text default '#39FF14',
  payment_model text default 'daily',
  daily_cache_value numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table event_templates enable row level security;

create policy "Usuário acessa apenas seus templates"
  on event_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index event_templates_user_id_idx on event_templates(user_id);
