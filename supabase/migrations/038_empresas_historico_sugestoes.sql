-- 038 — Segurança do papel de dono + catálogo de empresas com histórico e sugestões.
--
-- 1) BRECHA: a regra de "profiles" deixava cada usuário alterar TODO o próprio perfil,
--    inclusive a coluna role. Qualquer um podia se tornar "owner" e ler os feedbacks e
--    prints de todos. Agora role só muda pelo painel do Supabase (postgres/service_role).
--    Conferido em 15/10/2026: só existe 1 dono (o desenvolvedor).
--
-- 2) Empresas (catálogo compartilhado):
--    - quem não criou a empresa só PREENCHE campos vazios (logo, CNPJ válido, razão social...);
--    - vale também para empresas antigas sem criador; o dono do app pode tudo;
--    - telefone/e-mail: só quem criou a empresa (ou o dono do app) altera;
--    - TROCAR algo que já existe vira "sugestão" para o dono aprovar (tabela company_suggestions);
--    - toda mudança fica no histórico (company_changes). Só o dono lê histórico e fila.
--
-- Idempotente: pode rodar de novo sem erro.

-- ---------- 1) Papel de dono protegido ----------
create or replace function public.profiles_proteger_papel()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'user';
  elsif new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_proteger_papel on public.profiles;
create trigger profiles_proteger_papel
  before insert or update on public.profiles
  for each row execute function public.profiles_proteger_papel();

-- ---------- 2) CNPJ válido (dígitos verificadores) ----------
create or replace function public.cnpj_valido(p text)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
  pesos1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  pesos2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int; r int; i int;
begin
  if length(d) <> 14 or d ~ '^(\d)\1{13}$' then return false; end if;
  s := 0;
  for i in 1..12 loop s := s + substr(d, i, 1)::int * pesos1[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  if r <> substr(d, 13, 1)::int then return false; end if;
  s := 0;
  for i in 1..13 loop s := s + substr(d, i, 1)::int * pesos2[i]; end loop;
  r := s % 11; r := case when r < 2 then 0 else 11 - r end;
  return r = substr(d, 14, 1)::int;
end;
$$;

-- ---------- 3) Regra de edição do catálogo ----------
create or replace function public.companies_somente_enriquecer()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if public.is_app_owner() then
    return new;
  end if;
  if old.created_by is null or auth.uid() is distinct from old.created_by then
    -- Identidade nunca muda por terceiros.
    new.created_by := old.created_by;
    new.verified   := old.verified;
    new.created_at := old.created_at;
    new.source     := old.source;
    -- Terceiros só preenchem o que está vazio.
    new.name := coalesce(nullif(old.name, ''), new.name);
    new.cnpj := case
      when coalesce(old.cnpj, '') <> '' then old.cnpj
      when public.cnpj_valido(new.cnpj) then regexp_replace(new.cnpj, '\D', '', 'g')
      else old.cnpj end;
    new.trading_name := coalesce(nullif(old.trading_name, ''), new.trading_name);
    new.city         := coalesce(nullif(old.city, ''), new.city);
    new.state        := coalesce(nullif(old.state, ''), new.state);
    new.address      := coalesce(nullif(old.address, ''), new.address);
    new.website      := coalesce(nullif(old.website, ''), new.website);
    new.logo_url     := coalesce(nullif(old.logo_url, ''), new.logo_url);
    new.cnae         := coalesce(nullif(old.cnae, ''), new.cnae);
    new.porte        := coalesce(nullif(old.porte, ''), new.porte);
    new.status       := coalesce(nullif(old.status, ''), new.status);
    -- Telefone/e-mail: terceiros nunca alteram (contato é de quem cadastrou).
    new.phone := old.phone;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists companies_somente_enriquecer on public.companies;
create trigger companies_somente_enriquecer
  before update on public.companies
  for each row execute function public.companies_somente_enriquecer();

-- ---------- 4) Histórico (só o dono lê) ----------
create table if not exists public.company_changes (
  id bigint generated always as identity primary key,
  company_id uuid not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  action text not null check (action in ('criou', 'preencheu', 'alterou', 'aprovou_sugestao')),
  field text,
  old_value text,
  new_value text
);
create index if not exists company_changes_company_idx on public.company_changes (company_id, changed_at desc);
create index if not exists company_changes_at_idx on public.company_changes (changed_at desc);
alter table public.company_changes enable row level security;

