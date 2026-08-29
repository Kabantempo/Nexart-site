-- Add page_settings column to creator_profiles
-- Already applied to production DB; this file documents the migration.
ALTER TABLE public.creator_profiles ADD COLUMN IF NOT EXISTS page_settings JSONB;
