import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendMail } from '@/lib/mailer'

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

    // Email interne
    await sendMail({
      to: 'contact@nexart.fr',
      subject: `[Contact] ${subject}`,
      html: `<p><strong>De :</strong> ${name} &lt;${email}&gt;</p><p><strong>Sujet :</strong> ${subject}</p><hr/><p>${message.replace(/\n/g, '<br/>')}</p>`,
      replyTo: email,
    }).catch(() => {})

    // Email de confirmation à l'expéditeur
    await sendMail({
      to: email,
      subject: 'Votre message a bien été reçu — Nexart',
      html: `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td align="center" style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
        <span style="color:#fff;font-size:20px;font-weight:800;line-height:40px;">N</span>
      </td>
      <td style="padding-left:10px;vertical-align:middle;">
        <span style="color:#1A1A2E;font-size:22px;font-weight:800;">Nexart</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.10);">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="background:linear-gradient(135deg,#0F0C29 0%,#1E1B4B 50%,#2D1B69 100%);padding:44px 48px 40px;text-align:center;">
        <h1 style="margin:0 0 12px;color:#fff;font-size:26px;font-weight:800;line-height:1.25;">Message bien reçu ✅</h1>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:15px;">Nous reviendrons vers vous rapidement.</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:36px 48px;">
        <p style="margin:0 0 20px;color:#64748B;font-size:15px;line-height:1.7;">
          Bonjour ${name},<br/><br/>
          Merci pour votre message concernant <strong>${subject}</strong>. Notre équipe l'a bien reçu et vous répondra dans les meilleurs délais.
        </p>
        <div style="background:#F8FAFC;border-radius:12px;padding:20px 24px;border-left:3px solid #6366F1;margin-bottom:24px;">
          <p style="margin:0;color:#64748B;font-size:13px;line-height:1.7;font-style:italic;">${message.replace(/\n/g, '<br/>')}</p>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
              Retour sur Nexart →
            </a>
          </td></tr>
        </table>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #F1F5F9;"/></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:20px 48px 32px;">
        <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.7;">
          © 2026 Nexart · <a href="https://nexart.fr/legal/privacy" style="color:#6366F1;text-decoration:none;">Confidentialité</a>
        </p>
      </td>
    </tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    }).catch(() => {})

    return NextResponse.json({ message: 'Message envoyé avec succès !' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
  }
}
