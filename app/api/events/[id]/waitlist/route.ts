import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET: List waitlist ordered by position
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_exhibitor_waitlist')
      .select(`
        id,
        exhibitor_id,
        position,
        reason,
        notified_at,
        created_at,
        profiles:exhibitor_id (id, full_name)
      `)
      .eq('event_id', params.id)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Waitlist GET error:', {
      event_id: params.id,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur chargement waitlist', details: errorMsg },
      { status: 500 }
    )
  }
}

// POST: Add exhibitor to waitlist OR handle cancellation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let body: any
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    body = await req.json()
    const { exhibitor_id, action, reason = 'Sold out' } = body

    // Action 1: Add to waitlist
    if (action === 'add' || !action) {
      // Get current max position
      const { data: maxPos } = await supabase
        .from('event_exhibitor_waitlist')
        .select('position')
        .eq('event_id', params.id)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (maxPos?.[0]?.position || 0) + 1

      const { data, error } = await supabase
        .from('event_exhibitor_waitlist')
        .insert([
          {
            event_id: params.id,
            exhibitor_id,
            position: nextPosition,
            reason,
          },
        ])
        .select()

      if (error) throw error
      return NextResponse.json(data?.[0], { status: 201 })
    }

    // Action 2: Cancel exhibitor, notify next in queue
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
        .select(`id, exhibitor_id, position, profiles:exhibitor_id (full_name, email)`)
        .eq('event_id', params.id)
        .order('position', { ascending: true })
        .limit(1)

      if (nextInQueue?.length) {
        const next = nextInQueue[0]
        const event_name = 'your event'

        // Send email to next in queue
        if (next.profiles?.email) {
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'noreply@nexart.fr',
                to: next.profiles.email,
                subject: '🎉 Bonne nouvelle: Une place vous attend!',
                html: `
                  <h2>Bonjour ${next.profiles.full_name},</h2>
                  <p>Une place s'est libérée et nous vous offrons l'opportunité de participer!</p>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${params.id}/apply"
                     style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 8px;">
                    Confirmer ma participation
                  </a>
                  <p style="color: #888; font-size: 12px; margin-top: 24px;">
                    Veuillez confirmer dans les 48 heures.
                  </p>
                `,
              }),
            })
          } catch (emailError) {
            console.error('Email send failed:', emailError)
          }
        }

        // Mark as notified
        await supabase
          .from('event_exhibitor_waitlist')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', next.id)

        return NextResponse.json({
          success: true,
          message: 'Exhibitor cancelled, next notified',
          next_exhibitor_id: next.exhibitor_id,
        })
      }

      return NextResponse.json({ success: true, message: 'Exhibitor cancelled' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Waitlist POST error:', {
      event_id: params.id,
      error: errorMsg,
      action: body?.action,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur traitement waitlist', details: errorMsg },
      { status: 500 }
    )
  }
}

// PATCH: Move exhibitor from waitlist to approved
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let body: any
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    body = await req.json()
    const { exhibitor_id } = body

    // Get exhibitor
    const { data: exhibitor } = await supabase
      .from('event_exhibitor_responses')
      .select('id, profiles:exhibitor_id (full_name)')
      .eq('event_id', params.id)
      .eq('exhibitor_id', exhibitor_id)
      .single()

    if (!exhibitor) {
      return NextResponse.json({ error: 'Exhibitor not found' }, { status: 404 })
    }

    // Move to approved
    await supabase
      .from('event_exhibitor_responses')
      .update({ status: 'approved' })
      .eq('event_id', params.id)
      .eq('exhibitor_id', exhibitor_id)

    // Remove from waitlist
    await supabase
      .from('event_exhibitor_waitlist')
      .delete()
      .eq('event_id', params.id)
      .eq('exhibitor_id', exhibitor_id)

    // Reorder remaining waitlist positions
    const { data: remaining } = await supabase
      .from('event_exhibitor_waitlist')
      .select('id')
      .eq('event_id', params.id)
      .order('position', { ascending: true })

    for (let i = 0; i < (remaining?.length || 0); i++) {
      await supabase
        .from('event_exhibitor_waitlist')
        .update({ position: i + 1 })
        .eq('id', remaining![i].id)
    }

    return NextResponse.json({ success: true, exhibitor_id })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Waitlist PATCH error:', {
      event_id: params.id,
      exhibitor_id: body?.exhibitor_id,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur mise à jour waitlist', details: errorMsg },
      { status: 500 }
    )
  }
}

// DELETE: Remove from waitlist
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { exhibitor_id } = body

    if (!exhibitor_id) {
      return NextResponse.json(
        { error: 'exhibitor_id required' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('event_exhibitor_waitlist')
      .delete()
      .eq('event_id', params.id)
      .eq('exhibitor_id', exhibitor_id)

    if (deleteError) throw deleteError

    // Reorder remaining
    const { data: remaining, error: fetchError } = await supabase
      .from('event_exhibitor_waitlist')
      .select('id')
      .eq('event_id', params.id)
      .order('position', { ascending: true })

    if (fetchError) throw fetchError

    for (let i = 0; i < (remaining?.length || 0); i++) {
      const { error: updateError } = await supabase
        .from('event_exhibitor_waitlist')
        .update({ position: i + 1 })
        .eq('id', remaining![i].id)

      if (updateError) {
        console.warn('Failed to reorder position:', updateError)
      }
    }

    console.log('✓ Exhibitor removed from waitlist:', {
      event_id: params.id,
      exhibitor_id,
      remaining_count: remaining?.length,
    })

    return NextResponse.json({ success: true, remaining_count: remaining?.length })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Waitlist DELETE error:', {
      event_id: params.id,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur suppression waitlist', details: errorMsg },
      { status: 500 }
    )
  }
}
