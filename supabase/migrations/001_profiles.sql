-- Tabela de perfis de usuários
create table profiles (
  id uuid references auth.users(id) primary key,
  name text,
  phone text,
  city text,
  state text,
  category text,           -- id da categoria (audio, lighting, etc)
  category_label text,     -- nome legível (Técnico de Som, etc)
  specialties text[],      -- array de especialidades
  years_experience integer,
  daily_rate numeric,      -- valor por diária em R$
  monthly_goal_events integer,
  monthly_goal_revenue numeric,
  avatar_url text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativa Row Level Security
alter table profiles enable row level security;

-- Política: usuário acessa apenas seu próprio perfil
create policy "Usuário acessa apenas seu próprio perfil"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Index para queries rápidas
create index profiles_created_at_idx on profiles(created_at);
