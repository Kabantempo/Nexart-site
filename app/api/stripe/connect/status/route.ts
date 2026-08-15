export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = getAdminClient()
  const { data } = await (admin as any)
    .from('organizer_profiles')
    .select('stripe_account_id, stripe_connect_status, stripe_connect_onboarded_at')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    stripe_account_id: data?.stripe_account_id ?? null,
    status: data?.stripe_connect_status ?? 'none',
    onboarded_at: data?.stripe_connect_onboarded_at ?? null,
  })
}
