export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

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

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can view audit logs' },
        { status: 403 }
      )
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const action = searchParams.get('action')
    const resourceType = searchParams.get('resource_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sensitiveOnly = searchParams.get('sensitive_only') === 'true'

    // Build query
    let query = admin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (resourceType) {
      query = query.eq('resource_type', resourceType)
    }
    if (sensitiveOnly) {
      query = query.eq('accessed_sensitive_data', true)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      logs: data || [],
      total: count,
      limit,
      offset,
      page: Math.ceil(offset / limit) + 1,
    })
  } catch (error: unknown) {
    console.error('Audit logs error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// POST to manually log an action
export async function POST(req: NextRequest) {
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

    // Get request body
    const body = await req.json()
    const {
      action,
      resource_type,
      resource_id,
      description,
      changes,
      accessed_sensitive_data,
      sensitive_fields,
    } = body

    // Validate required fields
    if (!action || !resource_type) {
      return NextResponse.json(
        { error: 'action and resource_type required' },
        { status: 400 }
      )
    }

    // Get client IP
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Call stored procedure to log
    const { data, error } = await (admin as any).rpc('log_audit_action', {
      p_user_id: user.id,
      p_action: action.toUpperCase(),
      p_resource_type: resource_type,
      p_resource_id: resource_id,
      p_description: description,
      p_changes: changes,
      p_accessed_sensitive: accessed_sensitive_data || false,
      p_sensitive_fields: sensitive_fields,
      p_ip_address: ip,
      p_user_agent: userAgent,
    })

    if (error) throw error

    return NextResponse.json(
      { success: true, log_id: data },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Audit log creation error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to create audit log' },
      { status: 500 }
    )
  }
}
