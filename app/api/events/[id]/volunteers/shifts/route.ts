import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_shifts')
      .select('*')
      .eq('event_id', params.id)
      .order('date', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Shifts error:', error)
    return NextResponse.json({ error: 'Erreur chargement créneaux' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { date, time, capacity, role } = body

    const { data, error } = await supabase
      .from('event_shifts')
      .insert([
        {
          event_id: params.id,
          date,
          time,
          capacity,
          role: role || null,
          assigned: 0,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('Shifts POST error:', error)
    return NextResponse.json({ error: 'Erreur création créneau' }, { status: 500 })
  }
}
