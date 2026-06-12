-- Tour interativo: marca quando o usuário concluiu (ou pulou) o tour do app.
alter table public.profiles
  add column if not exists tour_completed_at timestamptz;

comment on column public.profiles.tour_completed_at is
  'Timestamp de conclusão do tour guiado; null = ainda não viu.';
