-- M11/M14/SET: Settings persistence for General, Company, Calendar, Staff, Service Categories & Online Booking.

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS bookable_online boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS salon_id text REFERENCES salons(id),
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS salon_settings (
  salon_id text PRIMARY KEY REFERENCES salons(id),
  language text NOT NULL DEFAULT 'de-DE',
  currency text NOT NULL DEFAULT 'EUR',
  time_zone text NOT NULL DEFAULT 'Europe/Berlin',
  week_start text NOT NULL DEFAULT 'monday',
  time_format text NOT NULL DEFAULT '24h',
  ip_restriction_enabled boolean NOT NULL DEFAULT false,
  ip_whitelist text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '22303',
  house_number text NOT NULL DEFAULT '3',
  address_line text NOT NULL DEFAULT 'Borgweg',
  city text NOT NULL DEFAULT 'Hamburg',
  phone text NOT NULL DEFAULT '+49 40 60950950',
  notification_email text NOT NULL DEFAULT 'info@jeannie-nagelstudio.de',
  billing_email text NOT NULL DEFAULT 'info@jeannie-nagelstudio.de',
  sms_sender text NOT NULL DEFAULT 'Jeannie',
  sms_notification_phone text NOT NULL DEFAULT '+49 1520 2384968',
  facebook_handle text NOT NULL DEFAULT '',
  instagram_handle text NOT NULL DEFAULT 'jeanniehamburg',
  slot_interval_minutes integer NOT NULL DEFAULT 15,
  appointment_color_mode text NOT NULL DEFAULT 'category',
  hide_unscheduled_staff boolean NOT NULL DEFAULT false,
  end_buffer_enabled boolean NOT NULL DEFAULT false,
  allow_online_cancel boolean NOT NULL DEFAULT true,
  online_cancel_lead_hours integer NOT NULL DEFAULT 1,
  allow_online_reschedule boolean NOT NULL DEFAULT true,
  online_reschedule_lead_hours integer NOT NULL DEFAULT 1,
  no_show_email_prompt boolean NOT NULL DEFAULT false,
  email_reminder_enabled boolean NOT NULL DEFAULT true,
  email_reminder_lead_hours integer NOT NULL DEFAULT 12,
  customer_labels text[] NOT NULL DEFAULT ARRAY['Favorit', 'Stammkundin'],
  custom_fields text[] NOT NULL DEFAULT ARRAY['Bevorzugte Nagelform'],
  online_booking_enabled boolean NOT NULL DEFAULT true,
  online_allow_staff_choice boolean NOT NULL DEFAULT true,
  online_show_price boolean NOT NULL DEFAULT true,
  online_show_duration boolean NOT NULL DEFAULT true,
  online_interval_minutes integer NOT NULL DEFAULT 60,
  online_advance_months integer NOT NULL DEFAULT 12,
  online_widget_color text NOT NULL DEFAULT '#18202c',
  updated_at timestamptz NOT NULL DEFAULT now()
);
