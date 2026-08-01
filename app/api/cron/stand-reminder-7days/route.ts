export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendMail } from '@/lib/mailer'
import { emailStandReminder7Days } from '@/lib/email-templates'

async function handler(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const tokenParam = req.nextUrl.searchParams.get('token')
  const token = process.env.CRON_SECRET_TOKEN

  if (!token || (authHeader !== `Bearer ${token}` && tokenParam !== token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const from = new Date(in7Days)
  from.setHours(0, 0, 0, 0)
  const to = new Date(in7Days)
  to.setHours(23, 59, 59, 999)

  let sent = 0, errors = 0

  try {
    // Find accepted+paid applications for events starting in exactly 7 days
    const { data: apps, error } = await (admin as any)
      .from('applications')
      .select('id, creator_id, event_id, status, events(title, start_date)')
      .in('status', ['accepted', 'paid'])
      .gte('events.start_date', from.toISOString())
      .lte('events.start_date', to.toISOString())

    if (error) throw error
    if (!apps?.length) return NextResponse.json({ ok: true, sent: 0, reason: 'no_upcoming' })

    const creatorIds = [...new Set(apps.map((a: any) => a.creator_id))]
    const { data: profiles } = await (admin as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', creatorIds)

    const profileMap: Record<string, { full_name: string; email: string }> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    for (const app of apps ?? []) {
      const profile = profileMap[app.creator_id]
      if (!profile?.email) continue

      const event = app.events
      if (!event?.start_date) continue

      const eventDate = new Date(event.start_date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })

      try {
        await sendMail({
          to: profile.email,
          subject: `⏳ J-7 — ${event.title} commence dans une semaine !`,
          html: emailStandReminder7Days(
            profile.full_name?.split(' ')[0] ?? 'vous',
            event.title,
            eventDate,
            app.event_id,
          ),
        })
        sent++
      } catch (e) {
        console.error('[stand-reminder-7days] mail error', e)
        errors++
      }
    }

    return NextResponse.json({ ok: true, sent, errors })
  } catch (err: any) {
    console.error('[stand-reminder-7days] error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
