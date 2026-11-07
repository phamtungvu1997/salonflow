DROP TABLE IF EXISTS outbox_events;
DROP TABLE IF EXISTS absences;
ALTER TABLE idempotency_keys DROP COLUMN IF EXISTS request_fingerprint;
