export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { emailWelcome } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { email, name, role } = await req.json()
    if (!email || !process.env.SMTP_PASS) return NextResponse.json({ ok: true })

    await sendMail({
      to: email,
      subject: 'Bienvenue sur Nexart !',
      html: emailWelcome(name || '', role || ''),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[welcome]', err)
    return NextResponse.json({ ok: true })
  }
}
