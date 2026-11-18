DROP INDEX IF EXISTS outbox_events_salon_sequence_idx;

ALTER TABLE outbox_events
  DROP COLUMN IF EXISTS delivered_at;

ALTER TABLE outbox_events
  DROP COLUMN IF EXISTS sequence_id;

DROP SEQUENCE IF EXISTS outbox_events_sequence_id_seq;
