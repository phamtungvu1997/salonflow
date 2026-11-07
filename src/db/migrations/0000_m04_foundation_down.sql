-- Rollback M04 foundation. Destructive — staging/dev only.

ALTER TABLE IF EXISTS resource_allocations DROP CONSTRAINT IF EXISTS resource_allocations_no_overlap;
DROP TABLE IF EXISTS resource_allocations CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS appointment_services CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff_services CASCADE;
DROP TABLE IF EXISTS salon_services CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS staff_user_links CASCADE;
DROP TABLE IF EXISTS user_salon_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS staff_salon_assignments CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS salons CASCADE;
DROP TYPE IF EXISTS appointment_status;
DROP TYPE IF EXISTS user_role;
