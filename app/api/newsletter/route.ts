export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Table requise dans Supabase :
// create table newsletter_subscribers (
//   id uuid default gen_random_uuid() primary key,
//   email text unique not null,
//   created_at timestamp with time zone default now()
// );
// alter table newsletter_subscribers enable row level security;
// create policy "insert_newsletter" on newsletter_subscribers for insert with check (true);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.toLowerCase().trim() })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Vous êtes déjà inscrit !' }, { status: 200 })
      }
      return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Inscription confirmée !' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
