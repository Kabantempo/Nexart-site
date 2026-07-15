export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, isStripeConfigured } from '@/lib/stripe'

// Portail client Stripe — gérer abonnement, factures, annulation
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  try {
    const { userId, returnUrl } = await req.json()

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', userId).single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 404 })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
