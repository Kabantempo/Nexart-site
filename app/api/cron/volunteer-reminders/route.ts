export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'CRON_SECRET_TOKEN non configuré' }, { status: 500 })
  }
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()
    const RESEND_KEY = process.env.RESEND_API_KEY
    if (!RESEND_KEY) return NextResponse.json({ error: 'RESEND_API_KEY manquant' }, { status: 500 })

    // Find shifts happening in ~24h
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dateStr = in24h.toISOString().split('T')[0]

    const { data: shifts } = await supabase
      .from('event_shifts')
      .select('id, event_id, role, date, time')
      .eq('date', dateStr)

    if (!shifts || shifts.length === 0) {
      return NextResponse.json({ message: 'Aucun créneau dans 24h', sent: 0 })
    }

    let sent = 0

    for (const shift of shifts) {
      // Get event info
      const { data: event } = await supabase.from('events').select('title').eq('id', shift.event_id ?? '').single()
      const eventTitle = event?.title || 'Événement'

      // Get assigned volunteers
      const { data: assignments } = await (supabase as any)
        .from('volunteer_assignments')
        .select('volunteer_id')
        .eq('shift_id', shift.id)

      if (!assignments || assignments.length === 0) continue

      const volIds = assignments.map((a: { volunteer_id: string }) => a.volunteer_id)
      const { data: volunteers } = await supabase
        .from('event_volunteers')
        .select('name, email')
        .in('id', volIds)

      if (!volunteers) continue

      for (const vol of volunteers) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({
            from: 'noreply@nexart.fr',
            to: vol.email,
            subject: `Rappel bénévolat demain — ${eventTitle}`,
            html: `
              <h2>Rappel : demain vous êtes bénévole ! 👋</h2>
              <p>Bonjour ${vol.name},</p>
              <p>Ce message est un rappel : vous êtes assigné(e) au créneau <strong>${shift.role}</strong> pour <strong>${eventTitle}</strong> demain à <strong>${shift.time}</strong>.</p>
              <p>Merci pour votre engagement, à demain !</p>
              <p>— L'équipe Nexart</p>
            `,
          }),
        })
        sent++
      }
    }

    return NextResponse.json({ success: true, sent, shifts_checked: shifts.length })
  } catch (error: unknown) {
    console.error('❌ Volunteer reminders cron error:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur cron rappels bénévoles' }, { status: 500 })
  }
}
