-- Historique des crédits
CREATE TABLE IF NOT EXISTS credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL, -- positif = gain, négatif = dépense
  type        TEXT NOT NULL CHECK (type IN ('gift','purchase','boost_application','boost_profile','monthly_refill','admin')),
  description TEXT,
  ref_id      UUID,             -- ex: application_id ou profile_id concerné
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credits_user_id_idx ON credits(user_id);

-- Colonne balance sur profiles (calculée via fonction)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credit_balance INTEGER NOT NULL DEFAULT 0;

-- Colonnes boost sur applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS boosted_at TIMESTAMPTZ;

-- Colonnes boost sur profiles (créateurs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_boosted_until TIMESTAMPTZ;

-- Fonction pour recalculer la balance (optionnel, pour vérification)
CREATE OR REPLACE FUNCTION get_credit_balance(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)::INTEGER FROM credits WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;

-- RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_own" ON credits FOR SELECT USING (user_id = auth.uid());
