-- Préférence email résumé hebdomadaire pour les créateurs
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS notify_weekly BOOLEAN DEFAULT true;
