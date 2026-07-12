import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const supabase = getAdminClient()
  try {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    const { count: totalReports } = await (supabase as any)
      .from('reports')
      .select('*', { count: 'exact', head: true })

    const { count: openReports } = await (supabase as any)
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    const { count: totalApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })

    const { count: acceptedApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')

    return NextResponse.json({
      stats: {
        total_users: totalUsers || 0,
        total_events: totalEvents || 0,
        total_reports: totalReports || 0,
        open_reports: openReports || 0,
        total_applications: totalApplications || 0,
        accepted_applications: acceptedApplications || 0,
        acceptance_rate: totalApplications
          ? ((acceptedApplications || 0) / (totalApplications || 1) * 100).toFixed(1)
          : '0'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
