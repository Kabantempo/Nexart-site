#!/usr/bin/env node
// Reads PAT from CLAUDE.md and applies a specific migration file
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const claudeMd = fs.readFileSync(path.join(__dirname, '../../../.claude/CLAUDE.md'), 'utf-8')

// Extract PAT from CLAUDE.md
const patMatch = claudeMd.match(/Personal Access Token \(PAT\): `(sbp_[a-f0-9]+)`/)
  ?? claudeMd.match(/`(sbp_ed[a-f0-9]+)`/)
const pat = patMatch?.[1]
if (!pat) { console.error('PAT not found in CLAUDE.md'); process.exit(1) }

const projectId = 'cvqeysnymnkfxfithhsr'
const migrationFile = process.argv[2]
if (!migrationFile) { console.error('Usage: node run-migration.mjs <file.sql>'); process.exit(1) }

const sql = fs.readFileSync(migrationFile, 'utf-8')
console.log(`Applying: ${path.basename(migrationFile)}`)

const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${pat}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})

const text = await res.text()
if (res.ok) {
  console.log('✅ Migration applied successfully')
} else {
  console.error(`❌ Error ${res.status}: ${text}`)
  process.exit(1)
}
