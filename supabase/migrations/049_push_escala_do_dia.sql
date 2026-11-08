-- 049 — Roadie fase 3: o aviso das 8h vira a "Escala do dia" (um aviso só com hoje, amanhã,
-- horas e pagamentos). A função send-push-digest com {"mode":"brief"} monta esse resumo.
-- O aviso das 18h continua com os lembretes separados. Não altera dados.
-- Para desfazer: reagendar 'send-push-digest-morning' com body '{}'.

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'send-push-digest-morning';
exception when others then
  null;
end $$;

select cron.schedule(
  'send-push-digest-morning',
  '0 11 * * *',
  $$
  select net.http_post(
    url := 'https://cwtallnetgodoacuoaow.supabase.co/functions/v1/send-push-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := '{"mode":"brief"}'::jsonb,
    timeout_milliseconds := 60000
  ) as request_id;
  $$
);
