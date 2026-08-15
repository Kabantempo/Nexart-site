ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_status text DEFAULT 'none'
    CHECK (stripe_connect_status IN ('none','pending','active','restricted')),
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_org_profiles_stripe_account
  ON organizer_profiles(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
