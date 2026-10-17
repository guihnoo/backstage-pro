-- 040_fechamento_link_seguro.sql
-- Link publico de fechamento SEGURO (substitui o link que levava CPF/PIX/NF-e dentro da propria URL).
-- O link passa a ter so um codigo aleatorio; os dados ficam no banco, so o dono cria/revoga,
-- e quem tem o link so consegue LER aquele fechamento, enquanto nao vencer nem for revogado.
-- O nome do prestador e a chave PIX sao gravados pelo SERVIDOR a partir do cadastro do dono
-- (nao do navegador), para ninguem montar um fechamento com uma chave PIX diferente da conta.
-- Idempotente. Nao altera dados existentes.

create table if not exists public.closing_shares (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  snapshot jsonb not null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists closing_shares_user_idx on public.closing_shares (user_id, created_at desc);

alter table public.closing_shares enable row level security;

drop policy if exists closing_shares_select_own on public.closing_shares;
create policy closing_shares_select_own on public.closing_shares
  for select to authenticated using (user_id = auth.uid());

drop policy if exists closing_shares_update_own on public.closing_shares;
create policy closing_shares_update_own on public.closing_shares
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists closing_shares_delete_own on public.closing_shares;
create policy closing_shares_delete_own on public.closing_shares
  for delete to authenticated using (user_id = auth.uid());

-- Sem policy de INSERT: criacao so pela funcao abaixo (que confere o dono do evento).
revoke insert on public.closing_shares from anon, authenticated;

-- Cria o link. O cliente manda os valores do fechamento; o servidor confere que o evento e do usuario
-- e sobrescreve nome do prestador e PIX com o cadastro do proprio usuario.
create or replace function public.criar_link_fechamento(p_event_id uuid, p_snapshot jsonb, p_dias integer default 30)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_set record;
  v_snap jsonb;
  v_token text;
begin
  if v_uid is null then
    raise exception 'login necessario';
  end if;
  if not exists (select 1 from public.events e where e.id = p_event_id and e.user_id = v_uid) then
    raise exception 'evento nao encontrado';
  end if;
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'dados do fechamento invalidos';
  end if;
  if pg_column_size(p_snapshot) > 200000 then
    raise exception 'fechamento grande demais';
  end if;

  select s.pix_key, s.pix_key_type, s.report_full_name
    into v_set
    from public.user_settings s
   where s.user_id = v_uid
   limit 1;

  v_snap := p_snapshot
    || jsonb_build_object(
         'provider', coalesce(p_snapshot->'provider', '{}'::jsonb)
           || jsonb_build_object('name', coalesce(nullif(v_set.report_full_name, ''), p_snapshot->'provider'->>'name')),
         'pix', jsonb_build_object('key', coalesce(v_set.pix_key, ''), 'type', coalesce(v_set.pix_key_type, ''))
       );

  insert into public.closing_shares (user_id, event_id, snapshot, expires_at)
  values (v_uid, p_event_id, v_snap, now() + make_interval(days => greatest(1, least(coalesce(p_dias, 30), 90))))
  returning token into v_token;

  return v_token;
end;
$$;

-- Leitura publica pelo codigo: so o fechamento daquele link, se valido.
create or replace function public.ver_link_fechamento(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select c.snapshot || jsonb_build_object('expiresAt', c.expires_at)
    from public.closing_shares c
   where c.token = p_token
     and length(coalesce(p_token, '')) >= 48
     and c.revoked_at is null
     and c.expires_at > now()
   limit 1;
$$;

revoke all on function public.criar_link_fechamento(uuid, jsonb, integer) from public, anon;
grant execute on function public.criar_link_fechamento(uuid, jsonb, integer) to authenticated;
revoke all on function public.ver_link_fechamento(text) from public;
grant execute on function public.ver_link_fechamento(text) to anon, authenticated;
