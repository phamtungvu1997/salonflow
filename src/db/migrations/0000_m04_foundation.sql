-- M04 foundation schema (forward). Apply with:
--   psql "$DATABASE_URL" -f src/db/migrations/0000_m04_foundation.sql
-- Rollback: src/db/migrations/0000_m04_foundation_down.sql

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('owner', 'manager', 'receptionist', 'technician');
CREATE TYPE appointment_status AS ENUM (
  'booked',
  'confirmed',
  'arrived',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TABLE salons (
  id text PRIMARY KEY,
  name text NOT NULL,
  city text NOT NULL,
  time_zone text NOT NULL DEFAULT 'Europe/Berlin',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff_salon_assignments (
  id text PRIMARY KEY,
  staff_id text NOT NULL REFERENCES staff(id),
  salon_id text NOT NULL REFERENCES salons(id),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_salon_roles (
  user_id text NOT NULL REFERENCES users(id),
  salon_id text NOT NULL REFERENCES salons(id),
  role user_role NOT NULL,
  PRIMARY KEY (user_id, salon_id, role)
);

CREATE TABLE staff_user_links (
  staff_id text PRIMARY KEY REFERENCES staff(id),
  user_id text NOT NULL UNIQUE REFERENCES users(id)
);

CREATE TABLE service_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text
);

CREATE TABLE services (
  id text PRIMARY KEY,
  category_id text REFERENCES service_categories(id),
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE salon_services (
  salon_id text NOT NULL REFERENCES salons(id),
  service_id text NOT NULL REFERENCES services(id),
  duration_minutes integer NOT NULL,
  price_cents integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (salon_id, service_id)
);

CREATE TABLE staff_services (
  staff_id text NOT NULL REFERENCES staff(id),
  service_id text NOT NULL REFERENCES services(id),
  PRIMARY KEY (staff_id, service_id)
);

CREATE TABLE customers (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  phone_normalized text,
  email text,
  home_salon_id text REFERENCES salons(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE appointments (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  customer_id text REFERENCES customers(id),
  status appointment_status NOT NULL DEFAULT 'booked',
  source text NOT NULL DEFAULT 'internal',
  version integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE appointment_services (
  id text PRIMARY KEY,
  appointment_id text NOT NULL REFERENCES appointments(id),
  sequence integer NOT NULL,
  staff_id text NOT NULL REFERENCES staff(id),
  title_snapshot text NOT NULL,
  duration_minutes_snapshot integer NOT NULL,
  price_cents_snapshot integer NOT NULL
);

CREATE TABLE resources (
  id text PRIMARY KEY,
  resource_type text NOT NULL,
  staff_id text REFERENCES staff(id),
  salon_id text REFERENCES salons(id),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE resource_allocations (
  id text PRIMARY KEY,
  resource_id text NOT NULL REFERENCES resources(id),
  appointment_id text REFERENCES appointments(id),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT resource_allocations_valid_range CHECK (end_at > start_at)
);

-- Half-open exclusive overlap guard for active allocations (enforced in M07 tests).
ALTER TABLE resource_allocations
  ADD COLUMN period tstzrange
  GENERATED ALWAYS AS (tstzrange(start_at, end_at, '[)')) STORED;

ALTER TABLE resource_allocations
  ADD CONSTRAINT resource_allocations_no_overlap
  EXCLUDE USING gist (
    resource_id WITH =,
    period WITH &&
  ) WHERE (active);
