export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sendMail } from '@/lib/mailer'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'
import { emailMessageNotify } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    // Auth requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user: authUser } } = await admin.auth.getUser(authHeader.substring(7))
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      conversation_id: z.string().uuid(),
      sender_id: z.string().uuid(),
      content: z.string().max(10000).optional(),
    })
    const { data: parsed, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { conversation_id, sender_id, content } = parsed
    if (!conversation_id || !sender_id) return NextResponse.json({ ok: true })

    // L'expéditeur doit être l'utilisateur authentifié
    if (authUser.id !== sender_id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

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
      html: emailMessageNotify(senderName, content || '', conversation_id),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[message-notify]', err)
    return NextResponse.json({ ok: true })
  }
}
