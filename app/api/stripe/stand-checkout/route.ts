export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const COMMISSION_PCT = Number(process.env.NEXART_COMMISSION_PCT ?? 8) / 100

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authErr || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { application_id } = await req.json()
  if (!application_id) return NextResponse.json({ error: 'application_id requis' }, { status: 400 })

  const admin = getAdminClient()

  // Récupérer la candidature + l'événement
  const { data: app, error: appErr } = await (admin as any)
    .from('applications')
    .select('id, creator_id, event_id, status, stripe_payment_id, events(title, stand_price, organizer_id)')
    .eq('id', application_id)
    .eq('creator_id', user.id)
    .maybeSingle()

  if (appErr || !app) return NextResponse.json({ error: 'Candidature introuvable' }, { status: 404 })
  if (app.status !== 'accepted') return NextResponse.json({ error: 'Candidature non acceptée' }, { status: 400 })
  if (app.stripe_payment_id) return NextResponse.json({ error: 'Déjà payé' }, { status: 400 })

  const event = app.events
  if (!event?.stand_price) return NextResponse.json({ error: 'Prix du stand non défini' }, { status: 400 })

  const amountCents = Math.round(event.stand_price * 100)
  const commissionCents = Math.round(amountCents * COMMISSION_PCT)

  const stripe = getStripe()

  // Récupérer ou créer le customer Stripe
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? '',
      name: profile?.full_name ?? '',
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await (admin as any).from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  // Check if organizer has an active Connect account
  const { data: orgProfile } = await (admin as any)
    .from('organizer_profiles')
    .select('stripe_account_id, stripe_connect_status')
    .eq('user_id', event.organizer_id)
    .maybeSingle()

  const hasConnect = orgProfile?.stripe_connect_status === 'active' && orgProfile?.stripe_account_id

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'eur',
        unit_amount: amountCents,
        product_data: {
          name: `Stand — ${event.title}`,
          description: `Commission Nexart (${COMMISSION_PCT * 100}%) incluse`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      type: 'stand_payment',
      application_id,
      event_id: app.event_id,
      creator_id: user.id,
      organizer_id: event.organizer_id,
      amount_cents: String(amountCents),
      commission_cents: String(commissionCents),
      connect_account_id: hasConnect ? orgProfile.stripe_account_id : '',
    },
    ...(hasConnect && {
      payment_intent_data: {
        application_fee_amount: commissionCents,
        transfer_data: { destination: orgProfile.stripe_account_id },
      },
    }),
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexart.fr'}/stripe/success?type=stand&event_id=${app.event_id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexart.fr'}/events/${app.event_id}?payment=cancelled`,
  })

  return NextResponse.json({ url: session.url })
}
