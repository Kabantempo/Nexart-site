-- Historique des éditions passées pour les organisateurs
ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS past_events JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN organizer_profiles.past_events IS 'Historique des éditions passées: [{title, city, date, attendees?, photos?[]}]';
