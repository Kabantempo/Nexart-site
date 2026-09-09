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

    // Get all applications (profiles.email n'existe pas en prod — email via auth)
    const { data, error, count } = await admin
      .from('applications')
      .select('id, creator_id, status, created_at, proposed_stand, stripe_payment_id, profiles(full_name)', { count: 'exact' })
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch emails from auth for each unique creator
    const creatorIds = [...new Set((data || []).map((a: any) => a.creator_id))]
    const emailMap: Record<string, string> = {}
    for (const uid of creatorIds) {
      const { data: authUser } = await admin.auth.admin.getUserById(uid)
      if (authUser?.user?.email) emailMap[uid] = authUser.user.email
    }

    const exhibitors = (data || []).map((app: any) => ({
      id: app.id,
      exhibitor_id: app.creator_id,
      response_data: {},
      status: app.status === 'accepted' ? 'approved' : app.status === 'refused' ? 'rejected' : app.status,
      tables_count: 0,
      submitted_at: app.created_at,
      proposed_stand: app.proposed_stand ?? null,
      stripe_payment_id: app.stripe_payment_id ?? null,
      profiles: { full_name: app.profiles?.full_name ?? null, email: emailMap[app.creator_id] ?? null },
    }))

    return NextResponse.json({
      exhibitors,
      total: count,
    })
  } catch (error: unknown) {
    console.error('Exhibitors GET error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to fetch exhibitors' },
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

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      exhibitor_email: z.string().email(),
      exhibitor_name: z.string().max(200).optional(),
      form_data: z.record(z.string(), z.unknown()),
    })
    const { data: body, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { exhibitor_email, exhibitor_name, form_data } = body

    // Create response (public endpoint)
    const { data, error } = await admin
      .from('exhibitor_responses')
      .insert({
        event_id: params.id,
        exhibitor_email,
        exhibitor_name: exhibitor_name || null,
        form_data: form_data as any,
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
  } catch (error: unknown) {
    console.error('Exhibitor POST error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : String(error)) || 'Failed to submit application' },
      { status: 500 }
    )
  }
}
