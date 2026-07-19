-- Migration: enrichissement onboarding organisateur
-- Ajoute event_types, events_per_year, typical_capacity à organizer_profiles

ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS event_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS events_per_year text,
  ADD COLUMN IF NOT EXISTS typical_capacity text;
