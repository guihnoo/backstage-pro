-- 041_alimentacao_por_cliente.sql
-- Alimentacao varia por cliente (regra do dono, 17/10/2026):
--   'reembolso'      -> o cliente devolve; o valor entra no "a receber" e no fechamento
--   'pago_no_local'  -> o cliente paga na hora; so informativo, nao entra no "a receber"
--   'custo_proprio'  -> o tecnico paga do bolso; vira despesa (nao entra no "a receber")
-- O cliente tem o padrao; o evento pode trocar so para ele (null = usa o do cliente).
-- Idempotente. NAO altera dados existentes: tudo comeca vazio/zero.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS meal_policy text,
  ADD COLUMN IF NOT EXISTS meal_daily_value numeric(10,2);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meal_policy text;

ALTER TABLE public.daily_work
  ADD COLUMN IF NOT EXISTS meal_allowance numeric(10,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_meal_policy_chk') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_meal_policy_chk
      CHECK (meal_policy IS NULL OR meal_policy IN ('reembolso','pago_no_local','custo_proprio'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_meal_daily_value_chk') THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_meal_daily_value_chk
      CHECK (meal_daily_value IS NULL OR (meal_daily_value >= 0 AND meal_daily_value <= 10000));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_meal_policy_chk') THEN
    ALTER TABLE public.events ADD CONSTRAINT events_meal_policy_chk
      CHECK (meal_policy IS NULL OR meal_policy IN ('reembolso','pago_no_local','custo_proprio'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_work_meal_allowance_chk') THEN
    ALTER TABLE public.daily_work ADD CONSTRAINT daily_work_meal_allowance_chk
      CHECK (meal_allowance >= 0 AND meal_allowance <= 10000);
  END IF;
END $$;

COMMENT ON COLUMN public.clients.meal_policy IS 'Padrao de alimentacao do cliente: reembolso | pago_no_local | custo_proprio';
COMMENT ON COLUMN public.events.meal_policy IS 'Troca a alimentacao so neste evento (null = usa o padrao do cliente)';
COMMENT ON COLUMN public.daily_work.meal_allowance IS 'Valor de alimentacao do dia (so soma no a receber se a regra for reembolso)';
