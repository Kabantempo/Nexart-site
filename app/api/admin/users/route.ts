import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, role, is_admin, created_at', { count: 'exact' })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      data,
      count,
      limit,
      offset,
      total_pages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, action } = body

    if (action === 'ban') {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: true, banned_at: new Date().toISOString() })
        .eq('id', user_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'User banned' })
    }

    if (action === 'unban') {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: false, banned_at: null })
        .eq('id', user_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'User unbanned' })
    }

    if (action === 'make_admin') {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', user_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'User promoted to admin' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
