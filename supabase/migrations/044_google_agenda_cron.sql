-- 044: Google Agenda sincroniza sozinho a cada 15 minutos
-- Pré-requisitos: migração 043 aplicada e a função google-calendar publicada com a ação "sync-all".
-- Usa o mesmo segredo do Vault (service_role_key) do cron de avisos (027).
-- O timeout maior que o padrão (5 s) deixa a rodada terminar com vários usuários conectados.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'google-agenda-sync';
exception when others then
  null;
end $$;

select cron.schedule(
  'google-agenda-sync',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://cwtallnetgodoacuoaow.supabase.co/functions/v1/google-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1)
    ),
    body := '{"action":"sync-all"}'::jsonb,
    timeout_milliseconds := 120000
  ) as request_id;
  $$
);
