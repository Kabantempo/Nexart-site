export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const { data: prof } = await anon.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!prof?.is_admin) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getAdminClient()

    const [
      { count: totalUsers },
      { count: creatorCount },
      { count: orgaCount },
      { count: newWeek },
      { count: newMonth },
      { count: newToday },
      { count: totalEvents },
      { count: publishedEvents },
      { count: draftEvents },
      { count: closedEvents },
      { count: totalApps },
      { count: pendingApps },
      { count: acceptedApps },
      { count: refusedApps },
      { count: totalMessages },
      { count: siretVerified },
      { count: insuranceVerified },
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
      admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'organizer'),
      admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
      admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      admin.from('events').select('*', { count: 'exact', head: true }),
      admin.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      admin.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
      admin.from('events').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      admin.from('applications').select('*', { count: 'exact', head: true }),
      admin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      admin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      admin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'refused'),
      admin.from('messages').select('*', { count: 'exact', head: true }),
      admin.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('siret_verified', true),
      admin.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('insurance_verified', true),
    ])

    // Daily signups last 30 days
    const { data: recentProfiles } = await (admin as any)
      .from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
      .order('created_at', { ascending: true })

    const dailyMap: Record<string, number> = {}
    for (const p of recentProfiles ?? []) {
      const d = new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      dailyMap[d] = (dailyMap[d] ?? 0) + 1
    }
    const dailySignups = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    // Event types distribution
    const { data: eventsData } = await (admin as any)
      .from('events')
      .select('event_type')

    const typeMap: Record<string, number> = {}
    for (const e of eventsData ?? []) {
      if (e.event_type) typeMap[e.event_type] = (typeMap[e.event_type] ?? 0) + 1
    }
    const eventTypes = Object.entries(typeMap)
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)

    // Creators with siret pending
    const { count: siretPending } = await (admin as any)
      .from('creator_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('siret_verified', false)
      .not('siret_number', 'is', null)

    const { count: insurancePending } = await (admin as any)
      .from('creator_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('insurance_verified', false)
      .not('insurance_doc_url', 'is', null)

    // Creators with at least 1 application
    const { data: activeCreators } = await (admin as any)
      .from('applications')
      .select('creator_id')

    const uniqueActiveCreators = new Set((activeCreators ?? []).map((a: any) => a.creator_id)).size

    // Fill rate
    const { data: eventsWithStands } = await (admin as any)
      .from('events')
      .select('id, stand_count')
      .eq('status', 'published')
      .not('stand_count', 'is', null)

    const totalStands = (eventsWithStands ?? []).reduce((s: number, e: any) => s + (e.stand_count ?? 0), 0)

    return NextResponse.json({
      users: {
        total: totalUsers ?? 0,
        creators: creatorCount ?? 0,
        organizers: orgaCount ?? 0,
        new_week: newWeek ?? 0,
        new_month: newMonth ?? 0,
        new_today: newToday ?? 0,
      },
      events: {
        total: totalEvents ?? 0,
        published: publishedEvents ?? 0,
        draft: draftEvents ?? 0,
        closed: closedEvents ?? 0,
      },
      applications: {
        total: totalApps ?? 0,
        pending: pendingApps ?? 0,
        accepted: acceptedApps ?? 0,
        refused: refusedApps ?? 0,
      },
      dailySignups,
      eventTypes,
      verifications: {
        total: (creatorCount ?? 0),
        siret_verified: siretVerified ?? 0,
        siret_pending: siretPending ?? 0,
        insurance_verified: insuranceVerified ?? 0,
        insurance_pending: insurancePending ?? 0,
      },
      messages: { total: totalMessages ?? 0 },
      kpi: {
        conversionCreator: { active: uniqueActiveCreators, total: creatorCount ?? 0 },
        conversionOrganizer: { active: publishedEvents ?? 0, total: orgaCount ?? 0 },
        fillRate: { total_stands: totalStands, filled_stands: acceptedApps ?? 0 },
        liquidity: { avg_hours: null },
        retention30: { cohort_total: 0, retained: 0 },
        mrr: 0,
        churnRate: null,
        cac: null,
        ltv: null,
        gmv: 0,
        arpu: 0,
      },
    })
  } catch (error: unknown) {
    console.error('❌ Admin analytics error:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur chargement analytics' }, { status: 500 })
  }
}
