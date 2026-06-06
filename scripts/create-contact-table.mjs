import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://cvqeysnymnkfxfithhsr.supabase.co',
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
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

        DROP POLICY IF EXISTS allow_insert_contact ON contact_submissions;
        DROP POLICY IF EXISTS allow_read_contact ON contact_submissions;

        CREATE POLICY allow_insert_contact
          ON contact_submissions
          FOR INSERT
          WITH CHECK (TRUE);

        CREATE POLICY allow_read_contact
          ON contact_submissions
          FOR SELECT
          USING (auth.role() = 'authenticated');
      `
    })

    if (error) console.log('Table exists or SQL RPC not available')
    else console.log('✓ Table contact_submissions créée')
  } catch (err) {
    console.error('Error:', err.message)
    console.log('\nManual creation required. Run this in Supabase SQL Editor:')
    console.log(`
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
    `)
  }
}

main()
