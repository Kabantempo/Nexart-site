import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const adminClient = getAdminClient()
  try {
    const { creatorEmail: rawEmail, creatorName, eventTitle, status, creatorId } = await req.json()

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
        <p style="margin:0 0 16px;display:inline-block;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);border-radius:999px;padding:5px 16px;color:#A5B4FC;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
          ${accepted ? 'Bonne nouvelle !' : 'Mise à jour candidature'}
        </p>
        <h1 style="margin:0 0 12px;color:#fff;font-size:26px;font-weight:800;line-height:1.25;">
          ${accepted ? 'Votre candidature est acceptée ✅' : 'Candidature non retenue'}
        </h1>
        <p style="margin:0;color:rgba(255,255,255,0.55);font-size:15px;">
          ${eventTitle}
        </p>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:36px 48px;">
        <p style="margin:0 0 24px;color:#64748B;font-size:15px;line-height:1.7;">
          Bonjour ${creatorName || 'Créateur'},<br/><br/>
          ${accepted
            ? `L'organisateur a <strong style="color:#10B981;">accepté</strong> votre candidature pour <strong>${eventTitle}</strong>. Connectez-vous à votre espace pour voir les détails et échanger avec l'organisateur.`
            : `Votre candidature pour <strong>${eventTitle}</strong> n'a pas été retenue cette fois-ci. Ne vous découragez pas — d'autres événements vous attendent sur Nexart !`
          }
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr/dashboard" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
              Voir mon tableau de bord →
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
    })

    // Push notification si accepté
    if (accepted && creatorId) {
      try {
        const { data: subs } = await adminClient
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', creatorId)

        if (subs && subs.length > 0) {
          const { default: webpush } = await import('web-push')
          webpush.setVapidDetails(
            process.env.VAPID_SUBJECT!,
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
          )
          const payload = JSON.stringify({
            title: '🎉 Candidature acceptée !',
            body: `Votre candidature pour "${eventTitle}" a été acceptée.`,
            url: 'https://nexart.fr/dashboard',
          })
          await Promise.allSettled(
            subs.map((sub) =>
              webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              )
            )
          )
        }
      } catch (pushErr) {
        console.error('[application-status] push error:', pushErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[application-status] email error:', err)
    return NextResponse.json({ ok: true, warning: 'Email non envoyé' })
  }
}
