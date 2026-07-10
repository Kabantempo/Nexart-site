import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// GET: Check overdue exhibitors and send reminders (called by cron job)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify cron token
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get event + reminder settings
    const { data: event } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', params.id)
      .single()

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const { data: settings } = await supabase
      .from('event_reminder_settings')
      .select('*')
      .eq('event_id', params.id)
      .single()

    const firstReminderDays = settings?.first_reminder_days || 7
    const secondReminderDays = settings?.second_reminder_days || 14

    // Find exhibitors who need 1st reminder (approved 7+ days ago, not yet reminded)
    const firstReminderDate = new Date(Date.now() - firstReminderDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: needsFirstReminder } = await supabase
      .from('event_exhibitor_responses')
      .select(
        `id, exhibitor_id, submitted_at,
         profiles:exhibitor_id (id, email, full_name)`
      )
      .eq('event_id', params.id)
      .eq('status', 'approved')
      .lt('submitted_at', firstReminderDate)

    let firstRemindersSent = 0

    if (needsFirstReminder) {
      for (const exhibitor of needsFirstReminder) {
        // Check if already reminded
        const { data: alreadyReminded } = await supabase
          .from('event_exhibitor_reminders')
          .select('id')
          .eq('event_id', params.id)
          .eq('exhibitor_id', exhibitor.exhibitor_id)
          .eq('reminder_number', 1)

        if (!alreadyReminded?.length) {
          // Send email via Resend
          if (exhibitor.profiles?.email) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'noreply@nexart.fr',
                  to: exhibitor.profiles.email,
                  subject: `Rappel: Confirmez votre participation à ${event.title}`,
                  html: `
                    <h2>Bonjour ${exhibitor.profiles.full_name},</h2>
                    <p>Votre candidature pour <strong>${event.title}</strong> a été acceptée.</p>
                    <p>Pouvez-vous confirmer votre participation au plus tôt?</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${params.id}/apply"
                       style="display: inline-block; padding: 12px 24px; background-color: #6366F1; color: white; text-decoration: none; border-radius: 8px;">
                      Confirmer ma candidature
                    </a>
                    <p style="color: #888; font-size: 12px; margin-top: 24px;">
                      Si vous avez des questions, contactez l'organisateur de l'événement.
                    </p>
                  `,
                }),
              })
            } catch (emailError) {
              console.error('Email send failed:', emailError)
            }
          }

          // Log reminder
          await supabase.from('event_exhibitor_reminders').insert({
            event_id: params.id,
            exhibitor_id: exhibitor.exhibitor_id,
            reminder_number: 1,
          })

          firstRemindersSent++
        }
      }
    }

    // Find exhibitors who need 2nd reminder (approved 14+ days ago, 1st reminder sent, no 2nd yet)
    const secondReminderDate = new Date(Date.now() - secondReminderDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: needsSecondReminder } = await supabase
      .from('event_exhibitor_responses')
      .select(
        `id, exhibitor_id, submitted_at,
         profiles:exhibitor_id (id, email, full_name)`
      )
      .eq('event_id', params.id)
      .eq('status', 'approved')
      .lt('submitted_at', secondReminderDate)

    let secondRemindersSent = 0

    if (needsSecondReminder) {
      for (const exhibitor of needsSecondReminder) {
        const { data: firstReminded } = await supabase
          .from('event_exhibitor_reminders')
          .select('id')
          .eq('event_id', params.id)
          .eq('exhibitor_id', exhibitor.exhibitor_id)
          .eq('reminder_number', 1)

        const { data: alreadyReminded2 } = await supabase
          .from('event_exhibitor_reminders')
          .select('id')
          .eq('event_id', params.id)
          .eq('exhibitor_id', exhibitor.exhibitor_id)
          .eq('reminder_number', 2)

        if (firstReminded?.length && !alreadyReminded2?.length) {
          // Send urgent follow-up email
          if (exhibitor.profiles?.email) {
            try {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'noreply@nexart.fr',
                  to: exhibitor.profiles.email,
                  subject: `⚠️ Dernière relance: Confirmez votre participation à ${event.title}`,
                  html: `
                    <h2>Bonjour ${exhibitor.profiles.full_name},</h2>
                    <p>Ceci est notre dernier rappel avant la clôture des candidatures.</p>
                    <p>Veuillez confirmer votre participation à <strong>${event.title}</strong> au plus tôt.</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${params.id}/apply"
                       style="display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 8px;">
                      Confirmer maintenant
                    </a>
                    <p style="color: #888; font-size: 12px; margin-top: 24px;">
                      Passé ce délai, votre place pourrait être attribuée à un autre candidat.
                    </p>
                  `,
                }),
              })
            } catch (emailError) {
              console.error('Email send failed:', emailError)
            }
          }

          await supabase.from('event_exhibitor_reminders').insert({
            event_id: params.id,
            exhibitor_id: exhibitor.exhibitor_id,
            reminder_number: 2,
          })

          secondRemindersSent++
        }
      }
    }

    return NextResponse.json({
      event_id: params.id,
      first_reminders_sent: firstRemindersSent,
      second_reminders_sent: secondRemindersSent,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Reminders cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Update reminder settings for event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { first_reminder_days = 7, second_reminder_days = 14 } = body

    // Upsert settings
    const { error } = await supabase.from('event_reminder_settings').upsert({
      event_id: params.id,
      first_reminder_days,
      second_reminder_days,
      enabled: true,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      first_reminder_days,
      second_reminder_days,
    })
  } catch (error: any) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
