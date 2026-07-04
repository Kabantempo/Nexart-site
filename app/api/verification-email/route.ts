import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    const { user_id, field, accepted, comment, creator_name } = await req.json()
    const label = field === 'siret_verified' ? 'SIRET' : 'RC Pro'

    const { data: { user } } = await admin.auth.admin.getUserById(user_id)
    if (!user?.email) return NextResponse.json({ ok: true, skipped: true })

    const name = creator_name || user.email.split('@')[0]

    if (accepted) {
      await sendMail({
        to: user.email,
        subject: `Vérification ${label} validée ✅ — Nexart`,
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
        <p style="margin:0 0 16px;display:inline-block;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);border-radius:999px;padding:5px 16px;color:#6EE7B7;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Validation confirmée</p>
        <h1 style="margin:0 0 12px;color:#fff;font-size:26px;font-weight:800;line-height:1.25;">Votre ${label} est vérifié ✅</h1>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:15px;">Votre compte est maintenant certifié par l'équipe Nexart.</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:36px 48px;">
        <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">
          Bonjour ${name},<br/><br/>
          Bonne nouvelle ! L'équipe Nexart vient de <strong style="color:#10B981;">valider votre ${label}</strong>. Votre profil affiche désormais le badge de certification.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr/profile" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
              Voir mon profil →
            </a>
          </td></tr>
        </table>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #F1F5F9;"/></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:20px 48px 32px;">
        <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Nexart · <a href="https://nexart.fr/legal/privacy" style="color:#6366F1;text-decoration:none;">Confidentialité</a></p>
      </td>
    </tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      })
    } else {
      await sendMail({
        to: user.email,
        subject: `Vérification ${label} — action requise`,
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
      <td style="background:linear-gradient(135deg,#1A0A0A 0%,#2D0F0F 100%);padding:44px 48px 40px;text-align:center;">
        <h1 style="margin:0 0 12px;color:#fff;font-size:26px;font-weight:800;">Vérification ${label} non validée</h1>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:15px;">Une action de votre part est nécessaire.</p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:36px 48px;">
        <p style="margin:0 0 16px;color:#64748B;font-size:15px;line-height:1.7;">Bonjour ${name},<br/><br/>Votre ${label} n'a pas pu être validé pour le motif suivant :</p>
        ${comment ? `<div style="background:#FEF2F2;border-radius:10px;padding:16px 20px;border-left:3px solid #EF4444;margin-bottom:20px;"><p style="margin:0;color:#991B1B;font-size:14px;line-height:1.6;">${comment}</p></div>` : ''}
        <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">Merci de mettre à jour vos informations et de soumettre à nouveau votre demande depuis votre profil.</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr/profile" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Mettre à jour mon profil →</a>
          </td></tr>
        </table>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #F1F5F9;"/></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:20px 48px 32px;">
        <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Nexart · <a href="https://nexart.fr/legal/privacy" style="color:#6366F1;text-decoration:none;">Confidentialité</a></p>
      </td>
    </tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
