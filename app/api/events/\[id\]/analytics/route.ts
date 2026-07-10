import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const eventId = params.id

    // Get event info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, stand_count')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 })
    }

    // Get application stats
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('id, creator_id, status')
      .eq('event_id', eventId)

    if (appError) throw appError

    // Calculate stats
    const acceptedCount = applications?.filter(a => a.status === 'accepted').length || 0
    const pendingCount = applications?.filter(a => a.status === 'pending').length || 0
    const refusedCount = applications?.filter(a => a.status === 'refused').length || 0
    const totalApplications = applications?.length || 0
    const creatorDiversity = new Set(applications?.map(a => a.creator_id) || []).size
    const fillRate = event.stand_count > 0 ? Math.round((acceptedCount / event.stand_count) * 100) : 0

    return NextResponse.json({
      standCount: event.stand_count,
      applicationsCount: totalApplications,
      acceptedCount,
      pendingCount,
      refusedCount,
      fillRate,
      creatorDiversity,
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Erreur chargement analytics' }, { status: 500 })
  }
}
