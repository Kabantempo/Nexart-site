export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { emailWelcome } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    // Only callable by authenticated users (prevents email spam abuse)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ ok: true })
    }
    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await anon.auth.getUser(authHeader.substring(7))
    if (!user) return NextResponse.json({ ok: true })

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      email: z.string().email(),
      name: z.string().max(200).optional(),
      role: z.string().max(50).optional(),
    })
    const { data: parsed, error: validErr } = v(schema, await req.json())
    if (validErr) return NextResponse.json({ ok: true })
    const { email, name, role } = parsed
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
