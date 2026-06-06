-- Tabela de clientes
create table clients (
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
  policy_default_payment_model text, -- HORAS_EXTRAS, MEIO_CACHE_E_DOBRA
  policy_allows_meio_e_dobra_juntos boolean default false,
  notes text,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table clients enable row level security;

create policy "Usuário acessa apenas seus clientes"
  on clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index clients_user_id_idx on clients(user_id);
create index clients_name_idx on clients(name);
