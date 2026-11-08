-- NS-017 booking engine: idempotency fingerprint, absence rows, transactional outbox.

ALTER TABLE idempotency_keys
  ADD COLUMN IF NOT EXISTS request_fingerprint text;

CREATE TABLE IF NOT EXISTS absences (
  id text PRIMARY KEY,
  staff_id text NOT NULL REFERENCES staff(id),
  salon_id text NOT NULL REFERENCES salons(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  CONSTRAINT absences_valid_range CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  aggregate_id text NOT NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbox_events_undelivered_idx
  ON outbox_events (created_at);
