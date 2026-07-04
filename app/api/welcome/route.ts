import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const { email, name, role } = await req.json()
    if (!email || !process.env.SMTP_PASS) return NextResponse.json({ ok: true })

    const isCreator = role === 'creator'
    const roleLabel = isCreator ? 'créateur' : role === 'organizer' ? 'organisateur' : 'visiteur'

    await sendMail({
      to: email,
      subject: 'Bienvenue sur Nexart !',
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
        <p style="margin:0 0 12px;display:inline-block;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);border-radius:999px;padding:5px 16px;color:#A5B4FC;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Bienvenue !</p>
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;line-height:1.3;">Bonjour ${name || 'sur Nexart'}</h1>
        <p style="margin:12px 0 0;color:#A5B4FC;font-size:14px;">Votre compte ${roleLabel} a bien été créé.</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:32px 48px;">
        <p style="margin:0 0 20px;color:#374151;font-size:14px;line-height:1.7;">
          ${isCreator
            ? 'Complétez votre profil, ajoutez vos disciplines et votre portfolio, puis postulez aux marchés et événements qui vous correspondent.'
            : role === 'organizer'
            ? 'Créez votre premier événement, publiez-le et recevez des candidatures de créateurs vérifiés de toute la France.'
            : 'Explorez les événements, découvrez des créateurs et suivez vos marchés préférés.'}
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr/dashboard" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
              Accéder à mon espace
            </a>
          </td></tr>
        </table>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #F1F5F9;"/></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:20px 48px 32px;">
        <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Nexart · <a href="https://nexart.fr" style="color:#6366F1;text-decoration:none;">nexart.fr</a> · <a href="https://nexart.fr/contact" style="color:#6366F1;text-decoration:none;">Contact</a></p>
      </td>
    </tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[welcome]', err)
    return NextResponse.json({ ok: true })
  }
}
