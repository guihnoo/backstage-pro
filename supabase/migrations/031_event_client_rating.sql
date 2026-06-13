-- Avaliação do cliente por evento (1-5 estrelas + nota opcional)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS client_rating smallint CHECK (client_rating >= 1 AND client_rating <= 5),
  ADD COLUMN IF NOT EXISTS client_rating_notes text;
