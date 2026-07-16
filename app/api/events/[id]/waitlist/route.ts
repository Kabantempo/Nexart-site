export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUsers } from '@/lib/push'
import { sendMail } from '@/lib/mailer'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

// GET: List waitlist ordered by position
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { data, error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select(`
        id,
        position,
        status,
        created_at,
        profiles:creator_id (id, full_name, email, avatar_url)
      `)
      .eq('event_id', params.id)
      .order('position', { ascending: true })

    if (error) throw error
    return NextResponse.json({ waitlist: data || [] })
  } catch (error: unknown) {
    console.error('❌ Waitlist GET error:', { event_id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur chargement waitlist', details: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

// POST: Add creator to waitlist
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { creator_id, reason = 'Sold out' } = body
    if (!creator_id) return NextResponse.json({ error: 'creator_id required' }, { status: 400 })

    const { data: maxPos } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('position')
      .eq('event_id', params.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = (maxPos?.[0]?.position || 0) + 1

    const { data, error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .insert([{ event_id: params.id, creator_id, position: nextPosition, reason, status: 'waiting' }])
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: unknown) {
    console.error('❌ Waitlist POST error:', { event_id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur traitement waitlist', details: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

// PATCH: Promote waitlist entry (organizer only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { waitlist_id } = body
    if (!waitlist_id) return NextResponse.json({ error: 'waitlist_id required' }, { status: 400 })

    // Fetch creator info before promoting
    const { data: entry } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('creator_id, profiles:creator_id(full_name)')
      .eq('id', waitlist_id)
      .single()

    const { data: eventData } = await admin.from('events').select('title').eq('id', params.id).single()

    const { error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .update({ status: 'promoted' })
      .eq('id', waitlist_id)
      .eq('event_id', params.id)

    if (error) throw error

    // Notify promoted creator
    if (entry?.creator_id) {
      await admin.from('notifications').insert({
        user_id: entry.creator_id,
        type: 'waitlist_promoted',
        title: 'Une place est disponible !',
        body: `Une place s'est libérée pour "${eventData?.title}". Complétez votre inscription rapidement.`,
        link: `/events/${params.id}`,
      })
      await sendPushToUsers([entry.creator_id], '🎉 Une place est disponible !', `Une place s'est libérée pour "${eventData?.title}".`, `/events/${params.id}`)

      // Email via Resend / SMTP
      const { data: { user: creatorAuth } } = await admin.auth.admin.getUserById(entry.creator_id)
      if (creatorAuth?.email) {
        await sendMail({
          to: creatorAuth.email,
          subject: `🎉 Une place s'est libérée — ${eventData?.title}`,
          html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#6366F1,#4F46E5);padding:40px 48px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">🎉 Une place s'est libérée !</h1>
  </td></tr>
  <tr><td style="padding:32px 48px;">
    <p style="color:#374151;font-size:15px;line-height:1.6;">Bonne nouvelle ! Une place vient de se libérer pour <strong>${eventData?.title}</strong>.</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Vous étiez sur liste d'attente — vous pouvez maintenant compléter votre inscription.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
      <tr><td style="background:#6366F1;border-radius:12px;">
        <a href="https://nexart.fr/events/${params.id}" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Voir l'événement →</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:16px 48px 24px;border-top:1px solid #F1F5F9;">
    <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Nexart · <a href="https://nexart.fr" style="color:#6366F1;text-decoration:none;">nexart.fr</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
        })
      }
    }

    // Reorder remaining waiting entries
    const { data: remaining } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('id')
      .eq('event_id', params.id)
      .eq('status', 'waiting')
      .order('position', { ascending: true })

    for (let i = 0; i < (remaining?.length || 0); i++) {
      await admin.from('event_exhibitor_waitlist').update({ position: i + 1 }).eq('id', remaining![i].id)
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('❌ Waitlist PATCH error:', { event_id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur mise à jour waitlist', details: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

// DELETE: Remove from waitlist (organizer only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { waitlist_id } = body
    if (!waitlist_id) return NextResponse.json({ error: 'waitlist_id required' }, { status: 400 })

    const { error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .delete()
      .eq('id', waitlist_id)
      .eq('event_id', params.id)

    if (error) throw error

    // Reorder remaining
    const { data: remaining } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('id')
      .eq('event_id', params.id)
      .eq('status', 'waiting')
      .order('position', { ascending: true })

    for (let i = 0; i < (remaining?.length || 0); i++) {
      await admin.from('event_exhibitor_waitlist').update({ position: i + 1 }).eq('id', remaining![i].id)
    }

    return NextResponse.json({ success: true, remaining_count: remaining?.length })
  } catch (error: unknown) {
    console.error('❌ Waitlist DELETE error:', { event_id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur suppression waitlist', details: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
