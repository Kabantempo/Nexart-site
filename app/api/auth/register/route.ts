import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // 3 inscriptions par heure par IP
  if (!rateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 }
    )
  }

  const { email, password, role, full_name } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, full_name } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Auto-generate username from full_name for creators
  if (data.user && full_name) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { generateUniqueUsername } = await import('@/lib/slugify')
    const username = await generateUniqueUsername(admin, full_name)
    await admin.from('profiles').update({ username }).eq('id', data.user.id)
  }

  return NextResponse.json({ user: data.user })
}
