export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function requireOrganizer(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const { data: prof } = await anon
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()
  if (!prof || prof.role !== 'organizer') return null
  return { user, profile: prof }
}

export async function GET(req: NextRequest) {
  const auth = await requireOrganizer(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getAdminClient()
  const organizerId = auth.user.id

  try {
    // Fetch all events for this organizer
    const { data: events, error: eventsErr } = await supabase
      .from('events')
      .select('id, title, status, stand_count, start_date, end_date')
      .eq('organizer_id', organizerId)

    if (eventsErr) throw eventsErr

    const eventIds = (events || []).map(e => e.id)

    // Fetch all applications for organizer's events
    const { data: applications, error: appsErr } = eventIds.length > 0
      ? await supabase
          .from('applications')
          .select('id, event_id, creator_id, status')
          .in('event_id', eventIds)
      : { data: [], error: null }

    if (appsErr) throw appsErr

    const apps = applications || []

    // KPI aggregation
    const totalApplications = apps.length
    const accepted = apps.filter(a => a.status === 'accepted').length
    const refused = apps.filter(a => a.status === 'refused').length
    const pending = apps.filter(a => a.status === 'pending').length
    const acceptanceRate = totalApplications > 0
      ? Math.round((accepted / totalApplications) * 100)
      : 0

    // Events by status
    const eventsByStatus = {
      draft: (events || []).filter(e => e.status === 'draft').length,
      published: (events || []).filter(e => e.status === 'published').length,
      closed: (events || []).filter(e => e.status === 'closed').length,
    }

    // Applications per event (for bar chart)
    const applicationsPerEvent = (events || []).map(ev => {
      const evApps = apps.filter(a => a.event_id === ev.id)
      return {
        event_id: ev.id,
        title: ev.title,
        status: ev.status,
        stand_count: ev.stand_count,
        total: evApps.length,
        accepted: evApps.filter(a => a.status === 'accepted').length,
        refused: evApps.filter(a => a.status === 'refused').length,
        pending: evApps.filter(a => a.status === 'pending').length,
        fill_rate: ev.stand_count > 0
          ? Math.round((evApps.filter(a => a.status === 'accepted').length / ev.stand_count) * 100)
          : 0,
      }
    })

    // Profile views (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: views, error: viewsErr } = await supabase
      .from('profile_views')
      .select('viewed_at')
      .eq('profile_id', organizerId)
      .gte('viewed_at', thirtyDaysAgo.toISOString())

    if (viewsErr) throw viewsErr
    const profileViews = (views || []).length

    // Top disciplines from accepted creators
    const creatorIds = [...new Set(
      apps.filter(a => a.status === 'accepted').map(a => a.creator_id)
    )]

    let topDisciplines: { discipline: string; count: number }[] = []
    if (creatorIds.length > 0) {
      const { data: creatorProfs } = await supabase
        .from('creator_profiles')
        .select('disciplines')
        .in('id', creatorIds)

      const disciplineCount: Record<string, number> = {}
      for (const cp of creatorProfs || []) {
        for (const d of cp.disciplines || []) {
          disciplineCount[d] = (disciplineCount[d] || 0) + 1
        }
      }
      topDisciplines = Object.entries(disciplineCount)
        .map(([discipline, count]) => ({ discipline, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    }

    return NextResponse.json({
      kpi: {
        totalApplications,
        accepted,
        refused,
        pending,
        acceptanceRate,
        profileViews,
      },
      eventsByStatus,
      applicationsPerEvent,
      topDisciplines,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
