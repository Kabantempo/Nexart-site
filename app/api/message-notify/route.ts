export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    const { conversation_id, sender_id, content } = await req.json()
    if (!conversation_id || !sender_id) return NextResponse.json({ ok: true })

    // Trouver le destinataire
    const { data: conv } = await admin.from('conversations')
      .select('creator_id, organizer_id')
      .eq('id', conversation_id)
      .single()
    if (!conv) return NextResponse.json({ ok: true })

    const recipientId = conv.creator_id === sender_id ? conv.organizer_id : conv.creator_id

    // Vérifier si le destinataire est en ligne (a lu un message dans les 5 dernières min) — skip si oui
    const { data: recentRead } = await admin.from('messages')
      .select('read_at')
      .eq('conversation_id', conversation_id)
      .not('read_at', 'is', null)
      .order('read_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentRead?.read_at) {
      const readAge = Date.now() - new Date(recentRead.read_at).getTime()
      if (readAge < 5 * 60 * 1000) return NextResponse.json({ ok: true, skipped: 'online' })
    }

    // Récupérer l'email et le nom du destinataire
    const [{ data: { user: recipientAuth } }, { data: senderProfile }] = await Promise.all([
      admin.auth.admin.getUserById(recipientId),
      admin.from('profiles').select('full_name').eq('id', sender_id).single(),
    ])

    const recipientEmail = recipientAuth?.email
    const senderName = senderProfile?.full_name || 'Un utilisateur'

    // Notif in-app (toujours insérée, indépendamment de l'email)
    await admin.from('notifications').insert({
      user_id: recipientId,
      type: 'new_message',
      title: `Nouveau message de ${senderName}`,
      body: content?.slice(0, 120) || null,
      link: `/messages/${conversation_id}`,
    })

    // Push notification
    await sendPushToUsers([recipientId], `💬 ${senderName}`, content?.slice(0, 120) || 'Nouveau message', `/messages/${conversation_id}`)

    if (!recipientEmail || !process.env.SMTP_PASS) return NextResponse.json({ ok: true })

    await sendMail({
      to: recipientEmail,
      subject: `💬 Nouveau message de ${senderName} — Nexart`,
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
        <p style="margin:0 0 12px;display:inline-block;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);border-radius:999px;padding:5px 16px;color:#A5B4FC;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Nouveau message</p>
        <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;line-height:1.3;">💬 ${senderName} vous a écrit</h1>
      </td>
    </tr></table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding:32px 48px;">
        <div style="background:#F8FAFC;border-radius:12px;padding:20px 24px;border-left:4px solid #6366F1;margin-bottom:28px;">
          <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;font-style:italic;">"${content?.slice(0, 200)}${content?.length > 200 ? '…' : ''}"</p>
        </div>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" style="background:linear-gradient(135deg,#6366F1,#4F46E5);border-radius:12px;">
            <a href="https://nexart.fr/messages/${conversation_id}" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
              Répondre →
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
    console.error('[message-notify]', err)
    return NextResponse.json({ ok: true })
  }
}
