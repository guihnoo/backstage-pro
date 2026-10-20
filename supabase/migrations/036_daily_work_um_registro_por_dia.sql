-- 036 — Um registro por dia, por evento (Lote 2)
-- APLICAR SÓ DEPOIS de rodar supabase/queries/verificar_dias_repetidos.sql e resolver as
-- repetições encontradas (o dono decide qual registro fica). Se ainda houver dia repetido,
-- esta migration para com erro e não muda nada.

do $$
declare
  v_repetidos integer;
begin
  select count(*) into v_repetidos
    from (
      select 1
        from daily_work
       where event_id is not null
       group by user_id, event_id, date
      having count(*) > 1
    ) r;

  if v_repetidos > 0 then
    raise exception 'Ainda existem % dia(s) repetido(s) em daily_work. Resolva antes de criar o indice.', v_repetidos;
  end if;
end $$;

create unique index if not exists daily_work_um_por_dia_idx
  on daily_work (user_id, event_id, date)
  where event_id is not null;
