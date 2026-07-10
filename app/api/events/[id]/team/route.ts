import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_team')
      .select(`
        id,
        event_id,
        email,
        role,
        status,
        joined_at,
        created_at
      `)
      .eq('event_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Team GET error:', {
      event_id: params.id,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur chargement équipe', details: errorMsg },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await req.json()
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json(
        { error: 'email required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('event_team')
      .insert({
        event_id: params.id,
        email,
        role,
        status: 'invited',
      })
      .select()

    if (error) throw error

    console.log('✓ Team member invited:', {
      event_id: params.id,
      email,
      role,
    })

    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Team POST error:', {
      event_id: params.id,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur création membre équipe', details: errorMsg },
      { status: 500 }
    )
  }
}
