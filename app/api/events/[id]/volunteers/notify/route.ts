export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

function buildICS(volunteer: { name: string }, shift: { role: string; date: string; time: string }, eventTitle: string): string {
  const dt = new Date(`${shift.date}T${shift.time}`)
  const dtEnd = new Date(dt.getTime() + 2 * 60 * 60 * 1000) // +2h par défaut

  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nexart//Volunteer//FR',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(dt)}`,
    `DTEND:${fmt(dtEnd)}`,
    `SUMMARY:Bénévolat — ${shift.role} (${eventTitle})`,
    `DESCRIPTION:Vous êtes assigné(e) au créneau "${shift.role}" pour l'événement ${eventTitle}.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getAdminClient()

    const { data: event } = await supabase.from('events').select('title').eq('id', params.id).single()
    const eventTitle = event?.title || 'Événement'

    const { data: assignments } = await (supabase as any)
      .from('volunteer_assignments')
      .select('volunteer_id, shift_id')
      .in('shift_id', (
        await supabase.from('event_shifts').select('id').eq('event_id', params.id)
      ).data?.map((s: { id: string }) => s.id) || [])

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ message: 'Aucune assignation à notifier', sent: 0 })
    }

    const { data: volunteers } = await supabase
      .from('event_volunteers')
      .select('id, name, email')
      .eq('event_id', params.id)

    const { data: shifts } = await supabase
      .from('event_shifts')
      .select('id, role, date, time')
      .eq('event_id', params.id)

    const RESEND_KEY = process.env.RESEND_API_KEY
    if (!RESEND_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY manquant' }, { status: 500 })
    }

    let sent = 0

    // Group assignments by volunteer
    const byVol = new Map<string, string[]>()
    for (const a of assignments) {
      const existing = byVol.get(a.volunteer_id) || []
      existing.push(a.shift_id)
      byVol.set(a.volunteer_id, existing)
    }

    for (const [volId, shiftIds] of byVol.entries()) {
      const vol = volunteers?.find((v: { id: string }) => v.id === volId)
      if (!vol) continue

      const volShifts = shifts?.filter((s: any) => shiftIds.includes(s.id)) || []
      if (volShifts.length === 0) continue

      const shiftsHtml = volShifts.map((s: any) =>
        `<li><strong>${s.role}</strong> — ${new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${s.time}</li>`
      ).join('')

      const icsContent = buildICS(vol, volShifts[0] as any, eventTitle)
      const icsBase64 = Buffer.from(icsContent).toString('base64')

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: 'noreply@nexart.fr',
          to: vol.email,
          subject: `Votre planning bénévole — ${eventTitle}`,
          html: `
            <h2>Bonjour ${vol.name} 👋</h2>
            <p>Voici vos créneaux assignés pour <strong>${eventTitle}</strong> :</p>
            <ul>${shiftsHtml}</ul>
            <p>Le fichier ICS ci-joint vous permet d'ajouter ces créneaux à votre calendrier.</p>
            <p>Merci pour votre engagement !</p>
            <p>— L'équipe Nexart</p>
          `,
          attachments: [{
            filename: 'planning-benevole.ics',
            content: icsBase64,
            content_type: 'text/calendar',
          }],
        }),
      })
      sent++
    }

    return NextResponse.json({ success: true, sent })
  } catch (error: unknown) {
    console.error('❌ Notify volunteers error:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur envoi notifications' }, { status: 500 })
  }
}
