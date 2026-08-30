export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'
import { emailApplicationReceived } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    // Auth requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user: authUser } } = await admin.auth.getUser(authHeader.substring(7))
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { creator_name, event_title, event_id } = await req.json()
    if (!event_id || !event_title) return NextResponse.json({ ok: true })

    // Verify caller has a real application for this event AND look up organizer from DB (never trust body)
    const [{ data: app }, { data: ev }] = await Promise.all([
      admin.from('applications').select('id').eq('event_id', event_id).eq('creator_id', authUser.id).maybeSingle(),
      admin.from('events').select('organizer_id').eq('id', event_id).single(),
    ])
    if (!app) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    if (!ev?.organizer_id) return NextResponse.json({ ok: true })

    const { data: { user } } = await admin.auth.admin.getUserById(ev.organizer_id)
    const organizerEmail = user?.email
    if (!organizerEmail || !process.env.SMTP_PASS) return NextResponse.json({ ok: true })

    await sendMail({
      to: organizerEmail,
      subject: `Nouvelle candidature pour "${event_title}" — Nexart`,
      html: emailApplicationReceived(creator_name || '', event_title, event_id || ''),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[application-received]', err)
    return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 })
  }
}
