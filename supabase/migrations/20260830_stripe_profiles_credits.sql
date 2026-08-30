-- Colonnes Stripe sur profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS subscription_tier      TEXT NOT NULL DEFAULT 'free'
                                                  CHECK (subscription_tier IN ('free','boost','pro','premium','org_pro','org_studio')),
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT DEFAULT NULL
                                                  CHECK (subscription_status IN ('active','cancelled','past_due','trialing') OR subscription_status IS NULL),
  ADD COLUMN IF NOT EXISTS subscription_id        TEXT,
  ADD COLUMN IF NOT EXISTS subscription_ends_at   TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Table transactions crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type        TEXT NOT NULL,
  payment_intent_id  TEXT,
  credits_bought     INT  NOT NULL,
  amount_paid        INT  NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_created_idx ON credit_transactions(created_at DESC);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_tx_own" ON credit_transactions FOR ALL USING (user_id = auth.uid());
