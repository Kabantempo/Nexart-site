const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const RECOMMENDED = [
  'RESEND_API_KEY',
  'CRON_SECRET_TOKEN',
  'NEXT_PUBLIC_APP_URL',
  'DELETION_TOKEN_SECRET',
] as const

export function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }
  const absent = RECOMMENDED.filter(k => !process.env[k])
  if (absent.length > 0) {
    console.warn(`[env] Missing recommended env vars: ${absent.join(', ')}`)
  }
}

// Run at module load in server context
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (e) {
    console.error('[env]', (e as Error).message)
  }
}
