-- Add portfolio_grid column to creator_profiles
-- Stores grid items with url, colSpan and rowSpan (replaces portfolio_images for grid layout)
ALTER TABLE creator_profiles
ADD COLUMN IF NOT EXISTS portfolio_grid jsonb DEFAULT '[]'::jsonb;
