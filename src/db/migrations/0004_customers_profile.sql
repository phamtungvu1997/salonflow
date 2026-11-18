-- M08/CUS: Extended customer profile fields for SalonFlow Customers module reconstruction.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS phone_landline text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS address_line text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS labels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_info text,
  ADD COLUMN IF NOT EXISTS invoice_info text,
  ADD COLUMN IF NOT EXISTS appointment_warning text,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_reminders_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_reminders_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS birthday_wishes_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS feedback_requests_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS rebook_reminders_opt_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
