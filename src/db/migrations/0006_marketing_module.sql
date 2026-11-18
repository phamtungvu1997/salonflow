-- M14/MKT: Marketing module tables (Settings, Discount Codes, Dynamic Price Changes, Waiting List, Filter Groups).
-- Invariant: price_change_rules and waiting_list_entries never write to resource_allocations or block staff slots.

CREATE TABLE IF NOT EXISTS salon_marketing_settings (
  salon_id text PRIMARY KEY REFERENCES salons(id),
  marketing_feature_enabled boolean NOT NULL DEFAULT true,
  last_minute_enabled boolean NOT NULL DEFAULT true,
  last_minute_percent integer NOT NULL DEFAULT 15 CHECK (last_minute_percent >= 5 AND last_minute_percent <= 80),
  last_minute_hours integer NOT NULL DEFAULT 2 CHECK (last_minute_hours >= 1 AND last_minute_hours <= 72),
  dynamic_pricing_enabled boolean NOT NULL DEFAULT true,
  rebook_reminder_enabled boolean NOT NULL DEFAULT true,
  rebook_reminder_service_ids text[] NOT NULL DEFAULT ARRAY['svc_mani','svc_mani_classic','svc_pedi','svc_spa_pedi','svc_shellac','svc_shellac_french','svc_biab'],
  waiting_list_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS discount_codes (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'special_events',
  percentage integer NOT NULL DEFAULT 15 CHECK (percentage > 0 AND percentage <= 90),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  expiration_mode text NOT NULL DEFAULT 'never',
  one_time_per_customer boolean NOT NULL DEFAULT false,
  limit_total_uses boolean NOT NULL DEFAULT false,
  specific_services_only boolean NOT NULL DEFAULT false,
  used_count integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, code)
);

CREATE TABLE IF NOT EXISTS price_change_rules (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  change_type text NOT NULL DEFAULT 'discount' CHECK (change_type IN ('discount', 'increase')),
  percentage integer NOT NULL DEFAULT 10 CHECK (percentage > 0 AND percentage <= 90),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  repeat_enabled boolean NOT NULL DEFAULT false,
  repeat_frequency text NOT NULL DEFAULT 'weekly',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS waiting_list_entries (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  customer_id text REFERENCES customers(id),
  customer_name text NOT NULL,
  service_id text REFERENCES services(id),
  service_name text NOT NULL DEFAULT '-',
  duration_minutes integer NOT NULL DEFAULT 60,
  staff_id text REFERENCES staff(id),
  staff_name text NOT NULL DEFAULT 'Keine Präferenz',
  date_mode text NOT NULL DEFAULT 'specific_date',
  preferred_date text NOT NULL,
  note text,
  notification_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_filter_groups (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  name text NOT NULL,
  filters_used integer NOT NULL DEFAULT 1,
  criteria_label text NOT NULL DEFAULT 'Stammkundinnen',
  created_at timestamptz NOT NULL DEFAULT now()
);
