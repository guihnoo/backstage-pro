-- Adiciona colunas extras ao user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS financial_visibility boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false;
