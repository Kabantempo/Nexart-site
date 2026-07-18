export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { validate, z } from '@/lib/validate'

async function getAuthUser(req: NextRequest) {
  const header = req.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error } = await anon.auth.getUser(header.slice(7))
    if (error || !user) return null
    return user
  } catch { return null }
}

const savedSearchSchema = z.object({
  label: z.string().min(2).max(100),
  disciplines: z.array(z.string().max(50)).max(10).optional().default([]),
  city: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  radius_km: z.number().int().min(5).max(500).optional().default(50),
  notify_email: z.boolean().optional().default(true),
  notify_push: z.boolean().optional().default(false),
})

// GET — list user's saved searches
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const admin = getAdminClient()
    const { data, error } = await admin.from('saved_searches').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ searches: data ?? [] })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message }, { status: 500 })
  }
}

// POST — create a saved search
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: body, error: validErr } = validate(savedSearchSchema, await req.json())
    if (validErr) return validErr
    const admin = getAdminClient()
    // Max 10 saved searches per user
    const { count } = await admin.from('saved_searches').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
    if ((count ?? 0) >= 10) return NextResponse.json({ error: 'Maximum 10 alertes sauvegardées' }, { status: 400 })
    const { data, error } = await admin.from('saved_searches').insert({ ...body, user_id: user.id }).select().single()
    if (error) throw error
    return NextResponse.json({ search: data }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message }, { status: 500 })
  }
}

// DELETE — remove a saved search
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
    const admin = getAdminClient()
    const { error } = await admin.from('saved_searches').delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message }, { status: 500 })
  }
}
