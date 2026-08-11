-- Add missing fields to creator_profiles: phone, social networks, price range, legal status

ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS phone            text,
  ADD COLUMN IF NOT EXISTS facebook         text,
  ADD COLUMN IF NOT EXISTS tiktok           text,
  ADD COLUMN IF NOT EXISTS price_min        integer,
  ADD COLUMN IF NOT EXISTS price_max        integer,
  ADD COLUMN IF NOT EXISTS legal_status     text;
