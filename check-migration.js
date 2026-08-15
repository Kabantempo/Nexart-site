const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function check() {
  const { error } = await supabase
    .from('event_exhibitor_responses')
    .select('id')
    .limit(1)
  
  if (error?.code === 'PGRST116') {
    console.log('❌ Migration NOT applied')
    process.exit(1)
  } else if (!error) {
    console.log('✅ Migration APPLIED')
    process.exit(0)
  }
}

check()
