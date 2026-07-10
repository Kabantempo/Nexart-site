import { createClient } from '@supabase/supabase-js'

let _admin: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error(`Supabase config missing: URL=${!!url}, KEY=${!!key}`)
    }

    _admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }
  return _admin
}
