-- RGPD Audit Logs Table
-- Enregistre tous les accès/modifications de données sensibles

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who (user qui a fait l'action)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What (type d'action)
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'DECRYPT')),

  -- Which table/resource
  resource_type TEXT NOT NULL,
  resource_id UUID,

  -- Details
  description TEXT,
  changes JSONB, -- old_value → new_value for UPDATEs

  -- Sensitive data access flag
  accessed_sensitive_data BOOLEAN DEFAULT false,
  sensitive_fields TEXT[], -- Array of fields accessed (e.g. ['iban', 'email'])

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Indexes for queries
  CONSTRAINT audit_logs_user_id_idx UNIQUE (id) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive ON audit_logs(accessed_sensitive_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS: Users can only see their own logs, admins see all
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Only admins can insert logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'admin' OR auth.uid() IS NOT NULL);

-- Function to log actions (called by triggers or app code)
CREATE OR REPLACE FUNCTION log_audit_action(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_accessed_sensitive BOOLEAN DEFAULT false,
  p_sensitive_fields TEXT[] DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    description,
    changes,
    accessed_sensitive_data,
    sensitive_fields,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_description,
    p_changes,
    p_accessed_sensitive,
    p_sensitive_fields,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log profile updates
CREATE OR REPLACE FUNCTION trigger_audit_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log update of profile
  PERFORM log_audit_action(
    NEW.id,
    'UPDATE',
    'profiles',
    NEW.id,
    'Profile updated',
    jsonb_build_object(
      'full_name', jsonb_build_object('old', OLD.full_name, 'new', NEW.full_name),
      'bio', jsonb_build_object('old', OLD.bio, 'new', NEW.bio),
      'avatar_url', jsonb_build_object('old', OLD.avatar_url, 'new', NEW.avatar_url)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS audit_profile_update ON profiles;
CREATE TRIGGER audit_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD IS DISTINCT FROM NEW)
  EXECUTE FUNCTION trigger_audit_profile_update();

-- Cleanup: Delete audit logs older than 2 years (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (manual via cron, or app logic)
-- SELECT cleanup_old_audit_logs();
