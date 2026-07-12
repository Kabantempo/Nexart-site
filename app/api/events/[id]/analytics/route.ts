import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('status')
      .eq('event_id', params.id)

    if (appsError) throw appsError

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('stand_count')
      .eq('id', params.id)
      .single()

    if (eventError) throw eventError

    const accepted = apps.filter(a => a.status === 'accepted').length
    const pending = apps.filter(a => a.status === 'pending').length
    const refused = apps.filter(a => a.status === 'refused').length
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
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('Analytics error:', { error: errorMsg, timestamp: new Date().toISOString() })
    return NextResponse.json(
      { error: 'Erreur chargement stats', details: errorMsg },
      { status: 500 }
    )
  }
}
