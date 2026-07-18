export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const searchParams = req.nextUrl.searchParams
    const city = searchParams.get('city')
    const region = searchParams.get('region')
    const status = searchParams.get('status') || 'published'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = admin.from('events')
      .select(`
        id, title, description, event_type, theme, location, city, region,
        start_date, end_date, stand_count, stand_price, cover_image,
        organizer_id, organizer:profiles!organizer_id(full_name, avatar_url),
        created_at
      `)
      .eq('status', status as 'draft' | 'published' | 'closed')
      .order('start_date', { ascending: true })
      .range(offset, offset + limit - 1)

    if (city) query = query.eq('city', city)
    if (region) query = query.eq('region', region)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ events: data || [] })
  } catch (error: unknown) {
    console.error('❌ Events GET error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur chargement événements', details: (error as Error)?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const { validate: v, eventCreateSchema, uuidSchema, z } = await import('@/lib/validate')
    const fullSchema = eventCreateSchema.extend({ organizer_id: uuidSchema, title: z.string().min(3).max(200) })
    const { data: body, error: validErr } = v(fullSchema, await req.json())
    if (validErr) return validErr
    const { organizer_id, title, description, event_type, start_date, end_date, location, city, region } = body

    const { data, error } = await admin.from('events').insert({
      organizer_id,
      title,
      description,
      event_type,
      start_date,
      end_date,
      location,
      city,
      region,
      status: 'draft',
    }).select().single()

    if (error) throw error
    return NextResponse.json({ event: data }, { status: 201 })
  } catch (error: unknown) {
    console.error('❌ Events POST error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur création événement', details: (error as Error)?.message }, { status: 500 })
  }
}
