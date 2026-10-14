-- SOMENTE LEITURA — não altera nada.
-- Lista os dias com mais de um registro de horas no mesmo evento (o que hoje soma em dobro).
-- Rode no SQL Editor do Supabase antes da migration 036.

select w.user_id,
       w.event_id,
       e.title            as evento,
       w.date             as dia,
       count(*)           as registros,
       sum(w.daily_cache) as soma_cache,
       json_agg(json_build_object(
         'id', w.id,
         'entrada', w.entry_time,
         'saida', w.exit_time,
         'horas', w.total_hours,
         'cache', w.daily_cache,
         'notas', w.notes,
         'criado', w.created_at
       ) order by w.created_at) as detalhes
  from daily_work w
  left join events e on e.id = w.event_id
 where w.event_id is not null
 group by w.user_id, w.event_id, e.title, w.date
having count(*) > 1
 order by w.date desc;

-- Conferência extra (também só leitura): a coluna legada work_date existe?
-- A função aplicar_12h_automaticas (migration 035) grava date e work_date.
select column_name, is_nullable, data_type
  from information_schema.columns
 where table_name = 'daily_work'
   and column_name in ('date', 'work_date', 'regime', 'hora_extra', 'origem');
