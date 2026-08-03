CREATE TABLE IF NOT EXISTS creator_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS creator_notes_creator_id_unique ON creator_notes(creator_id);

ALTER TABLE creator_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_own_notes" ON creator_notes
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
