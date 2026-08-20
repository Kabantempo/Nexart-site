-- Enable RLS on creator_profiles and add policies so users can manage their own row
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read creator profiles (needed for event pages, search, etc.)
DROP POLICY IF EXISTS creator_profiles_select ON creator_profiles;
CREATE POLICY creator_profiles_select ON creator_profiles
  FOR SELECT USING (true);

-- Allow a user to insert their own creator profile
DROP POLICY IF EXISTS creator_profiles_insert ON creator_profiles;
CREATE POLICY creator_profiles_insert ON creator_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow a user to update their own creator profile
DROP POLICY IF EXISTS creator_profiles_update ON creator_profiles;
CREATE POLICY creator_profiles_update ON creator_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow a user to delete their own creator profile
DROP POLICY IF EXISTS creator_profiles_delete ON creator_profiles;
CREATE POLICY creator_profiles_delete ON creator_profiles
  FOR DELETE USING (auth.uid() = user_id);
