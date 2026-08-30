-- Fix: enable RLS on referrals table (was public without RLS)
-- All writes go through service role (admin client) in API routes → no client policy needed
-- Read policy: users can only see their own referrals (as referrer or referee)

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can see referrals they created
CREATE POLICY "referrals_select_own"
  ON referrals
  FOR SELECT
  USING (
    auth.uid() = referrer_id
    OR auth.uid() = referee_id
  );

-- No INSERT/UPDATE/DELETE from client — only via service role (admin client bypasses RLS)
