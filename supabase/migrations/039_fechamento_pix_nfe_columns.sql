-- 039_fechamento_pix_nfe_columns.sql
-- Garante que todas as colunas usadas pelo Relatório PDF de Fechamento, PIX e NF-e
-- existam formalmente nas tabelas user_settings e events (idempotente).

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_key_type text DEFAULT 'CPF',
  ADD COLUMN IF NOT EXISTS cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS report_full_name text,
  ADD COLUMN IF NOT EXISTS report_subtitle text,
  ADD COLUMN IF NOT EXISTS report_profession text;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS nf_number text,
  ADD COLUMN IF NOT EXISTS nf_issued_at date,
  ADD COLUMN IF NOT EXISTS nfe_numero text,
  ADD COLUMN IF NOT EXISTS nfe_arquivo_url text,
  ADD COLUMN IF NOT EXISTS nfe_arquivo_nome text,
  ADD COLUMN IF NOT EXISTS nfe_analise jsonb;
