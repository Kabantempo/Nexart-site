export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'
import { emailApplicationStatus } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  const adminClient = getAdminClient()
  try {
    // Auth requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user: authUser } } = await adminClient.auth.getUser(authHeader.substring(7))
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { validate: v, z, uuidSchema } = await import('@/lib/validate')
    const appStatusSchema = z.object({
      creatorName: z.string().max(200).optional(),
      eventTitle: z.string().min(1).max(300),
      status: z.enum(['accepted', 'refused', 'pending']),
      creatorId: z.string().uuid(),
      eventId: uuidSchema,
    })
    const { data: parsed, error: validErr } = v(appStatusSchema, await req.json())
    if (validErr) return validErr
    const { creatorName, eventTitle, status, creatorId, eventId } = parsed

    // Caller must be the organizer of the event — always required
    const { data: ev } = await adminClient.from('events').select('organizer_id').eq('id', eventId).single()
    if (!ev || ev.organizer_id !== authUser.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Always look up creator email from DB — never trust client-provided email
    const { data: { user: creatorUser } } = await adminClient.auth.admin.getUserById(creatorId)
    const creatorEmail = creatorUser?.email

    if (!status || !eventTitle) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    if (!process.env.SMTP_PASS || !creatorEmail) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const accepted = status === 'accepted'

    await sendMail({
      to: creatorEmail,
      subject: accepted
        ? `✅ Candidature acceptée — ${eventTitle}`
        : `Candidature pour ${eventTitle}`,
      html: emailApplicationStatus(creatorName || '', eventTitle, accepted),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[application-status] email error:', err)
    return NextResponse.json({ ok: true, warning: 'Email non envoyé' })
  }
}
