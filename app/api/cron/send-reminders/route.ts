export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// POST: Global cron — send reminders for all active events
// Called daily by EasyCron: POST https://nexart.fr/api/cron/send-reminders
// Header: Authorization: Bearer <CRON_SECRET_TOKEN>
export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET_TOKEN) {
    console.error('CRON_SECRET_TOKEN not configured')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getAdminClient()
  const results: any[] = []
  let totalFirst = 0
  let totalSecond = 0

  try {
    // Get all published events that have reminder settings enabled
    const { data: events, error } = await (admin as any)
      .from('events')
      .select('id, title')
      .eq('status', 'published')

    if (error) throw error
    if (!events?.length) return NextResponse.json({ success: true, events_processed: 0 })

    for (const event of events) {
      try {
        const { data: settings } = await (admin as any)
          .from('event_reminder_settings')
          .select('*')
          .eq('event_id', event.id)
          .single()

        if (!settings?.enabled) continue

        const firstDays = settings.first_reminder_days ?? 7
        const secondDays = settings.second_reminder_days ?? 14

        const firstCutoff = new Date(Date.now() - firstDays * 86400000).toISOString()
        const secondCutoff = new Date(Date.now() - secondDays * 86400000).toISOString()

        // Exhibitors needing 1st reminder
        const { data: approved } = await (admin as any)
          .from('event_exhibitor_responses')
          .select('id, exhibitor_id, submitted_at, profiles:exhibitor_id(full_name, email)')
          .eq('event_id', event.id)
          .eq('status', 'approved')
          .lt('submitted_at', firstCutoff)

        let first = 0, second = 0

        for (const ex of approved ?? []) {
          const email = (ex.profiles as any)?.email
          const name = (ex.profiles as any)?.full_name || 'Exposant'
          if (!email) continue

          const { data: r1 } = await (admin as any)
            .from('event_exhibitor_reminders')
            .select('id')
            .eq('event_id', event.id)
            .eq('exhibitor_id', ex.exhibitor_id)
            .eq('reminder_number', 1)

          if (!r1?.length) {
            await sendEmail(email, `Rappel: Confirmez votre participation à ${event.title}`, reminderHtml(name, event, 1))
            await (admin as any).from('event_exhibitor_reminders').insert({ event_id: event.id, exhibitor_id: ex.exhibitor_id, reminder_number: 1 })
            first++
            continue
          }

          // Check 2nd reminder
          if (new Date(ex.submitted_at) < new Date(secondCutoff)) {
            const { data: r2 } = await (admin as any)
              .from('event_exhibitor_reminders')
              .select('id')
              .eq('event_id', event.id)
              .eq('exhibitor_id', ex.exhibitor_id)
              .eq('reminder_number', 2)

            if (!r2?.length) {
              await sendEmail(email, `⚠️ Dernière relance: ${event.title}`, reminderHtml(name, event, 2))
              await (admin as any).from('event_exhibitor_reminders').insert({ event_id: event.id, exhibitor_id: ex.exhibitor_id, reminder_number: 2 })
              second++
            }
          }
        }

        totalFirst += first
        totalSecond += second
        if (first + second > 0) results.push({ event_id: event.id, title: event.title, first, second })
      } catch (eventErr: any) {
        console.error('Reminder error for event', event.id, eventErr.message)
      }
    }

    console.log('✓ Cron send-reminders:', { events: events.length, totalFirst, totalSecond, timestamp: new Date().toISOString() })

    return NextResponse.json({
      success: true,
      events_processed: events.length,
      first_reminders_sent: totalFirst,
      second_reminders_sent: totalSecond,
      details: results,
    })
  } catch (error: any) {
    console.error('❌ Cron send-reminders failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'noreply@nexart.fr', to, subject, html }),
  })
}

function reminderHtml(name: string, event: { id: string; title: string }, n: number) {
  const urgent = n === 2
  const color = urgent ? '#DC2626' : '#6366F1'
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}`
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#1a1a1a">Bonjour ${name},</h2>
      ${urgent
        ? `<p>Ceci est notre <strong>dernier rappel</strong>. Passé ce délai, votre place pourrait être attribuée à quelqu'un d'autre.</p>`
        : `<p>Votre candidature pour <strong>${event.title}</strong> a été acceptée. Pouvez-vous confirmer votre participation ?</p>`
      }
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;margin:16px 0">
        ${urgent ? 'Confirmer maintenant' : 'Confirmer ma participation'}
      </a>
      <p style="color:#888;font-size:12px;margin-top:24px">Nexart — La plateforme des marchés artisanaux</p>
    </div>
  `
}
