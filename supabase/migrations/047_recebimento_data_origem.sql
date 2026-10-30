-- 047 — Origem da data do recebimento.
-- Campo opcional: preserva a compatibilidade com registros e clientes existentes.
alter table public.events add column if not exists paid_date_meta jsonb;
comment on column public.events.paid_date_meta is
  'Origem da data de recebimento: source, basis, days e data anterior quando reconstruida. Nulo para registros antigos sem classificacao.';
