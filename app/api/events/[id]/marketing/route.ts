import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminClient()
  try {
    const { data, error } = await (admin as any)
      .from('event_marketing_plan')
      .select('*')
      .eq('event_id', params.id)
      .single()

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ plan: null })
    }

    if (error) throw error

    return NextResponse.json({ plan: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { press_release, media_contacts, deadlines_calendar } = body

    const { data, error } = await (admin as any)
      .from('event_marketing_plan')
      .upsert({
        event_id: params.id,
        press_release,
        media_contacts: media_contacts || [],
        deadlines_calendar: deadlines_calendar || []
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, plan: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
