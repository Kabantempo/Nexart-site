import { createClient } from '@supabase/supabase-js'

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  serviceKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function checkAdminAccess(token: string): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return { isAdmin: false, error: 'Unauthorized' }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { isAdmin: false, error: 'Profile not found' }
    }

    return {
      isAdmin: profile.is_admin === true,
      userId: user.id
    }
  } catch (error: any) {
    return { isAdmin: false, error: error.message }
  }
}
