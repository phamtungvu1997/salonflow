CREATE TABLE IF NOT EXISTS salon_channels (
  salon_id text NOT NULL REFERENCES salons (id),
  channel text NOT NULL,
  simulator_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (salon_id, channel)
);
