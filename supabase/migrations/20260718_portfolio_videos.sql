-- Add portfolio_videos column to creator_profiles
ALTER TABLE creator_profiles
  ADD COLUMN IF NOT EXISTS portfolio_videos TEXT[] DEFAULT ARRAY[]::TEXT[];
