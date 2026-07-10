import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    console.error('Volunteers error:', error)
    return NextResponse.json({ error: 'Erreur chargement bénévoles' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
