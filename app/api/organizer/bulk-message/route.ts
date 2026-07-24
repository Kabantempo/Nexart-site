export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    // Auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user: authUser } } = await admin.auth.getUser(authHeader.substring(7))
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Validation Zod
    const { validate: v, z, uuidSchema } = await import('@/lib/validate')
    const schema = z.object({
      event_id: uuidSchema,
      creator_ids: z.array(uuidSchema).min(1, 'Au moins un créateur requis').max(500),
      subject: z.string().min(1).max(300),
      message: z.string().min(1).max(10000),
      template: z.string().max(100).optional(),
    })
    const { data: parsed, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { event_id, creator_ids, subject, message } = parsed

    // Vérifier que l'user est bien l'organisateur de l'event
    const { data: event } = await admin
      .from('events')
      .select('id, title, organizer_id')
      .eq('id', event_id)
      .single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    if (event.organizer_id !== authUser.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const errors: string[] = []
    let sent = 0

    const escapeHtml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

    // Fetch organizer profile once (avoid N+1 inside the loop)
    const { data: orgProfile } = await admin.from('profiles').select('full_name').eq('id', authUser.id).single()
    const orgName = escapeHtml(orgProfile?.full_name || 'Un organisateur')
    const safeEventTitle = escapeHtml(event.title || '')
    const safeMessage = escapeHtml(message)

    // Pour chaque créateur : trouver/créer la conversation, insérer le message
    await Promise.all(creator_ids.map(async (creator_id) => {
      try {
        // Trouver ou créer la conversation
        let { data: conv } = await admin
          .from('conversations')
          .select('id')
          .eq('event_id', event_id)
          .eq('creator_id', creator_id)
          .eq('organizer_id', authUser.id)
          .maybeSingle()

        if (!conv) {
          const { data: newConv, error: convErr } = await admin
            .from('conversations')
            .insert({ event_id, creator_id, organizer_id: authUser.id })
            .select('id')
            .single()
          if (convErr || !newConv) {
            errors.push(`Impossible de créer la conversation pour ${creator_id}`)
            return
          }
          conv = newConv
        }

        // Insérer le message
        const { error: msgErr } = await admin
          .from('messages')
          .insert({ conversation_id: conv.id, sender_id: authUser.id, content: message })
        if (msgErr) {
          errors.push(`Impossible d'envoyer le message à ${creator_id}`)
          return
        }

        sent++

        // Notification in-app
        await admin.from('notifications').insert({
          user_id: creator_id,
          type: 'new_message',
          title: `Nouveau message de ${orgName}`,
          body: message.slice(0, 120),
          link: `/messages/${conv.id}`,
        })

        // Email Resend via fetch (optionnel)
        if (process.env.RESEND_API_KEY) {
          try {
            const { data: { user: creatorAuth } } = await admin.auth.admin.getUserById(creator_id)
            const recipientEmail = creatorAuth?.email
            if (recipientEmail) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
                body: JSON.stringify({
                  from: 'Nexart <noreply@nexart.fr>',
                  to: recipientEmail,
                  subject,
                  html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
                    <h2 style="color:#1A1A1A;margin-bottom:8px">Message de ${orgName}</h2>
                    <p style="color:#888;font-size:14px;margin-bottom:24px">Concernant l'événement : <strong>${safeEventTitle}</strong></p>
                    <div style="background:#F5F5F7;border-radius:10px;padding:20px;color:#1A1A1A;white-space:pre-wrap;font-size:15px;line-height:1.6">${safeMessage}</div>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/messages/${conv.id}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#6366F1;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">Répondre</a>
                  </div>`,
                }),
              })
            }
          } catch {
            // Email failure is non-blocking
          }
        }
      } catch (err) {
        errors.push(`Erreur inattendue pour ${creator_id}`)
      }
    }))

    return NextResponse.json({ sent, errors })
  } catch (err) {
    console.error('[bulk-message]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
