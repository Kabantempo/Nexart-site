export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Creator responds to a stand proposal: accept or counter-propose
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 })

  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const admin = getAdminClient()

  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
  if (authError || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  try {
    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      action: z.enum(['accept', 'counter']),
      proposed_stand: z.object({
        size: z.string().max(100),
        price: z.number().min(0),
        note: z.string().max(500).optional(),
      }).optional(),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { action, proposed_stand } = body

    // Fetch the application — verify it belongs to this creator and is in stand_proposed status
    const { data: app, error: appErr } = await (admin as any)
      .from('applications')
      .select('id, creator_id, event_id, status, proposed_stand')
      .eq('id', params.id)
      .single()

    if (appErr || !app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
    if (app.creator_id !== user.id) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
    if (app.status !== 'stand_proposed' && app.status !== 'counter_proposed') {
      return NextResponse.json({ error: 'Aucune proposition de stand en attente' }, { status: 400 })
    }
    if (action === 'counter' && !proposed_stand) {
      return NextResponse.json({ error: 'Donnees de contre-offre manquantes' }, { status: 400 })
    }

    // Fetch event for notification
    const { data: event } = await admin.from('events').select('organizer_id, title').eq('id', app.event_id).single()

    const updateData: any = action === 'accept'
      ? { status: 'accepted' }
      : { status: 'counter_proposed', proposed_stand }

    await (admin as any).from('applications').update(updateData).eq('id', params.id)

    // Notify organizer
    if (event?.organizer_id) {
      const notifTitle = action === 'accept' ? 'Proposition acceptee' : 'Contre-offre recue'
      const notifBody = action === 'accept'
        ? `Un createur a accepte votre proposition de stand pour "${event.title}".`
        : `Un createur a fait une contre-offre pour "${event.title}"${proposed_stand ? ` (${proposed_stand.size} · ${proposed_stand.price} EUR)` : ''}. Consultez la page exposants.`
      await admin.from('notifications').insert({
        user_id: event.organizer_id,
        type: action === 'accept' ? 'stand_accepted' : 'stand_counter',
        title: notifTitle,
        body: notifBody,
        link: `/events/${app.event_id}/exhibitors`,
      })
    }

    return NextResponse.json({ success: true, action })
  } catch (error: unknown) {
    console.error('POST /api/applications/[id]/respond:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
