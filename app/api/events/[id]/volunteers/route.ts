export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_volunteers')
      .select('*')
      .eq('event_id', params.id)
      .eq('status', 'active')

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('❌ Volunteers GET error:', { event_id: params.id, error: error?.message })
    return NextResponse.json({ error: 'Erreur chargement bénévoles', details: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { name, email, shifts = [] } = body

    const { data, error } = await supabase
      .from('event_volunteers')
      .insert([
        {
          event_id: params.id,
          name,
          email,
          shifts,
          status: 'active',
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('Volunteers POST error:', error)
    return NextResponse.json({ error: 'Erreur création bénévole' }, { status: 500 })
  }
}
