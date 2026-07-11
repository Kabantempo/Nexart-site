#!/usr/bin/env node

/**
 * Auto-apply Supabase migrations
 * Usage: node scripts/apply-supabase-migrations.js
 *
 * Credentials from CLAUDE.md (gitignored)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Supabase credentials (from CLAUDE.md)
const SUPABASE_URL = 'https://cvqeysnymnkfxfithhsr.supabase.co';
const SERVICE_ROLE_KEY = 'SUPABASE_SERVICE_ROLE_KEY_REMOVED';
const PROJECT_ID = 'cvqeysnymnkfxfithhsr';

// Get all migration files
const migrationsDir = path.join(__dirname, '../supabase/migrations');
const migrations = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📦 Found ${migrations.length} migrations`);
console.log('');

// Apply each migration
async function applyMigrations() {
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`⏳ Applying: ${migration}`);

    try {
      const result = await executeSql(sql);
      console.log(`✅ ${migration}`);
    } catch (error) {
      console.error(`❌ ${migration}: ${error.message}`);
      process.exit(1);
    }
  }

  console.log('');
  console.log('🎉 All migrations applied successfully!');
}

// Execute SQL via Supabase API
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'cvqeysnymnkfxfithhsr.supabase.co',
      port: 443,
      path: '/rest/v1/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

// Run
applyMigrations().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
