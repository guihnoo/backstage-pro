-- Cron: alertas push 8h e 18h (horário de Brasília, UTC-3 → 11h e 21h UTC)
-- Pré-requisito: secret service_role_key no Vault (criado pelo script scripts/setup-push-cron.mjs)

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname in ('send-push-digest-morning', 'send-push-digest-evening');
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
    body := '{}'::jsonb
  ) as request_id;
  $$
);

select cron.schedule(
  'send-push-digest-evening',
  '0 21 * * *',
  $$
  select net.http_post(
    url := 'https://cwtallnetgodoacuoaow.supabase.co/functions/v1/send-push-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
