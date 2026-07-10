import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET: Check overdue exhibitors and send reminders (should be called by cron)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get event details
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Find exhibitors who are approved but haven't confirmed for X days
    const daysUntilReminder = 7 // configurable
    const daysAgo = new Date(Date.now() - daysUntilReminder * 24 * 60 * 60 * 1000).toISOString()

    const { data: overdue } = await supabase
      .from('event_exhibitor_responses')
      .select(`
        id,
        exhibitor_id,
        response_data,
        profiles!event_exhibitor_responses_exhibitor_id_fkey (email, full_name)
      `)
      .eq('event_id', params.id)
      .eq('status', 'approved')
      .lt('submitted_at', daysAgo)

    // Check which ones haven't been reminded
    const needsReminder = overdue || []
    let remindersSent = 0

    for (const exhibitor of needsReminder) {
      const { data: reminded } = await supabase
        .from('event_exhibitor_reminders')
        .select('id')
        .eq('event_id', params.id)
        .eq('exhibitor_id', exhibitor.exhibitor_id)
        .eq('reminder_number', 1)

      // Only send if not already reminded
      if (!reminded || reminded.length === 0) {
        // Log reminder (in production, also send email via Resend)
        await supabase
          .from('event_exhibitor_reminders')
          .insert({
            event_id: params.id,
            exhibitor_id: exhibitor.exhibitor_id,
            reminder_number: 1
          })

        remindersSent++
      }
    }

    return NextResponse.json({
      event_id: params.id,
      overdue_count: needsReminder.length,
      reminders_sent: remindersSent
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Update reminder settings
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { reminder_days } = body

    // Store reminder settings in event metadata (if needed)
    // For now, just return success
    return NextResponse.json({
      success: true,
      reminder_days: reminder_days || 7
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
