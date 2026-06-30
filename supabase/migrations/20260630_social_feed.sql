CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  images TEXT[] DEFAULT '{}',
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'guest_appearance', 'call_for_collab', 'tip', 'experience')),
  hashtags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY posts_select ON posts FOR SELECT USING (TRUE);
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY posts_delete ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_likes_select ON post_likes FOR SELECT USING (TRUE);
CREATE POLICY post_likes_insert ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY post_likes_delete ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, followed_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_select ON follows FOR SELECT USING (TRUE);
CREATE POLICY follows_insert ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_delete ON follows FOR DELETE USING (auth.uid() = follower_id);

CREATE OR REPLACE FUNCTION increment_post_likes(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id UUID)
RETURNS VOID AS $$
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
$$ LANGUAGE SQL SECURITY DEFINER;
