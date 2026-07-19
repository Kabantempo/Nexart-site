export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendMail } from '@/lib/mailer'

// POST: Daily cron — notify users with saved searches of new matching events
// Called daily by EasyCron: POST https://nexart.fr/api/cron/saved-searches-notify
// Header: Authorization: Bearer <CRON_SECRET_TOKEN>
export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()
  let notified = 0
  let errors = 0

  try {
    // Get all saved searches with email notifications enabled
    const { data: searches, error: searchErr } = await (admin as any)
      .from('saved_searches')
      .select('id, user_id, label, disciplines, city, region, notify_email, last_notified_at')
      .eq('notify_email', true)

    if (searchErr) throw searchErr
    if (!searches?.length) return NextResponse.json({ ok: true, notified: 0 })

    // Get published events from last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: newEvents, error: eventsErr } = await (admin as any)
      .from('events')
      .select('id, title, city, region, discipline_tags, start_date')
      .eq('status', 'published')
      .gte('created_at', since)

    if (eventsErr) throw eventsErr
    if (!newEvents?.length) return NextResponse.json({ ok: true, notified: 0, reason: 'no new events' })

    // Group searches by user to send one email per user
    const userSearches: Record<string, typeof searches> = {}
    for (const s of searches) {
      if (!userSearches[s.user_id]) userSearches[s.user_id] = []
      userSearches[s.user_id].push(s)
    }

    for (const [userId, userSavedSearches] of Object.entries(userSearches)) {
      const matches: { search: (typeof searches)[0]; events: typeof newEvents }[] = []

      for (const search of userSavedSearches) {
        const matchingEvents = newEvents.filter((ev: any) => {
          const disciplineMatch = !search.disciplines?.length ||
            search.disciplines.some((d: string) => ev.discipline_tags?.includes(d))
          const cityMatch = !search.city || ev.city?.toLowerCase().includes(search.city.toLowerCase())
          const regionMatch = !search.region || ev.region?.toLowerCase() === search.region.toLowerCase()
          return disciplineMatch && (cityMatch || regionMatch)
        })

        if (matchingEvents.length > 0) {
          matches.push({ search, events: matchingEvents })
        }
      }

      if (!matches.length) continue

      // Get user email
      try {
        const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
        if (!authUser?.email || !process.env.SMTP_PASS) continue

        const eventLines = matches.flatMap(({ search, events }) =>
          events.map((ev: any) =>
            `<li><strong>${ev.title}</strong> — ${ev.city || ev.region || ''}
             <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/events/${ev.id}">Voir l'événement</a>
             <small>(alerte: ${search.label})</small></li>`
          )
        ).join('')

        await sendMail({
          to: authUser.email,
          subject: `🔔 Nouveaux marchés correspondent à vos alertes — Nexart`,
          html: `
            <h2>Nouvelles opportunités pour vous !</h2>
            <p>De nouveaux événements correspondent à vos recherches sauvegardées :</p>
            <ul>${eventLines}</ul>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/search">Voir toutes les opportunités</a></p>
            <hr><small>Pour gérer vos alertes, rendez-vous dans vos <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/settings">paramètres</a>.</small>
          `,
        })

        // Update last_notified_at for these searches
        const searchIds = matches.map(m => m.search.id)
        await (admin as any)
          .from('saved_searches')
          .update({ last_notified_at: new Date().toISOString() })
          .in('id', searchIds)

        notified++
      } catch (err) {
        console.error(`[saved-searches-notify] Error for user ${userId}:`, err)
        errors++
      }
    }

    return NextResponse.json({ ok: true, notified, errors })
  } catch (err) {
    console.error('[saved-searches-notify]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
