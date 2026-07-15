export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    const { organizer_id, creator_name, event_title, event_id } = await req.json()
    if (!organizer_id || !event_title) return NextResponse.json({ ok: true })

    const { data: { user } } = await admin.auth.admin.getUserById(organizer_id)
    const organizerEmail = user?.email
    if (!organizerEmail || !process.env.SMTP_PASS) return NextResponse.json({ ok: true })

    await sendMail({
      to: organizerEmail,
      subject: `Nouvelle candidature pour "${event_title}" — Nexart`,
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
      <td style="background:linear-gradient(135deg,#0F0C29 0%,#1E1B4B 50%,#2D1B69 100%);padding:40px 48px 36px;text-align:center;">
        <p style="margin:0 0 12px;display:inline-block;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);border-radius:999px;padding:5px 16px;color:#A5B4FC;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Nouvelle candidature</p>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;line-height:1.3;">${creator_name || 'Un créateur'} souhaite rejoindre votre événement</h1>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:32px 48px;">
        <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.7;">
          <strong>${creator_name || 'Un créateur'}</strong> vient de postuler pour <strong>${event_title}</strong>. Consultez sa candidature et son portfolio depuis votre tableau de bord.
        </p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr/events/${event_id}" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
              Voir la candidature
            </a>
          </td></tr>
        </table>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #F1F5F9;"/></td></tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:20px 48px 32px;">
        <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Nexart · <a href="https://nexart.fr" style="color:#6366F1;text-decoration:none;">nexart.fr</a></p>
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
    console.error('[application-received]', err)
    return NextResponse.json({ ok: true })
  }
}
