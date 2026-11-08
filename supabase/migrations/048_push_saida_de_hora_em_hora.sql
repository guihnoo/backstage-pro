-- 048 — Lembrete de saída esquecida (CHEGUEI sem BATER SAÍDA), de hora em hora.
-- A função send-push-digest com {"mode":"exit"} só envia "Registre sua saída" quando a entrada
-- passou de 12 h e repete a cada 3 h até o usuário registrar (chave exit:<id>:<faixa> no push_sent_log).
-- Não altera dados. Para desfazer: select cron.unschedule('send-push-exit-hourly');

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'send-push-exit-hourly';
exception when others then
  null;
end $$;

select cron.schedule(
  'send-push-exit-hourly',
  '17 * * * *',
  $$
  select net.http_post(
    url := 'https://cwtallnetgodoacuoaow.supabase.co/functions/v1/send-push-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := '{"mode":"exit"}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);
