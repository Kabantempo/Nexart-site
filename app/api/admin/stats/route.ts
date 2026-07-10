import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Total events
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')

    // Total reports
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })

    // Open reports
    const { count: openReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    // Total applications
    const { count: totalApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })

    // Accepted applications
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
