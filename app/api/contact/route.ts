import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

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

    const { error: dbErr } = await supabase
      .from('contact_submissions')
      .insert({ name, email, subject, message })

    if (dbErr) throw dbErr

    if (process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
          user: 'contact@nexart.fr',
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: '"Nexart Contact" <contact@nexart.fr>',
        to: 'contact@nexart.fr',
        subject: `[Contact] ${subject}`,
        text: `De : ${name} <${email}>\n\n${message}`,
        html: `<p><strong>De :</strong> ${name} &lt;${email}&gt;</p><p><strong>Sujet :</strong> ${subject}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`,
        replyTo: email,
      })
    }

    return NextResponse.json({ message: 'Message envoyé avec succès !' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur lors de l\'envoi' }, { status: 500 })
  }
}
