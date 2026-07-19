CREATE TABLE IF NOT EXISTS creator_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  siret text NOT NULL,
  document_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_verifications_creator_id ON creator_verifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_verifications_status ON creator_verifications(status);
