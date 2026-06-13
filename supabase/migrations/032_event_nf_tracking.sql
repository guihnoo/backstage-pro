-- Rastreamento de Nota Fiscal por evento
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS nf_number text,       -- número da NF-e/NFS-e
  ADD COLUMN IF NOT EXISTS nf_issued_at date;     -- data de emissão
