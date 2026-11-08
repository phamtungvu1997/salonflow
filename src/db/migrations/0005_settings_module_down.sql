DROP TABLE IF EXISTS salon_settings;

ALTER TABLE service_categories
  DROP COLUMN IF EXISTS salon_id,
  DROP COLUMN IF EXISTS sort_order;

ALTER TABLE staff
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS gender,
  DROP COLUMN IF EXISTS bookable_online,
  DROP COLUMN IF EXISTS sort_order;
