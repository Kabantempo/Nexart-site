export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; exhibitor_id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const admin = getAdminClient()
  try {
    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'paid', 'cancelled', 'stand_proposed', 'accepted', 'awaiting_payment']),
      rejection_reason: z.string().max(1000).optional(),
      proposed_stand: z.object({
        size: z.string().max(100),
        price: z.number().min(0),
        note: z.string().max(500).optional(),
      }).optional(),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { status: clientStatus, rejection_reason, proposed_stand } = body

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: event } = await admin
      .from('events')
      .select('organizer_id, title')
      .eq('id', params.id)
      .single()

    if (event?.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Map client status to DB status
    const dbStatus =
      clientStatus === 'approved' ? 'accepted' :
      clientStatus === 'rejected' ? 'refused' :
      clientStatus

    const updateData: any = { status: dbStatus }
    if (rejection_reason) updateData.rejection_reason = rejection_reason
    if (proposed_stand) updateData.proposed_stand = proposed_stand

    const { data, error } = await (admin as any)
      .from('applications')
      .update(updateData)
      .eq('event_id', params.id)
      .eq('id', params.exhibitor_id)
      .select('id, creator_id')
      .single()

    if (error) throw error

    // Notify creator on stand events
    if (data?.creator_id && (dbStatus === 'stand_proposed' || dbStatus === 'accepted' || dbStatus === 'awaiting_payment')) {
      const notifTitle = dbStatus === 'stand_proposed'
        ? 'Proposition de stand'
        : dbStatus === 'awaiting_payment'
        ? 'Stand attribue — paiement en attente'
        : 'Votre contre-offre a ete acceptee'
      const notifBody = dbStatus === 'stand_proposed'
        ? `L'organisateur de "${event?.title}" vous propose un stand${proposed_stand ? ` (${proposed_stand.size} · ${proposed_stand.price} EUR)` : ''}. Consultez votre dashboard pour repondre.`
        : dbStatus === 'awaiting_payment'
        ? `Votre stand a ete confirme pour "${event?.title}"${proposed_stand ? ` : ${proposed_stand.size} · ${proposed_stand.price} EUR` : ''}. Le paiement est maintenant attendu.`
        : `L'organisateur de "${event?.title}" a accepte votre contre-offre. Votre participation est confirmee.`
      const notifType = dbStatus === 'stand_proposed' ? 'stand_proposed' : dbStatus === 'awaiting_payment' ? 'awaiting_payment' : 'stand_accepted'
      await admin.from('notifications').insert({
        user_id: data.creator_id,
        type: notifType,
        title: notifTitle,
        body: notifBody,
        link: '/dashboard',
      })
    }

    return NextResponse.json({ success: true, exhibitor: data })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
