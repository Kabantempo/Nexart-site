export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()

    // Get auth token (organizer only)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await admin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify organizer
    const { data: event } = await admin
      .from('events')
      .select('organizer_id')
      .eq('id', params.id)
      .single()

    if (event?.organizer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only event organizer can view responses' },
        { status: 403 }
      )
    }

    // Get all responses
    const { data, error, count } = await admin
      .from('exhibitor_responses')
      .select('*', { count: 'exact' })
      .eq('event_id', params.id)
      .order('submitted_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      exhibitors: data || [],
      total: count,
    })
  } catch (error: any) {
    console.error('Exhibitors GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch exhibitors' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()

    const body = await req.json()
    const { exhibitor_email, exhibitor_name, form_data } = body

    if (!exhibitor_email || !form_data) {
      return NextResponse.json(
        { error: 'exhibitor_email and form_data required' },
        { status: 400 }
      )
    }

    // Create response (public endpoint)
    const { data, error } = await admin
      .from('exhibitor_responses')
      .insert({
        event_id: params.id,
        exhibitor_email,
        exhibitor_name: exhibitor_name || null,
        form_data,
        status: 'pending',
      })
      .select()

    if (error) throw error

    return NextResponse.json(
      {
        success: true,
        exhibitor: data?.[0],
        message: 'Application submitted successfully. You will receive updates at ' + exhibitor_email,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Exhibitor POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit application' },
      { status: 500 }
    )
  }
}
