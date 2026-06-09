-- Banco global de empresas, compartilhado entre todos os usuários
-- Cada usuário contribui ao cadastrar um cliente novo com dados da empresa

create table companies (
  id uuid primary key default gen_random_uuid(),

  -- Dados da empresa (Receita Federal / manual)
  name text not null,                    -- Razão social
  trading_name text,                     -- Nome fantasia
  cnpj text,                             -- CNPJ sem formatação
  city text,
  state text,                            -- UF (2 letras)
  address text,                          -- Endereço completo
  phone text,
  email text,
  website text,
  logo_url text,

  -- Classificação
  cnae text,                             -- Atividade principal
  porte text,                            -- MICRO, PEQUENO, MEDIO, GRANDE, DEMAIS
  status text default 'ativa',           -- ativa, inativa, suspensa

  -- Metadados de origem
  source text default 'manual',          -- manual | cnpja | brasilapi
  verified boolean default false,        -- true = confirmado por API oficial

  -- Auditoria
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CNPJ único quando preenchido
create unique index companies_cnpj_idx on companies(cnpj) where cnpj is not null;

-- Índices de busca
create index companies_name_idx on companies(lower(name));
create index companies_trading_name_idx on companies(lower(trading_name)) where trading_name is not null;
create index companies_city_state_idx on companies(city, state);

-- RLS: todos os usuários autenticados leem; qualquer um contribui; só criador edita
alter table companies enable row level security;

create policy "Usuários autenticados podem ler todas as empresas"
  on companies for select
  using (auth.role() = 'authenticated');

create policy "Usuários autenticados podem inserir empresas"
  on companies for insert
  with check (auth.role() = 'authenticated');

create policy "Criador pode atualizar sua empresa"
  on companies for update
  using (auth.uid() = created_by);

create policy "Criador pode deletar sua empresa"
  on companies for delete
  using (auth.uid() = created_by);

-- Adiciona FK company_id na tabela clients existente
alter table clients
  add column if not exists company_id uuid references companies(id) on delete set null;

create index if not exists clients_company_id_idx on clients(company_id);

-- Trigger para atualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
  before update on companies
  for each row execute procedure update_updated_at_column();
