-- 046: ideias novas (106–113) — colunas para as funções novas
--
-- #107 Só entrada e saída: como o usuário registra o trabalho.
--      profiles.work_log_mode = padrão do perfil ('completo' = ficha com horas/extras/alimentação,
--      'ponto' = só entrada e saída); events.work_log_mode = escolha do trabalho (null = segue o perfil).
-- #109 Várias funções com cachê diferente: profiles.role_rates = [{ category, daily_rate }].
--      A função de cada trabalho vai em events.category / events.category_label (já existiam e
--      estavam vazias nos 42 trabalhos em 22/10).
-- #112 Quilometragem: valor por km lembrado em user_settings.km_rate; km da despesa em
--      expenses.distance_km (o valor em reais continua em amount).
-- #113 Equipamento: "meu kit" em user_settings.equipment_kit = [{ id, text }];
--      por trabalho em events.equipment_items = [{ id, text, packed, returned }].
--
-- Tudo com padrão: o app de antes continua funcionando igual.
-- Desfazer: ver o fim do arquivo.

alter table public.profiles
  add column if not exists work_log_mode text not null default 'completo',
  add column if not exists role_rates jsonb not null default '[]'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_work_log_mode_check,
  add constraint profiles_work_log_mode_check check (work_log_mode in ('completo', 'ponto')),
  drop constraint if exists profiles_role_rates_array_check,
  add constraint profiles_role_rates_array_check check (jsonb_typeof(role_rates) = 'array');

alter table public.events
  add column if not exists work_log_mode text,
  add column if not exists equipment_items jsonb not null default '[]'::jsonb;

alter table public.events
  drop constraint if exists events_work_log_mode_check,
  add constraint events_work_log_mode_check check (work_log_mode is null or work_log_mode in ('completo', 'ponto')),
  drop constraint if exists events_equipment_items_array_check,
  add constraint events_equipment_items_array_check check (jsonb_typeof(equipment_items) = 'array');

alter table public.user_settings
  add column if not exists km_rate numeric(10, 2),
  add column if not exists equipment_kit jsonb not null default '[]'::jsonb;

alter table public.user_settings
  drop constraint if exists user_settings_km_rate_check,
  add constraint user_settings_km_rate_check check (km_rate is null or (km_rate >= 0 and km_rate <= 100)),
  drop constraint if exists user_settings_equipment_kit_array_check,
  add constraint user_settings_equipment_kit_array_check check (jsonb_typeof(equipment_kit) = 'array');

alter table public.expenses
  add column if not exists distance_km numeric(10, 1);

alter table public.expenses
  drop constraint if exists expenses_distance_km_check,
  add constraint expenses_distance_km_check check (distance_km is null or (distance_km >= 0 and distance_km <= 100000));

-- Desfazer:
-- alter table public.profiles drop column work_log_mode, drop column role_rates;
-- alter table public.events drop column work_log_mode, drop column equipment_items;
-- alter table public.user_settings drop column km_rate, drop column equipment_kit;
-- alter table public.expenses drop column distance_km;
