CREATE TABLE IF NOT EXISTS favorite_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE favorite_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY fav_events_select ON favorite_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY fav_events_insert ON favorite_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY fav_events_delete ON favorite_events FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS favorite_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

ALTER TABLE favorite_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY fav_creators_select ON favorite_creators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY fav_creators_insert ON favorite_creators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY fav_creators_delete ON favorite_creators FOR DELETE USING (auth.uid() = user_id);
