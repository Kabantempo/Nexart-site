-- Changelog / "Nouveautés" feature
-- Public what's-new entries surfaced by the WhatsNew button in the navbar.

CREATE TABLE IF NOT EXISTS changelog (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version    TEXT NOT NULL,                 -- ex: "1.2.0" (SemVer)
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  title      TEXT,                          -- ex: "Tableau exposants"
  entries    JSONB NOT NULL DEFAULT '[]',   -- [{ "type": "new", "text": "..." }]
  audience   TEXT[] NOT NULL DEFAULT '{all}', -- ex: {organizer} pour cibler un rôle
  published  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS changelog_published_date_idx
  ON changelog (published, date DESC);

ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;

-- Lecture publique des versions publiées uniquement (anon + authenticated)
CREATE POLICY changelog_public_read ON changelog
  FOR SELECT USING (published = true);

-- Aucune policy d'écriture : réservé au service-role / dashboard Supabase (équipe).

-- Seed : version de base V1
INSERT INTO changelog (version, date, title, entries, audience, published)
VALUES (
  '1.0.0',
  '2026-07-10',
  'Lancement de Nexart',
  '[
    { "type": "new", "text": "Créez votre profil créateur ou organisateur et candidatez aux événements." },
    { "type": "new", "text": "Messagerie en temps réel entre créateurs et organisateurs." },
    { "type": "new", "text": "Laissez et recevez des avis après chaque événement." },
    { "type": "new", "text": "Fil d''actualité pour partager vos créations et trouver des collabs." },
    { "type": "new", "text": "Carte des événements avec filtre par distance." }
  ]'::jsonb,
  '{all}',
  true
)
ON CONFLICT DO NOTHING;
