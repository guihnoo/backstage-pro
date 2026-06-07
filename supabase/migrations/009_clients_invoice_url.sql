-- Adiciona campo de portal de nota fiscal ao clients
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS invoice_portal_url text;
