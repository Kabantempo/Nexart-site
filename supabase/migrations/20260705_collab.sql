-- Collaboration feature
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS open_to_collab boolean NOT NULL DEFAULT false;
