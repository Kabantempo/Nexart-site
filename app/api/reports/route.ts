export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()

    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await admin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view reports' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error, count } = await admin
      .from('reports')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      reports: data || [],
      total: count,
      status,
      page: Math.ceil(offset / limit) + 1,
    })
  } catch (error: unknown) {
    console.error('Reports GET error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()

    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { validate: v, z } = await import('@/lib/validate')
    const reportPostSchema = z.object({
      reported_user_id: z.string().uuid().optional(),
      reported_post_id: z.string().uuid().optional(),
      reported_event_id: z.string().uuid().optional(),
      reason: z.enum(['spam', 'harassment', 'inappropriate', 'copyright', 'fraud', 'other']),
      description: z.string().max(2000).optional(),
    }).refine(d => d.reported_user_id || d.reported_post_id || d.reported_event_id, {
      message: 'Must report a user, post, or event',
    })
    const { data: body, error: validErr } = v(reportPostSchema, await req.json())
    if (validErr) return validErr
    const { reported_user_id, reported_post_id, reported_event_id, reason, description } = body

    // Get reporter IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // Create report
    const { data, error } = await admin
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_user_id: reported_user_id || null,
        reported_post_id: reported_post_id || null,
        reported_event_id: reported_event_id || null,
        reason,
        description: description || null,
        status: 'pending',
        ip_address: ip,
        created_at: new Date().toISOString(),
      } as any)
      .select()

    if (error) throw error

    return NextResponse.json(
      {
        success: true,
        report: data?.[0],
        message: 'Report submitted. Our team will review within 24-48 hours.',
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Report creation error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to create report' },
      { status: 500 }
    )
  }
}

// PATCH to update report status (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const admin = getAdminClient()

    // Get auth token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await admin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update reports' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { report_id, status, action_taken, notes } = body

    if (!report_id || !status) {
      return NextResponse.json(
        { error: 'report_id and status required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'reviewing', 'resolved', 'dismissed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Update report
    const { data, error } = await admin
      .from('reports')
      .update({
        status,
        action_taken: action_taken || null,
        resolution_notes: notes || null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', report_id)
      .select()

    if (error) throw error

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, report: data[0] })
  } catch (error: unknown) {
    console.error('Report update error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to update report' },
      { status: 500 }
    )
  }
}
