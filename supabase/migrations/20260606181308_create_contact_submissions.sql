CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_insert_contact
  ON contact_submissions
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY allow_read_contact
  ON contact_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');
