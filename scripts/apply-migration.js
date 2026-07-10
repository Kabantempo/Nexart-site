#!/usr/bin/env node

/**
 * Apply Supabase migration via Management API
 * Sends entire SQL as single transaction
 * Usage: node scripts/apply-migration.js <migration-file>
 */

const fs = require('fs')
const path = require('path')

const PROJECT_REF = 'cvqeysnymnkfxfithhsr'
const PAT = process.env.SUPABASE_PAT || 'use env var SUPABASE_PAT'

async function applyMigration(migrationFile) {
  if (!migrationFile) {
    console.log('Usage: node scripts/apply-migration.js supabase/migrations/20260710_v1_phase1_tables.sql')
    console.log('\nAvailable migrations:')
    const migrationsDir = path.join(__dirname, '../supabase/migrations/')
    fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .forEach(f => console.log(`  - ${f}`))
    process.exit(0)
  }

  const fullPath = path.join(__dirname, '..', migrationFile)

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(fullPath, 'utf-8')

  console.log(`📝 Applying migration: ${path.basename(fullPath)}\n`)
  console.log(`⏳ Sending SQL to Supabase...\n`)

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sql
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Migration failed:\n')
      console.error(data)
      process.exit(1)
    }

    console.log('✅ Migration applied successfully!\n')
    console.log('📊 Result:')
    console.log(JSON.stringify(data, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

const migrationFile = process.argv[2]
applyMigration(migrationFile)
