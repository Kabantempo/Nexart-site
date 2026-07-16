export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'

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
            await admin.from('event_exhibitor_reminders').insert({ event_id: event.id, exhibitor_id: ex.exhibitor_id, reminder_number: 1 })
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
              await admin.from('event_exhibitor_reminders').insert({ event_id: event.id, exhibitor_id: ex.exhibitor_id, reminder_number: 2 })
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

    // ── Rappels tâches collaboratives en retard ───────────────────────────────
    let tasksReminded = 0
    let tasksEscalated = 0
    const STALE_DAYS = 3 // tâche non mise à jour depuis 3 jours → rappel
    const ESCALATE_DAYS = 7 // toujours en retard après 7 jours → escalade au chef de projet

    try {
      const staleCutoff = new Date(Date.now() - STALE_DAYS * 86400000).toISOString()
      const escalateCutoff = new Date(Date.now() - ESCALATE_DAYS * 86400000).toISOString()

      const { data: staleTasks } = await (admin as any)
        .from('event_tasks')
        .select('id, title, event_id, assigned_to, updated_at, events:event_id(organizer_id, title)')
        .eq('status', 'in_progress')
        .lt('updated_at', staleCutoff)

      for (const task of staleTasks ?? []) {
        if (!task.assigned_to) continue
        const isEscalate = new Date(task.updated_at) < new Date(escalateCutoff)
        const organizerId = task.events?.organizer_id

        if (isEscalate && organizerId && organizerId !== task.assigned_to) {
          // Escalade : réassigner à l'organisateur + notifier
          await admin.from('event_tasks').update({ assigned_to: organizerId }).eq('id', task.id)
          await admin.from('notifications').insert({
            user_id: organizerId,
            type: 'task_escalated',
            title: 'Tâche non avancée — escalade',
            body: `La tâche "${task.title}" n'a pas été mise à jour depuis ${ESCALATE_DAYS}+ jours et vous a été réassignée.`,
            link: `/events/${task.event_id}/collaboration`,
          })
          await sendPushToUsers([organizerId], '⚠️ Tâche escaladée', `"${task.title}" vous a été réassignée (${ESCALATE_DAYS}j sans avancement).`, `/events/${task.event_id}/collaboration`)
          tasksEscalated++
        } else {
          // Simple rappel au responsable
          await admin.from('notifications').insert({
            user_id: task.assigned_to,
            type: 'task_reminder',
            title: 'Tâche en attente de mise à jour',
            body: `La tâche "${task.title}" n'a pas été mise à jour depuis ${STALE_DAYS}+ jours.`,
            link: `/events/${task.event_id}/collaboration`,
          })
          await sendPushToUsers([task.assigned_to], '🔔 Tâche en attente', `"${task.title}" nécessite une mise à jour.`, `/events/${task.event_id}/collaboration`)
          tasksReminded++
        }
      }
    } catch (taskErr: any) {
      console.error('Task reminders error:', taskErr.message)
    }

    return NextResponse.json({
      success: true,
      events_processed: events.length,
      first_reminders_sent: totalFirst,
      second_reminders_sent: totalSecond,
      tasks_reminded: tasksReminded,
      tasks_escalated: tasksEscalated,
      details: results,
    })
  } catch (error: unknown) {
    console.error('❌ Cron send-reminders failed:', (error instanceof Error ? error.message : String(error)))
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
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
