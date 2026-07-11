-- Reports table for content moderation
-- Users can report inappropriate posts, users, or events

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who reported
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What was reported (at least one must be set)
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reported_event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Report details
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'copyright', 'fraud', 'other')),
  description TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  action_taken TEXT,
  resolution_notes TEXT,

  -- Moderation context
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reason ON reports(reason);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- RLS: Users can view their own reports + admins see all
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT
  USING (auth.uid() = reporter_id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can update reports" ON reports
  FOR UPDATE
  USING (auth.jwt()->>'role' = 'admin');

-- Function to auto-notify admins when report created
CREATE OR REPLACE FUNCTION notify_admins_on_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Could send email or notification here
  -- For now just log to audit_logs
  PERFORM log_audit_action(
    NEW.reporter_id,
    'CREATE',
    'reports',
    NEW.id,
    'Report created: ' || NEW.reason
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_admins_report ON reports;
CREATE TRIGGER trigger_notify_admins_report
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_on_report();
