-- Cachê diário padrão por cliente (usado ao criar eventos e badge na lista)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS default_daily_cache numeric DEFAULT 0;
