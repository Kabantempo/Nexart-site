#!/usr/bin/env node

const { Client } = require('pg');

// Connection string for Supabase (you can get from dashboard)
// Format: postgresql://postgres:[password]@[host]:[port]/[database]

const client = new Client({
  host: 'cvqeysnymnkfxfithhsr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'Need password',
  ssl: { rejectUnauthorized: false },
});

const sql = `
-- RGPD: Soft-delete et backup
CREATE TABLE IF NOT EXISTS deleted_user_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  backup_data jsonb NOT NULL,
  deletion_requested_at timestamp DEFAULT now(),
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deleted_backups_user_id ON deleted_user_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_backups_deletion_requested_at ON deleted_user_backups(deletion_requested_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_hard_deleted boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_is_hard_deleted ON users(is_hard_deleted);

ALTER TABLE deleted_user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "deleted_backups_admin_only" ON deleted_user_backups
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
`;

async function apply() {
  try {
    console.log('⏳ Connecting to Supabase...');
    await client.connect();

    console.log('⏳ Applying SQL...');
    await client.query(sql);

    console.log('✅ SQL applied successfully!');
    console.log('📄 Documentation updated in: CLAUDE.md');
    console.log('📋 Migration file: supabase/migrations/20260727_rgpd_soft_delete.sql');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Alternative: Use Supabase SQL Editor');
    console.log('   https://supabase.com/dashboard/project/cvqeysnymnkfxfithhsr/sql/new');
  } finally {
    await client.end();
    process.exit(0);
  }
}

apply();
