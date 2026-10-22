-- 043: Google Agenda — opções por usuário, sincronização automática e "o que mudou"
--
-- 1. Opções no Perfil (user_settings):
--    google_push_enabled        → enviar os trabalhos do app para o Google
--    google_import_enabled      → trazer shows do Google para a agenda (desligado por padrão:
--                                 só entra o que o usuário escolher, nunca compromisso pessoal)
--    google_import_calendar_id  → de qual agenda do Google vêm os shows
--    google_import_keywords     → (opcional) só trazer se o nome tiver uma dessas palavras
--    google_busy_check_enabled  → avisar no "Novo trabalho" se o dia está ocupado no Google
--    google_last_sync_error     → último erro da sincronização automática (mostrado no Perfil)
--
-- 2. events.updated_at passa a mudar sozinho a cada edição de verdade (o app nunca atualizava),
--    para a sincronização mandar ao Google só os trabalhos que mudaram. Mudanças só nas colunas
--    google_* não contam, senão o próprio envio marcaria o trabalho como alterado de novo.
--
-- 3. events.google_origin = 'google' marca o trabalho que veio de um evento do Google (de outra
--    pessoa ou da agenda de shows). Nesses, o app só ajusta data/horário/local no Google e nunca
--    reescreve o título ou a descrição de quem criou.
--
-- 4. A importação antiga gravava status 'confirmado' (português); o app usa 'confirmed'.
--    Esses registros são justamente os que vieram do Google.

alter table public.events
  add column if not exists google_origin text;

alter table public.user_settings
  add column if not exists google_push_enabled boolean not null default true,
  add column if not exists google_import_enabled boolean not null default false,
  add column if not exists google_import_calendar_id text,
  add column if not exists google_import_keywords text,
  add column if not exists google_busy_check_enabled boolean not null default true,
  add column if not exists google_last_sync_error text;

-- Antes do gatilho, para não marcar esses trabalhos como "alterados".
update public.events
   set status = 'confirmed',
       google_origin = 'google'
 where status = 'confirmado';

create or replace function public.events_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ignored text[] := array['updated_at', 'google_event_id', 'google_calendar_id', 'google_synced_at', 'google_origin'];
begin
  if (to_jsonb(new) - ignored) is distinct from (to_jsonb(old) - ignored) then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.events_touch_updated_at();

-- A sincronização automática percorre só quem está conectado.
create index if not exists user_settings_google_connected_idx
  on public.user_settings (user_id)
  where google_calendar_connected;
