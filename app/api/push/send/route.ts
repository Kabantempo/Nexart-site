import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const { data: { user } } = await admin.auth.getUser(authHeader?.split(' ')[1])
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Seul admin ou service interne peut déclencher
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['admin', 'organizer', 'creator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { user_id, title, body, url } = await req.json()
    if (!user_id || !title) return NextResponse.json({ error: 'user_id and title required' }, { status: 400 })

    // Récupère toutes les subscriptions de l'utilisateur cible
    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user_id)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No subscriptions for this user' })
    }

    const payload = JSON.stringify({ title, body: body || '', url: url || 'https://nexart.fr' })
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    )

    // Nettoyer les subscriptions expirées (410 Gone)
    const expired = subscriptions.filter((_, i) => {
      const r = results[i]
      return r.status === 'rejected' && (r.reason as any)?.statusCode === 410
    })
    if (expired.length > 0) {
      await admin.from('push_subscriptions')
        .delete()
        .in('endpoint', expired.map((s) => s.endpoint))
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length
    return NextResponse.json({ sent, total: subscriptions.length })
  } catch (error: any) {
    console.error('POST /api/push/send:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
