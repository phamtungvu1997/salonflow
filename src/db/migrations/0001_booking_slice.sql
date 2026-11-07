-- Shifts, sessions, audit, and appointment instants for the first booking slice.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS color text;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS start_at timestamptz;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_at timestamptz;

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

CREATE TABLE IF NOT EXISTS weekly_shifts (
  id text PRIMARY KEY,
  staff_id text NOT NULL REFERENCES staff(id),
  salon_id text NOT NULL REFERENCES salons(id),
  iso_weekday integer NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
  start_minute integer NOT NULL CHECK (start_minute >= 0 AND start_minute < 1440),
  end_minute integer NOT NULL CHECK (end_minute > start_minute AND end_minute <= 1440)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS appointment_audit (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id),
  actor_user_id text REFERENCES users(id),
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  appointment_id text REFERENCES appointments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointments_salon_start_idx ON appointments (salon_id, start_at);
