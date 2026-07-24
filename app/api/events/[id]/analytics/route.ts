export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { data: apps, error: appsError } = await admin
      .from('applications')
      .select('status')
      .eq('event_id', params.id)

    if (appsError) throw appsError

    const { data: event, error: eventError } = await admin
      .from('events')
      .select('stand_count')
      .eq('id', params.id)
      .single()

    if (eventError) throw eventError

    const accepted = apps.filter(a => a.status === 'accepted').length
    const pending = apps.filter(a => a.status === 'pending').length
    const refused = apps.filter((a: any) => a.status === 'refused').length
    const total = apps.length
    const totalStands = event?.stand_count || 0

    return NextResponse.json({
      totalApplications: total,
      acceptedCount: accepted,
      pendingCount: pending,
      refusedCount: refused,
      fillRate: totalStands > 0 ? Math.round((accepted / totalStands) * 100) : 0,
      totalStands,
      acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
    })
  } catch (error: unknown) {
    console.error('Analytics error:', { error: (error instanceof Error ? error.message : String(error)), timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur chargement stats' }, { status: 500 })
  }
}
