-- ════════════════════════════════════════════════════════════
-- Nexart — Squelette Stripe
-- À exécuter dans Supabase SQL Editor quand Stripe est prêt
-- ════════════════════════════════════════════════════════════

-- 1. Colonnes Stripe sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier      TEXT NOT NULL DEFAULT 'free'
                                                  CHECK (subscription_tier IN ('free','boost','pro','premium','org_pro','org_studio')),
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT DEFAULT NULL
                                                  CHECK (subscription_status IN ('active','cancelled','past_due','trialing') OR subscription_status IS NULL),
  ADD COLUMN IF NOT EXISTS subscription_id        TEXT,
  ADD COLUMN IF NOT EXISTS subscription_ends_at   TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- 2. Table crédits pay-as-you-go
CREATE TABLE IF NOT EXISTS credits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('boost_candidature', 'event_creation')),
  amount      INT  NOT NULL CHECK (amount > 0),
  used        INT  NOT NULL DEFAULT 0 CHECK (used >= 0),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credits_user_id_idx ON credits(user_id);
CREATE INDEX IF NOT EXISTS credits_expires_at_idx ON credits(expires_at);

-- 3. Table transactions crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type        TEXT NOT NULL,
  payment_intent_id  TEXT,
  credits_bought     INT  NOT NULL,
  amount_paid        INT  NOT NULL, -- en centimes
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions(user_id);

-- 4. RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Chacun voit seulement ses propres crédits
CREATE POLICY "credits_own" ON credits FOR ALL USING (user_id = auth.uid());
CREATE POLICY "credit_tx_own" ON credit_transactions FOR ALL USING (user_id = auth.uid());

-- 5. Fonction utilitaire : crédits disponibles d'un utilisateur
CREATE OR REPLACE FUNCTION get_available_credits(p_user_id UUID, p_type TEXT)
RETURNS INT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(SUM(amount - used), 0)::INT
  FROM credits
  WHERE user_id = p_user_id
    AND credit_type = p_type
    AND expires_at > now()
    AND used < amount;
$$;

-- 6. Fonction utilitaire : consommer 1 crédit
CREATE OR REPLACE FUNCTION consume_credit(p_user_id UUID, p_type TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  credit_row RECORD;
BEGIN
  SELECT id, amount, used INTO credit_row
  FROM credits
  WHERE user_id = p_user_id
    AND credit_type = p_type
    AND expires_at > now()
    AND used < amount
  ORDER BY expires_at ASC
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  UPDATE credits SET used = used + 1 WHERE id = credit_row.id;
  RETURN TRUE;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- NOTES pour quand Stripe est actif :
-- 1. Créer les produits dans Stripe Dashboard
-- 2. Copier les Price IDs dans lib/stripe.ts (STRIPE_PRICES)
-- 3. Copier les Price IDs dans le webhook (PRICE_TO_TIER, PRICE_TO_CREDITS)
-- 4. Ajouter les vraies clés dans .env.local + Hostinger
-- 5. Configurer le webhook Stripe → https://nexart.fr/api/stripe/webhook
-- ════════════════════════════════════════════════════════════
