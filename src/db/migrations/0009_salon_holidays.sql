CREATE TABLE IF NOT EXISTS salon_holidays (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  name text NOT NULL,
  holiday_date date NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  UNIQUE (salon_id, holiday_date, name)
);

ALTER TABLE absences
  ADD COLUMN IF NOT EXISTS holiday_id text REFERENCES salon_holidays(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS absences_holiday_idx ON absences (holiday_id);
