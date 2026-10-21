-- 042_fechamento_ja_paguei.sql
-- "Ja paguei" na pagina publica de fechamento (visual All Access).
-- ADITIVA: so adiciona uma coluna vazia e uma funcao nova; nao apaga nem altera dados existentes.
-- Quem tem o link so consegue marcar "ja paguei" UMA vez para aquele fechamento, enquanto o link
-- estiver valido (nao vencido, nao revogado). Isso NAO baixa o pagamento: o dono do app continua
-- confirmando quando o dinheiro cai. Backup do banco antes de aplicar (regra do projeto).
-- Idempotente.

alter table public.closing_shares
  add column if not exists client_notice_at timestamptz;

-- Mesma leitura de antes + quando o cliente avisou (para a pagina mostrar "aviso enviado").
create or replace function public.ver_link_fechamento(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select c.snapshot
         || jsonb_build_object('expiresAt', c.expires_at)
         || jsonb_build_object('clientNoticeAt', c.client_notice_at)
    from public.closing_shares c
   where c.token = p_token
     and length(coalesce(p_token, '')) >= 48
     and c.revoked_at is null
     and c.expires_at > now()
   limit 1;
$$;

-- Registra o aviso do cliente. Devolve true se o link e valido (mesmo se o aviso ja existia).
create or replace function public.avisar_pagamento_fechamento(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if length(coalesce(p_token, '')) < 48 then
    return false;
  end if;

  select c.id into v_id
    from public.closing_shares c
   where c.token = p_token
     and c.revoked_at is null
     and c.expires_at > now()
   limit 1;

  if v_id is null then
    return false;
  end if;

  update public.closing_shares
     set client_notice_at = coalesce(client_notice_at, now())
   where id = v_id;

  return true;
end;
$$;

revoke all on function public.ver_link_fechamento(text) from public;
grant execute on function public.ver_link_fechamento(text) to anon, authenticated;
revoke all on function public.avisar_pagamento_fechamento(text) from public;
grant execute on function public.avisar_pagamento_fechamento(text) to anon, authenticated;
