ALTER TABLE google_calendar_connections
  ADD COLUMN IF NOT EXISTS scope text;
