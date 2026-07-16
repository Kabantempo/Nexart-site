export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; volunteer_id: string } }
) {
  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('event_volunteers')
      .delete()
      .eq('id', params.volunteer_id)
      .eq('event_id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /volunteers/[volunteer_id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
