import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — sauvegarder l'abonnement push d'un utilisateur
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await admin.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { subscription } = await req.json()
    if (!subscription?.endpoint) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })

    await admin.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('POST /api/push:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — supprimer l'abonnement
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await admin.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { endpoint } = await req.json()
    await admin.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/push:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
