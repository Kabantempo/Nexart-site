export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/mailer'
import { emailContactConfirmation, emailContactInternal } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Tous les champs sont obligatoires' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.from('contact_submissions').insert({ name, email, subject, message })

    await sendMail({
      to: 'contact@nexart.fr',
      subject: `[Contact] ${subject}`,
      html: emailContactInternal(name, email, subject, message),
      replyTo: email,
    }).catch(() => {})

    await sendMail({
      to: email,
      subject: 'Votre message a bien été reçu — Nexart',
      html: emailContactConfirmation(name, subject),
    }).catch(() => {})

    return NextResponse.json({ message: 'Message envoyé avec succès !' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}
