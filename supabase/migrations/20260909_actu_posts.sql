-- Per-event activity thread: organizers and accepted applicants can post
CREATE TABLE IF NOT EXISTS actu_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actu_posts_event ON actu_posts(event_id, created_at DESC);

ALTER TABLE actu_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actu_posts_read" ON actu_posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM applications a WHERE a.event_id = actu_posts.event_id AND a.creator_id = auth.uid() AND a.status IN ('accepted','confirmed','awaiting_payment','paid'))
  );

CREATE POLICY "actu_posts_insert" ON actu_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM events e WHERE e.id = event_id AND e.organizer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM applications a WHERE a.event_id = actu_posts.event_id AND a.creator_id = auth.uid() AND a.status IN ('accepted','confirmed','awaiting_payment','paid'))
    )
  );
