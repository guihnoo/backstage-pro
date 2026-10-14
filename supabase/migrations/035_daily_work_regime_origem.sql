-- 035 — Horas e cachê v2 (Lote 2)
-- Cada dia de trabalho passa a guardar:
--   regime      : 'meia' (metade do cachê), 'cheia' (cachê) ou 'dobra' (2x), escolhido pelo usuário
--   hora_extra  : se as horas acima de 12 h somam cachê/12 por hora naquele dia
--   origem      : 'lancada' (horas reais) ou 'estimada' (12 h automáticas)
-- Linhas antigas ficam com regime/hora_extra NULL: o valor gravado em daily_cache continua valendo.
--
-- ORDEM SEGURA: aplicar esta migration ANTES de ligar VITE_REGIME_POR_DIA=true no app.
-- É idempotente (pode rodar de novo sem erro).

alter table daily_work add column if not exists regime text;
alter table daily_work add column if not exists hora_extra boolean;
alter table daily_work add column if not exists origem text not null default 'lancada';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'daily_work_regime_check') then
    alter table daily_work add constraint daily_work_regime_check
      check (regime is null or regime in ('meia', 'cheia', 'dobra'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'daily_work_origem_check') then
    alter table daily_work add constraint daily_work_origem_check
      check (origem in ('lancada', 'estimada'));
  end if;
end $$;

-- Classifica as 12 h automáticas antigas pela marca que o app já gravava nas notas.
-- Só muda a coluna nova `origem`; nenhum valor, hora ou data é alterado.
update daily_work
   set origem = 'estimada'
 where origem = 'lancada'
   and notes like '12h automáticas%';

-- 12 h automáticas numa única transação, só nos dias sem registro.
-- SECURITY INVOKER: roda com as permissões (RLS) do próprio usuário.
-- O "for update" no evento faz duas chamadas simultâneas (duas abas) esperarem uma a outra,
-- então o mesmo dia nunca é criado duas vezes.
create or replace function aplicar_12h_automaticas(
  p_event_id uuid,
  p_daily_cache numeric,
  p_nota text default '12h automáticas'
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_event events%rowtype;
  v_criados integer := 0;
begin
  if auth.uid() is null then
    raise exception 'nao autenticado';
  end if;

  select * into v_event
    from public.events
   where id = p_event_id and user_id = auth.uid()
   for update;

  if not found then
    raise exception 'evento nao encontrado';
  end if;
  if v_event.status in ('cancelled', 'cancelado') then
    raise exception 'evento cancelado';
  end if;
  if coalesce(v_event.end_date, v_event.start_date) - v_event.start_date > 60 then
    raise exception 'evento com mais de 60 dias: lance as horas manualmente';
  end if;

  -- work_date: coluna legada que o app também grava (mapPayloadToDb envia date e work_date).
  insert into public.daily_work (user_id, event_id, date, work_date, entry_time, exit_time,
                          total_hours, overtime_hours, daily_cache, status, notes,
                          regime, hora_extra, origem)
  select auth.uid(), p_event_id, d::date, d::date, '08:00', '20:00',
         12, 0, coalesce(p_daily_cache, 0), 'completed', p_nota,
         'cheia', false, 'estimada'
    from generate_series(v_event.start_date, coalesce(v_event.end_date, v_event.start_date), interval '1 day') as d
   where not exists (
           select 1 from public.daily_work w
            where w.user_id = auth.uid()
              and w.event_id = p_event_id
              and w.date = d::date
         )
  on conflict do nothing; -- com o índice da 036, um insert direto concorrente não aborta a série
  get diagnostics v_criados = row_count;

  update public.events set auto_hours_applied = true
   where id = p_event_id and user_id = auth.uid();

  return v_criados;
end;
$$;

-- Só usuários logados executam (o Postgres dá EXECUTE a PUBLIC por padrão).
revoke execute on function aplicar_12h_automaticas(uuid, numeric, text) from public;
grant execute on function aplicar_12h_automaticas(uuid, numeric, text) to authenticated;
