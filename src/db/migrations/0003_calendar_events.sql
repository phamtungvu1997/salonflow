-- Calendar events for Absence, Chore, and Note modal tabs.

CREATE TABLE IF NOT EXISTS calendar_events (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  kind text NOT NULL CHECK (kind IN ('absence', 'chore', 'note')),
  description text NOT NULL,
  applies_to text NOT NULL CHECK (applies_to IN ('company', 'employee', 'tool')),
  staff_id text REFERENCES staff(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  repeat_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_events_valid_range CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS calendar_events_salon_start_idx
  ON calendar_events (salon_id, start_at);