drop policy if exists company_changes_owner_read on public.company_changes;
create policy company_changes_owner_read
  on public.company_changes for select
  to authenticated
  using (public.is_app_owner());
-- Sem regra de insert/update/delete: só o gatilho (security definer) escreve.

create or replace function public.companies_registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  campo text;
  antes text;
  depois text;
  campos text[] := array['name','trading_name','cnpj','city','state','address','phone','email',
                         'website','logo_url','cnae','porte','status','source','verified'];
begin
  if tg_op = 'INSERT' then
    insert into public.company_changes (company_id, changed_by, action, field, new_value)
    values (new.id, auth.uid(), 'criou', 'name', new.name);
    return new;
  end if;
  foreach campo in array campos loop
    execute format('select ($1).%I::text, ($2).%I::text', campo, campo) into antes, depois using old, new;
    if antes is distinct from depois then
      insert into public.company_changes (company_id, changed_by, action, field, old_value, new_value)
      values (new.id, auth.uid(),
              case when current_setting('bp.aprovando', true) = 'sim' then 'aprovou_sugestao'
                   when coalesce(antes, '') = '' then 'preencheu' else 'alterou' end,
              campo, antes, depois);
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists companies_registrar_historico on public.companies;
create trigger companies_registrar_historico
  after insert or update on public.companies
  for each row execute function public.companies_registrar_historico();

-- ---------- 5) Sugestões de correção (fila do dono) ----------
create table if not exists public.company_suggestions (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  suggested_by uuid not null default auth.uid(),
  field text not null check (field in ('name', 'trading_name', 'logo_url', 'cnpj', 'city', 'state', 'website')),
  current_value text,
  suggested_value text not null,
  status text not null default 'pendente' check (status in ('pendente', 'aprovada', 'recusada')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create unique index if not exists company_suggestions_uma_pendente
  on public.company_suggestions (company_id, suggested_by, field) where status = 'pendente';
alter table public.company_suggestions enable row level security;

drop policy if exists company_suggestions_insert_own on public.company_suggestions;
create policy company_suggestions_insert_own
  on public.company_suggestions for insert
  to authenticated
  with check (suggested_by = auth.uid() and status = 'pendente');

drop policy if exists company_suggestions_read on public.company_suggestions;
create policy company_suggestions_read
  on public.company_suggestions for select
  to authenticated
  using (suggested_by = auth.uid() or public.is_app_owner());
-- Aprovar/recusar só pelas funções abaixo (sem regra de update direta).

create or replace function public.revisar_sugestao_empresa(p_id bigint, p_aprovar boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  s public.company_suggestions;
begin
  if not public.is_app_owner() then
    raise exception 'Somente o dono do app pode revisar sugestões';
  end if;
  select * into s from public.company_suggestions where id = p_id and status = 'pendente' for update;
  if not found then
    raise exception 'Sugestão não encontrada ou já revisada';
  end if;
  if p_aprovar then
    if s.field = 'cnpj' and not public.cnpj_valido(s.suggested_value) then
      raise exception 'CNPJ inválido';
    end if;
    perform set_config('bp.aprovando', 'sim', true);
    execute format('update public.companies set %I = $1 where id = $2', s.field)
      using case when s.field = 'cnpj' then regexp_replace(s.suggested_value, '\D', '', 'g') else s.suggested_value end,
            s.company_id;
    perform set_config('bp.aprovando', '', true);
  end if;
  update public.company_suggestions
     set status = case when p_aprovar then 'aprovada' else 'recusada' end, reviewed_at = now()
   where id = p_id;
end;
$$;

revoke all on function public.revisar_sugestao_empresa(bigint, boolean) from public;
grant execute on function public.revisar_sugestao_empresa(bigint, boolean) to authenticated;

-- ---------- 6) Nomes para a página do dono (histórico/sugestões) ----------
-- Perfis são privados (cada um vê só o seu). Esta função devolve nome/e-mail
-- dos autores SOMENTE para o dono do app; para qualquer outro usuário volta vazio.
create or replace function public.nomes_usuarios_para_dono(p_ids uuid[])
returns table (id uuid, nome text, email text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.name, u.email::text
    from public.profiles p
    left join auth.users u on u.id = p.id
   where public.is_app_owner() and p.id = any(p_ids);
$$;

revoke all on function public.nomes_usuarios_para_dono(uuid[]) from public;
grant execute on function public.nomes_usuarios_para_dono(uuid[]) to authenticated;
