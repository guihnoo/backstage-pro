ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS profile_complete boolean DEFAULT true;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_state text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision;

CREATE INDEX IF NOT EXISTS events_location_state_idx ON events(location_state) WHERE location_state IS NOT NULL;
