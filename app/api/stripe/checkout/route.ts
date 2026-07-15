export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripe, isStripeConfigured, STRIPE_PRICES, STRIPE_CREDIT_PRICES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré — en attente des papiers' }, { status: 503 })
  }

  try {
    const { priceId, mode, userId, successUrl, cancelUrl } = await req.json()

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Récupérer ou créer le customer Stripe pour cet utilisateur
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id, full_name').eq('id', userId).single()

    const stripe = getStripe()
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const { data: { user } } = await admin.auth.admin.getUserById(userId)
      const customer = await stripe.customers.create({
        email: user?.email,
        name: profile?.full_name,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode === 'subscription' ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL}/offres?payment=cancelled`,
      metadata: { supabase_user_id: userId },
      ...(mode === 'subscription' && {
        subscription_data: { metadata: { supabase_user_id: userId } },
      }),
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
