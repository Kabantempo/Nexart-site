export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'
import { emailVerificationApproved, emailVerificationRequested } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    const { user_id, field, accepted, comment } = await req.json()
    const label = field === 'siret_verified' ? 'SIRET' : 'RC Pro'

    const { data: { user } } = await admin.auth.admin.getUserById(user_id)
    if (!user?.email) return NextResponse.json({ ok: true, skipped: true })

    if (accepted) {
      await sendMail({
        to: user.email,
        subject: `Vérification ${label} validée ✅ — Nexart`,
        html: emailVerificationApproved(label),
      })
    } else {
      await sendMail({
        to: user.email,
        subject: `Vérification ${label} — action requise`,
        html: emailVerificationRequested(label, comment),
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
