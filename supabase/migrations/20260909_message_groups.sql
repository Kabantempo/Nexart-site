-- Message groups for organizer broadcast messaging
CREATE TABLE IF NOT EXISTS message_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES message_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_groups_organizer ON message_groups(organizer_id);
CREATE INDEX IF NOT EXISTS idx_message_group_members_group ON message_group_members(group_id);

ALTER TABLE message_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer manages own groups" ON message_groups
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Members of group can view" ON message_group_members
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM message_groups g WHERE g.id = group_id AND g.organizer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM message_groups g WHERE g.id = group_id AND g.organizer_id = auth.uid())
  );
