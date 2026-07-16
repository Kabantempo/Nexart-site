export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:noreply@nexart.fr',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

// POST — send push notification to one or multiple users (cron/internal use)
// Header: Authorization: Bearer <CRON_SECRET_TOKEN>
export async function POST(req: NextRequest) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }

  try {
    const admin = getAdminClient()
    const { user_ids, title, body, url } = await req.json()

    if (!user_ids?.length || !title || !body) {
      return NextResponse.json({ error: 'user_ids, title et body requis' }, { status: 400 })
    }

    const { data: subs, error } = await admin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', user_ids)

    if (error) throw error
    if (!subs?.length) return NextResponse.json({ sent: 0, total: 0 })

    const payload = JSON.stringify({ title, body, url: url || '/', icon: '/icon-192.png', badge: '/icon-192.png' })

    let sent = 0
    const stale: string[] = []

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
          sent++
        } catch (err: unknown) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            stale.push(sub.id)
          }
        }
      })
    )

    // Clean expired subscriptions
    if (stale.length) {
      await admin.from('push_subscriptions').delete().in('id', stale)
    }
    return NextResponse.json({ sent, total: subs.length, stale_cleaned: stale.length })
  } catch (error: unknown) {
    console.error('❌ Push send error:', { error: error?.message })
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
