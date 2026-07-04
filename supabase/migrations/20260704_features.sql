-- ─── Pricing models ───────────────────────────────────────────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS pricing_model TEXT NOT NULL DEFAULT 'flat'
    CHECK (pricing_model IN ('flat','variable','percent')),
  ADD COLUMN IF NOT EXISTS pricing_variable_min NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_variable_max NUMERIC,
  ADD COLUMN IF NOT EXISTS pricing_percent NUMERIC;

-- ─── Profile views ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_views_profile_id_idx ON profile_views(profile_id);

-- ─── Application limit tracking ───────────────────────────────────────────────
-- Nothing extra needed: we compute from applications table using created_at

-- ─── Verified badge fields ────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS organizer_verified BOOLEAN NOT NULL DEFAULT false;

-- Sync organizer_verified from creator_profiles.siret_verified for organizers
-- (run manually or via trigger)

-- ─── Organizer profile SIRET ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizer_profiles (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT,
  siret           TEXT,
  siret_verified  BOOLEAN NOT NULL DEFAULT false,
  website         TEXT,
  instagram       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Event analytics view ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW event_analytics AS
SELECT
  e.id AS event_id,
  e.organizer_id,
  e.title,
  e.start_date,
  e.stand_count,
  COUNT(a.id)                                     AS total_applications,
  COUNT(a.id) FILTER (WHERE a.status='pending')   AS pending_count,
  COUNT(a.id) FILTER (WHERE a.status='accepted')  AS accepted_count,
  COUNT(a.id) FILTER (WHERE a.status='refused')   AS refused_count,
  CASE WHEN e.stand_count > 0
    THEN ROUND(COUNT(a.id) FILTER (WHERE a.status='accepted')::NUMERIC / e.stand_count * 100, 1)
    ELSE 0
  END AS fill_rate_pct
FROM events e
LEFT JOIN applications a ON a.event_id = e.id
GROUP BY e.id;

-- ─── Creator analytics view ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW creator_analytics AS
SELECT
  p.id AS creator_id,
  p.full_name,
  COUNT(a.id)                                     AS total_applications,
  COUNT(a.id) FILTER (WHERE a.status='accepted')  AS accepted_count,
  COUNT(a.id) FILTER (WHERE a.status='refused')   AS refused_count,
  CASE WHEN COUNT(a.id) > 0
    THEN ROUND(COUNT(a.id) FILTER (WHERE a.status='accepted')::NUMERIC / COUNT(a.id) * 100, 1)
    ELSE 0
  END AS acceptance_rate_pct,
  COUNT(pv.id)                                    AS profile_views_total,
  COUNT(pv.id) FILTER (WHERE pv.viewed_at > now() - INTERVAL '30 days') AS profile_views_30d
FROM profiles p
LEFT JOIN applications a ON a.creator_id = p.id
LEFT JOIN profile_views pv ON pv.profile_id = p.id
WHERE p.role = 'creator'
GROUP BY p.id, p.full_name;
