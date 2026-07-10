import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: List waitlist
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: waitlist, error } = await supabase
      .from('event_exhibitor_waitlist')
      .select(`
        id,
        exhibitor_id,
        position,
        notified_at,
        profiles!event_exhibitor_waitlist_exhibitor_id_fkey (full_name, email)
      `)
      .eq('event_id', params.id)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ waitlist: waitlist || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Handle exhibitor cancellation - move to waitlist and notify next
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { exhibitor_id, action } = body

    if (action === 'cancel') {
      // Mark as cancelled
      await supabase
        .from('event_exhibitor_responses')
        .update({ status: 'cancelled' })
        .eq('event_id', params.id)
        .eq('exhibitor_id', exhibitor_id)

      // Get next in waitlist
      const { data: nextInQueue } = await supabase
        .from('event_exhibitor_waitlist')
        .select('exhibitor_id, position')
        .eq('event_id', params.id)
        .order('position', { ascending: true })
        .limit(1)

      if (nextInQueue && nextInQueue.length > 0) {
        const next = nextInQueue[0]

        // Mark as notified
        await supabase
          .from('event_exhibitor_waitlist')
          .update({ notified_at: new Date().toISOString() })
          .eq('event_id', params.id)
          .eq('exhibitor_id', next.exhibitor_id)

        return NextResponse.json({
          success: true,
          message: 'Exhibitor cancelled, next notified',
          next_exhibitor_id: next.exhibitor_id
        })
      }

      return NextResponse.json({ success: true, message: 'Exhibitor cancelled' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
