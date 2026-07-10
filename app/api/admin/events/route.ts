import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'draft'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error, count } = await supabase
      .from('events')
      .select(`
        id,
        title,
        organizer_id,
        status,
        start_date,
        end_date,
        stand_count,
        created_at,
        profiles!events_organizer_id_fkey (full_name, email)
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_id, action } = body

    if (action === 'approve') {
      const { error } = await supabase
        .from('events')
        .update({ status: 'published' })
        .eq('id', event_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Event approved' })
    }

    if (action === 'reject') {
      const { error } = await supabase
        .from('events')
        .update({ status: 'closed' })
        .eq('id', event_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Event rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
