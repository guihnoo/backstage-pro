-- Habilita Supabase Realtime nas tabelas core do Backstage Pro.
-- Permite sincronização instantânea entre dispositivos via postgres_changes.

do $$
declare
  t text;
begin
  foreach t in array array[
    'events',
    'clients',
    'expenses',
    'daily_work',
    'user_settings',
    'profiles'
  ]
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
    end;
  end loop;
end $$;

-- Payload completo em UPDATE/DELETE quando há filtro por user_id no canal.
alter table public.events replica identity full;
alter table public.clients replica identity full;
alter table public.expenses replica identity full;
alter table public.daily_work replica identity full;
alter table public.user_settings replica identity full;
alter table public.profiles replica identity full;
