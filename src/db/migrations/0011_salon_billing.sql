CREATE TABLE IF NOT EXISTS salon_subscriptions (
  salon_id text PRIMARY KEY REFERENCES salons(id),
  plan_name text NOT NULL DEFAULT 'Studio',
  plan_cents integer NOT NULL DEFAULT 5900,
  included_seats integer NOT NULL DEFAULT 2,
  seat_cents integer NOT NULL DEFAULT 500,
  autopay_enabled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS salon_subscription_invoices (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  invoice_number text NOT NULL,
  period_start date NOT NULL,
  due_on date NOT NULL,
  plan_cents integer NOT NULL,
  seat_count integer NOT NULL,
  seat_cents integer NOT NULL,
  total_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'open',
  paid_at timestamptz,
  UNIQUE (salon_id, invoice_number)
);
