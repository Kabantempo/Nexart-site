-- ════════════════════════════════════════════════════════════
-- Nexart — Fonctionnalités complètes (juillet 2026)
-- Reviews, Itinéraire, Boutique, Contrats, Profil visiteur
-- ════════════════════════════════════════════════════════════

-- ── 1. Table reviews (bidirectionnelle) ──────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('creator', 'organizer')),
  rating        INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, reviewer_id, reviewed_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_select ON reviews FOR SELECT USING (TRUE);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE INDEX IF NOT EXISTS reviews_reviewed_id_idx ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS reviews_event_id_idx ON reviews(event_id);

-- ── 2. Table itinerary (carnet de route créateur) ────────────
CREATE TABLE IF NOT EXISTS itinerary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,           -- "Var du 10 au 20 juillet"
  region      TEXT,
  department  TEXT,
  city        TEXT,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE itinerary ENABLE ROW LEVEL SECURITY;
CREATE POLICY itinerary_select ON itinerary FOR SELECT USING (is_public OR auth.uid() = creator_id);
CREATE POLICY itinerary_insert ON itinerary FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY itinerary_update ON itinerary FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY itinerary_delete ON itinerary FOR DELETE USING (auth.uid() = creator_id);
CREATE INDEX IF NOT EXISTS itinerary_creator_id_idx ON itinerary(creator_id);
CREATE INDEX IF NOT EXISTS itinerary_dates_idx ON itinerary(start_date, end_date);

-- ── 3. Table products (boutique créateur) ────────────────────
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  price        INT  NOT NULL CHECK (price > 0), -- centimes
  images       TEXT[] DEFAULT '{}',
  category     TEXT,
  stock        INT  NOT NULL DEFAULT 1,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  -- Lien optionnel vers événement (synergie boutique ↔ événement)
  featured_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  featured_until    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select ON products FOR SELECT USING (is_available OR auth.uid() = creator_id);
CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY products_update ON products FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY products_delete ON products FOR DELETE USING (auth.uid() = creator_id);
CREATE INDEX IF NOT EXISTS products_creator_id_idx ON products(creator_id);
CREATE INDEX IF NOT EXISTS products_featured_event_idx ON products(featured_event_id) WHERE featured_event_id IS NOT NULL;

-- ── 4. Table contracts (contrats auto-générés) ───────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  creator_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organizer_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'archived')),
  pdf_url         TEXT,                          -- stockage Supabase Storage
  signed_at       TIMESTAMPTZ,
  signer_ip       TEXT,
  document_hash   TEXT,                          -- SHA-256 du PDF
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, creator_id)
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contracts_select ON contracts FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = organizer_id);
CREATE POLICY contracts_insert ON contracts FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY contracts_update ON contracts FOR UPDATE
  USING (auth.uid() = creator_id OR auth.uid() = organizer_id);
CREATE INDEX IF NOT EXISTS contracts_event_id_idx ON contracts(event_id);
CREATE INDEX IF NOT EXISTS contracts_creator_id_idx ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS contracts_organizer_id_idx ON contracts(organizer_id);

-- ── 5. Visitor profiles (extension de profiles) ──────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS visitor_city       TEXT,
  ADD COLUMN IF NOT EXISTS visitor_region     TEXT,
  ADD COLUMN IF NOT EXISTS visitor_categories TEXT[] DEFAULT '{}';

-- ── 6. Vue pratique : places restantes par événement ─────────
CREATE OR REPLACE VIEW event_occupancy AS
SELECT
  e.id            AS event_id,
  e.stand_count,
  COALESCE(a.accepted_count, 0)            AS accepted_count,
  GREATEST(e.stand_count - COALESCE(a.accepted_count, 0), 0) AS remaining_spots,
  CASE
    WHEN e.stand_count = 0 THEN 0
    ELSE ROUND(COALESCE(a.accepted_count, 0)::numeric / e.stand_count * 100)
  END AS fill_pct
FROM events e
LEFT JOIN (
  SELECT event_id, COUNT(*) AS accepted_count
  FROM applications
  WHERE status = 'accepted'
  GROUP BY event_id
) a ON a.event_id = e.id;

-- ── 7. Fonction : rating moyen d'un profil ───────────────────
CREATE OR REPLACE FUNCTION get_profile_rating(p_profile_id UUID)
RETURNS TABLE(avg_rating NUMERIC, review_count BIGINT) LANGUAGE SQL STABLE AS $$
  SELECT ROUND(AVG(rating)::numeric, 1), COUNT(*)
  FROM reviews
  WHERE reviewed_id = p_profile_id;
$$;
