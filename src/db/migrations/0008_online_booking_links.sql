-- Online Bookings settings extensions + persistent public booking links / custom widgets.
-- Reuses existing Booking Engine, services, staff, shifts, absences, and outbox.

ALTER TABLE salon_settings
  ADD COLUMN IF NOT EXISTS online_widget_language text NOT NULL DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS online_booking_option text NOT NULL DEFAULT 'bookings',
  ADD COLUMN IF NOT EXISTS online_customer_scope text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS online_staff_choice_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_staff_first_step boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_assign_in_order boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_allow_multi_service boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_highlight_top_services boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_top_service_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS online_min_notice_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS online_prevent_gaps boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_allow_waitlist boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_request_address boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_request_birth_date boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_allow_newsletter boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_show_terms_link boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_show_privacy_link boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_schedule_view text NOT NULL DEFAULT 'week',
  ADD COLUMN IF NOT EXISTS online_allow_check_appointments boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS online_show_custom_alert boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_custom_alert_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS online_analytics_id text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS online_share_mode text NOT NULL DEFAULT 'button',
  ADD COLUMN IF NOT EXISTS online_button_position text NOT NULL DEFAULT 'right';

CREATE TABLE IF NOT EXISTS public_booking_links (
  id text PRIMARY KEY,
  token text NOT NULL UNIQUE,
  salon_id text NOT NULL REFERENCES salons(id),
  name text NOT NULL DEFAULT 'Standard-Buchungslink',
  is_default boolean NOT NULL DEFAULT false,
  share_format text NOT NULL DEFAULT 'link',
  all_services boolean NOT NULL DEFAULT true,
  service_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  all_staff boolean NOT NULL DEFAULT true,
  staff_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_booking_links_salon_idx
  ON public_booking_links (salon_id, active);

CREATE TABLE IF NOT EXISTS public_booking_requests (
  id text PRIMARY KEY,
  salon_id text NOT NULL REFERENCES salons(id),
  link_id text NOT NULL REFERENCES public_booking_links(id),
  customer_id text NOT NULL REFERENCES customers(id),
  service_id text NOT NULL REFERENCES services(id),
  staff_id text NOT NULL REFERENCES staff(id),
  requested_date text NOT NULL,
  requested_start text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
