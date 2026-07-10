import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: List exhibitors
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('event_exhibitor_responses')
      .select(`
        id,
        exhibitor_id,
        response_data,
        status,
        tables_count,
        submitted_at,
        profiles!event_exhibitor_responses_exhibitor_id_fkey (full_name)
      `, { count: 'exact' })
      .eq('event_id', params.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      exhibitors: data || [],
      count,
      limit,
      offset,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Submit exhibitor response
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { response_data, tables_count } = body

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Upsert exhibitor response
    const { data, error } = await supabase
      .from('event_exhibitor_responses')
      .upsert({
        event_id: params.id,
        exhibitor_id: user.id,
        response_data,
        tables_count: tables_count || 1,
        status: 'pending'
      })
      .select()

    if (error) throw error

    // Call FAQ matching for auto-responder
    const applicationText = JSON.stringify(response_data).substring(0, 500)
    const matchResult = await matchFAQ(params.id, user.id, applicationText, response_data)

    return NextResponse.json({
      success: true,
      response: data?.[0],
      auto_responder: matchResult,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper: Call FAQ matching
async function matchFAQ(eventId: string, exhibitorId: string, text: string, data: any) {
  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/events/${eventId}/faqs/match`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibitor_id: exhibitorId,
          application_text: text,
          application_data: data,
        }),
      }
    )

    return await result.json()
  } catch (err) {
    console.error('FAQ matching failed:', err)
    return { matched: false, error: 'matching_failed' }
  }
}
