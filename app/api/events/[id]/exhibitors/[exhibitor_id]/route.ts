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
    const body = await req.json()
    const { status, rejection_reason } = body

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: event } = await admin
      .from('events')
      .select('organizer_id')
      .eq('id', params.id)
      .single()

    if (event?.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = { status }
    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }

    const { data, error } = await (admin as any)
      .from('event_exhibitor_responses')
      .update(updateData)
      .eq('event_id', params.id)
      .eq('exhibitor_id', params.exhibitor_id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, exhibitor: data?.[0] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
