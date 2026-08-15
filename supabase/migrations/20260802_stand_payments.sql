-- Stand payments table for revenue tracking
CREATE TABLE IF NOT EXISTS stand_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  organizer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  commission_cents integer NOT NULL DEFAULT 0,
  stripe_payment_id text UNIQUE,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stand_payments_creator ON stand_payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_event ON stand_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_organizer ON stand_payments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_stripe ON stand_payments(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_stand_payments_created ON stand_payments(created_at DESC);

-- Add refunded status support to applications if not already there
ALTER TABLE applications ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- RLS: admin can read all, creators/organizers see their own
ALTER TABLE stand_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_stand_payments" ON stand_payments
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "creator_own_stand_payments" ON stand_payments
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "organizer_own_stand_payments" ON stand_payments
  FOR SELECT USING (organizer_id = auth.uid());
