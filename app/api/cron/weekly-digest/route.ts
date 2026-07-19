export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendMail } from '@/lib/mailer'

// POST: Weekly cron — send digest of new events to creators
// Called every Monday 08:00 UTC by EasyCron
// Header: Authorization: Bearer <CRON_SECRET_TOKEN>
export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }
  if (!process.env.SMTP_PASS) {
    return NextResponse.json({ ok: true, skipped: 'no_smtp' })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexart.fr'
  let sent = 0
  let errors = 0

  try {
    // Get creators who want weekly digest
    const { data: creators, error: creatorsErr } = await (admin as any)
      .from('creator_profiles')
      .select('user_id, city, region, disciplines, notify_weekly')
      .eq('notify_weekly', true)

    if (creatorsErr) throw creatorsErr
    if (!creators?.length) return NextResponse.json({ ok: true, sent: 0 })

    // Get creator emails from profiles
    const userIds = creators.map((c: any) => c.user_id)
    const { data: profiles } = await (admin as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    const profileMap: Record<string, { full_name: string; email: string }> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    // Get new published events from last 7 days
    const { data: newEvents } = await (admin as any)
      .from('events')
      .select('id, title, city, region, discipline_tags, start_date')
      .eq('status', 'published')
      .gte('created_at', since)
      .order('start_date', { ascending: true })
      .limit(100)

    if (!newEvents?.length) return NextResponse.json({ ok: true, sent: 0, reason: 'no_new_events' })

    for (const creator of creators) {
      const profile = profileMap[creator.user_id]
      if (!profile?.email) continue

      // Match events by region/city or discipline
      const matching = newEvents.filter((ev: any) => {
        const regionMatch = creator.region && ev.region === creator.region
        const cityMatch = creator.city && ev.city?.toLowerCase().includes(creator.city.toLowerCase())
        const disciplineMatch = creator.disciplines?.some((d: string) =>
          ev.discipline_tags?.some((t: string) => t.toLowerCase().includes(d.toLowerCase()))
        )
        return regionMatch || cityMatch || disciplineMatch
      }).slice(0, 5)

      if (!matching.length) continue

      const firstName = profile.full_name?.split(' ')[0] ?? 'vous'

      const eventRows = matching.map((ev: any) => {
        const date = ev.start_date
          ? new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : ''
        return `<li style="margin-bottom:8px"><a href="${appUrl}/events/${ev.id}" style="color:#6366F1;text-decoration:none;font-weight:600">${ev.title}</a>${ev.city ? ` — ${ev.city}` : ''}${date ? ` · ${date}` : ''}</li>`
      }).join('')

      const html = `
        <div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;padding:32px 16px;color:#1A1A1A">
          <div style="margin-bottom:24px">
            <span style="font-size:20px;font-weight:900;color:#6366F1">nexart</span>
          </div>
          <h2 style="font-size:20px;font-weight:700;margin-bottom:8px">🗓️ Les nouveautés de la semaine</h2>
          <p style="color:#6B7280;margin-bottom:20px">Bonjour ${firstName} ! Voici les nouveaux marchés publiés près de chez vous :</p>
          <ul style="padding-left:20px;margin-bottom:24px">${eventRows}</ul>
          <a href="${appUrl}/search" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#6366F1;color:#fff;text-decoration:none;font-weight:700;font-size:14px">
            Voir tous les événements →
          </a>
          <p style="margin-top:32px;font-size:12px;color:#9CA3AF">
            Pour ne plus recevoir ces emails, <a href="${appUrl}/settings" style="color:#9CA3AF">gérez vos préférences</a>.
          </p>
        </div>
      `

      try {
        await sendMail({
          to: profile.email,
          subject: '🗓️ Nouveaux marchés près de chez vous — Nexart',
          html,
        })
        sent++
      } catch {
        errors++
      }
    }

    return NextResponse.json({ ok: true, sent, errors })
  } catch (err: any) {
    console.error('[weekly-digest] error', err)
    return NextResponse.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}
