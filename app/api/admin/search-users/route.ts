import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const q = req.nextUrl.searchParams.get('q')
  if (!q || q.length < 2) return NextResponse.json({ users: [] })

  try {
    // Essayer avec subscription_tier
    const { data, error } = await admin
      .from('profiles')
      .select('id, full_name, role, subscription_tier, avatar_url')
      .ilike('full_name', `%${q}%`)
      .limit(10)

    if (error) {
      // Fallback sans subscription_tier si la colonne n'existe pas encore
      const { data: fallback, error: err2 } = await admin
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .ilike('full_name', `%${q}%`)
        .limit(10)

      if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })
      return NextResponse.json({ users: (fallback || []).map(u => ({ ...u, subscription_tier: 'free' })) })
    }

    return NextResponse.json({
      users: (data || []).map(u => ({ ...u, subscription_tier: u.subscription_tier ?? 'free' })),
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
