export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = getAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Verify caller owns this event
    const { data: eventCheck } = await supabase.from('events').select('organizer_id').eq('id', eventId).single()
    if (!eventCheck || eventCheck.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['co-organizer', 'staff', 'volunteer', 'admin']),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { email, role } = body

    const { data: invitedUser, error: userError } = await (supabase as any)
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !invitedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { error: insertError } = await supabase
      .from('event_team')
      .insert({
        event_id: eventId,
        user_id: invitedUser.id,
        role: role,
        invited_by: user.id,
        joined_at: new Date().toISOString(),
      } as any)

    if (insertError) throw insertError
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: unknown) {
    console.error('❌ Team invite error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur invitation équipe' }, { status: 500 })
  }
}
