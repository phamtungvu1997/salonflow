CREATE TABLE IF NOT EXISTS salon_online_profiles (
  salon_id text PRIMARY KEY REFERENCES salons (id),
  description text NOT NULL DEFAULT '',
  google_requested boolean NOT NULL DEFAULT false
);
