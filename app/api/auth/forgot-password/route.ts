import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // 3 demandes par heure par IP
  if (!rateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans une heure.' },
      { status: 429 }
    )
  }

  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email manquant.' }, { status: 400 })
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Réponse générique — ne pas révéler si l'email existe
  return NextResponse.json({ message: 'Si cet email existe, un lien a été envoyé.' })
}
