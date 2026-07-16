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
    const body = await req.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
    }

    const { data: invitedUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
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
      })

    if (insertError) throw insertError
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Team invite error:', { error: error?.message })
    return NextResponse.json({ error: 'Erreur invitation équipe', details: error?.message }, { status: 500 })
  }
}
