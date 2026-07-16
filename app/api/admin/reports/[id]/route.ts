export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = getAdminClient()
  try {
    const { data: { user }, error: authError } = await admin.auth.getUser(
      req.headers.get('Authorization')?.split(' ')[1]
    )
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { status, resolution_notes, action_taken } = body

    const validStatuses = ['open', 'resolved', 'dismissed', 'reviewing']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (resolution_notes) updateData.resolution_notes = resolution_notes
    if (action_taken) updateData.action_taken = action_taken
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await admin
      .from('reports')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, report: data })
  } catch (error: unknown) {
    console.error('PATCH /api/admin/reports/[id]:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
