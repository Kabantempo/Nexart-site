export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function getAuthUser(req: NextRequest) {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error } = await anon.auth.getUser(header.slice(7))
    if (error || !user) return null
    return user
  } catch { return null }
}

// POST — save a push subscription for the authenticated user
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { validate: v, pushSubscribeSchema } = await import('@/lib/validate')
    const { data: parsed, error: validErr } = v(pushSubscribeSchema, await req.json())
    if (validErr) return validErr
    const { endpoint, keys } = parsed.subscription

    const admin = getAdminClient()
    const { error } = await admin.from('push_subscriptions').upsert(
      { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'user_id,endpoint' }
    )
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('❌ Push subscribe error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: (error as Error)?.message }, { status: 500 })
  }
}

// DELETE — remove a push subscription
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { endpoint } = await req.json()
    const admin = getAdminClient()
    await admin.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error)?.message }, { status: 500 })
  }
}
