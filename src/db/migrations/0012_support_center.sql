CREATE TABLE IF NOT EXISTS support_entries (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons (id),
  kind text NOT NULL CHECK (kind IN ('idea', 'message')),
  title text NOT NULL,
  body text NOT NULL,
  author_user_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_entries_salon_idx
  ON support_entries (salon_id, created_at DESC);
