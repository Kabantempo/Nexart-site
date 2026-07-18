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

    const { validate: v, z } = await import('@/lib/validate')
    const appStatusSchema = z.object({
      creatorEmail: z.string().email().optional(),
      creatorName: z.string().max(200).optional(),
      eventTitle: z.string().min(1).max(300),
      status: z.enum(['accepted', 'refused', 'pending']),
      creatorId: z.string().uuid().optional(),
    })
    const { data: parsed, error: validErr } = v(appStatusSchema, await req.json())
    if (validErr) return validErr
    const { creatorEmail: rawEmail, creatorName, eventTitle, status, creatorId } = parsed

    let creatorEmail = rawEmail
    if (!creatorEmail && creatorId) {
      const { data: { user } } = await adminClient.auth.admin.getUserById(creatorId)
      creatorEmail = user?.email ?? null
    }

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
