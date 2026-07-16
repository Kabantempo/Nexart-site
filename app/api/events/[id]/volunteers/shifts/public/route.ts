export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('event_shifts')
      .select('id, role, date, time, capacity, assigned')
      .eq('event_id', params.id)
      .order('date', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error)?.message }, { status: 500 })
  }
}
