-- Alertes recherche sauvegardées
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label text NOT NULL,
  disciplines text[] DEFAULT ARRAY[]::text[],
  city text,
  region text,
  radius_km int DEFAULT 50,
  notify_email boolean DEFAULT true,
  notify_push boolean DEFAULT false,
  last_notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches_own" ON saved_searches
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
