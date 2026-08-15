-- User settings preferences: notifications, visibility, language
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs  jsonb DEFAULT '{"messages":true,"applications":true,"reminders":true,"newsletter":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS profile_visibility  text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS preferred_language  text DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'en'));

-- Creator-specific: search radius (km)
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS travel_radius  integer DEFAULT 50;
