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

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      status: z.enum(['open', 'resolved', 'dismissed', 'reviewing']).optional(),
      resolution_notes: z.string().max(2000).optional(),
      action_taken: z.string().max(500).optional(),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { status, resolution_notes, action_taken } = body

    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (resolution_notes) updateData.resolution_notes = resolution_notes
    if (action_taken) updateData.action_taken = action_taken
    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data, error } = await admin
      .from('reports')
      .update(updateData as any)
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
