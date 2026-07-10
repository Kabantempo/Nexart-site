import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('event_team')
      .select(`
        *,
        profiles (id, full_name, email)
      `)
      .eq('event_id', params.id)

    if (error) throw error

    return NextResponse.json({ members: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { user_id, role } = body

    const { data, error } = await supabase
      .from('event_team')
      .insert({
        event_id: params.id,
        user_id,
        role: role || 'member'
      })
      .select(`
        *,
        profiles (id, full_name, email)
      `)

    if (error) throw error

    return NextResponse.json({ success: true, member: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
