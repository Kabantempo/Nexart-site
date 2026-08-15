export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validate, newsletterSchema } from '@/lib/validate'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, error } = validate(newsletterSchema, body)
    if (error) return error
    const { email } = data

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: dbErr } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.toLowerCase().trim() })

    if (dbErr) {
      if (dbErr.code === '23505') {
        return NextResponse.json({ message: 'Vous êtes déjà inscrit !' }, { status: 200 })
      }
      return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 })
    }

    return NextResponse.json({ message: 'Inscription confirmée !' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
