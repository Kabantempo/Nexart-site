-- Fix: app/api/events/[id]/waitlist/route.ts référence une colonne `status`
-- (waiting/promoted) jamais créée dans les migrations d'origine, ce qui
-- fait échouer toutes les requêtes sur cette table (GET renvoie 500).
ALTER TABLE event_exhibitor_waitlist
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'waiting';

ALTER TABLE event_exhibitor_waitlist
  DROP CONSTRAINT IF EXISTS event_exhibitor_waitlist_status_check;

ALTER TABLE event_exhibitor_waitlist
  ADD CONSTRAINT event_exhibitor_waitlist_status_check
  CHECK (status IN ('waiting', 'promoted'));

CREATE INDEX IF NOT EXISTS idx_exhibitor_waitlist_status
  ON event_exhibitor_waitlist(event_id, status);
