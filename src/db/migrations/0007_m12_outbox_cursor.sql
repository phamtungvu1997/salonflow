-- M12: monotonic outbox cursor for salon-scoped SSE / poll reconnect replay.
-- delivered_at reserved for a later delivery worker; V1 uses cursor polling only.

ALTER TABLE outbox_events
  ADD COLUMN IF NOT EXISTS sequence_id bigserial;

ALTER TABLE outbox_events
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS outbox_events_salon_sequence_idx
  ON outbox_events (salon_id, sequence_id);
