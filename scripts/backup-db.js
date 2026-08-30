// Backup Nexart DB → JSON via Supabase service role
// Usage: node scripts/backup-db.js
// Output: backup-nexart-AAAA-MM-JJ.json

const https = require('https')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cvqeysnymnkfxfithhsr.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SERVICE_ROLE_KEY) { console.error('❌ SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local'); process.exit(1) }
const fs = require('fs')

const TABLES = [
  'profiles',
  'creator_profiles',
  'organizer_profiles',
  'events',
  'applications',
  'conversations',
  'messages',
  'reviews',
  'itinerary',
  'products',
  'contracts',
  'posts',
  'post_likes',
  'follows',
  'favorite_events',
  'favorite_creators',
  'profile_views',
  'credits',
  'credit_transactions',
  'stand_payments',
  'contact_submissions',
  'newsletter_subscribers',
  'changelog',
  'saved_searches',
  'reports',
  'deleted_user_backups',
  'event_exhibitor_fields',
  'event_exhibitor_responses',
  'event_exhibitor_waitlist',
  'event_exhibitor_reminders',
  'event_tasks',
  'task_comments',
  'event_team',
  'event_checklists',
  'event_faqs',
  'event_generated_documents',
  'event_marketing_plan',
  'volunteer_availability',
  'volunteer_assignments',
  'admin_activity_log',
  'referrals',
  'creator_verifications',
]

function fetchTable(table) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}?select=*`)
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Accept-Profile': 'public',
        'Range': '0-9999',
      },
    }
    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ table, rows: Array.isArray(parsed) ? parsed : [], status: res.statusCode })
        } catch {
          resolve({ table, rows: [], error: data.slice(0, 200) })
        }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function backup() {
  console.log('Nexart DB Backup — ' + new Date().toISOString())
  console.log('Tables à sauvegarder :', TABLES.length)

  const result = { meta: { date: new Date().toISOString(), version: '1.5.0' }, tables: {} }
  let totalRows = 0
  let errors = []

  for (const table of TABLES) {
    process.stdout.write(`  ${table}... `)
    try {
      const { rows, error, status } = await fetchTable(table)
      if (error || status >= 400) {
        console.log(`⚠️  (${status ?? 'err'}) ignoré`)
        errors.push(table)
      } else {
        result.tables[table] = rows
        totalRows += rows.length
        console.log(`✅ ${rows.length} lignes`)
      }
    } catch (e) {
      console.log(`❌ ${e.message}`)
      errors.push(table)
    }
  }

  const date = new Date().toISOString().slice(0, 10)
  const filename = `backup-nexart-${date}.json`
  fs.writeFileSync(filename, JSON.stringify(result, null, 2))

  console.log(`\n✅ Backup terminé : ${filename}`)
  console.log(`   ${totalRows} lignes au total`)
  if (errors.length) console.log(`   Tables ignorées (n'existent pas encore) : ${errors.join(', ')}`)
}

backup().catch(console.error)
