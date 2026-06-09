-- Google Calendar sync: tokens, event mapping, user settings

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS google_account_email text,
  ADD COLUMN IF NOT EXISTS google_last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS google_calendar_id text;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS google_event_id text,
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS google_synced_at timestamptz;

CREATE TABLE IF NOT EXISTS google_calendar_connections (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  access_token text,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE google_calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS events_google_event_id_idx ON events(google_event_id) WHERE google_event_id IS NOT NULL;
