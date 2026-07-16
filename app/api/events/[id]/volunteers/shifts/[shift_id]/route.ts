export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; shift_id: string } }
) {
  try {
    const supabase = getAdminClient()
    const { error } = await supabase
      .from('event_shifts')
      .delete()
      .eq('id', params.shift_id)
      .eq('event_id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /volunteers/shifts/[shift_id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
