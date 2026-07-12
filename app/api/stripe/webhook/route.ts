import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured, SubscriptionTier } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'

// Mapping Stripe Price ID → tier Nexart
// À remplir avec les vrais Price IDs quand Stripe est actif
const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  price_BOOST_MONTHLY:      'boost',
  price_PRO_MONTHLY:        'pro',
  price_PREMIUM_MONTHLY:    'premium',
  price_ORG_PRO_MONTHLY:    'org_pro',
  price_ORG_STUDIO_MONTHLY: 'org_studio',
}

const PRICE_TO_CREDITS: Record<string, { type: string; amount: number }> = {
  price_BOOST_X1:  { type: 'boost_candidature', amount: 1 },
  price_BOOST_X5:  { type: 'boost_candidature', amount: 5 },
  price_BOOST_X10: { type: 'boost_candidature', amount: 10 },
  price_BOOST_X20: { type: 'boost_candidature', amount: 20 },
  price_EVENT_X1:  { type: 'event_creation', amount: 1 },
  price_EVENT_X3:  { type: 'event_creation', amount: 3 },
}

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  if (!isStripeConfigured()) {
    return NextResponse.json({ received: true, skipped: 'stripe_not_configured' })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const userId = (event.data.object as { metadata?: { supabase_user_id?: string } }).metadata?.supabase_user_id

  switch (event.type) {

    // ── Abonnement créé / mis à jour ──────────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as unknown as { items: { data: { price: { id: string } }[] }; status: string; current_period_end: number; id: string; metadata?: { supabase_user_id?: string } }
      const priceId = sub.items.data[0]?.price.id
      const tier = PRICE_TO_TIER[priceId] ?? 'free'
      const uid = userId ?? sub.metadata?.supabase_user_id

      if (uid && sub.status === 'active') {
        await admin.from('profiles').update({
          subscription_tier: tier,
          subscription_status: 'active',
          subscription_id: sub.id,
          subscription_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
        } as any).eq('id', uid)

        await admin.from('notifications').insert({
          user_id: uid,
          type: 'subscription_activated',
          title: `Abonnement ${tier} activé`,
          body: 'Votre abonnement Nexart est maintenant actif.',
          link: '/dashboard',
        })
      }
      break
    }

    // ── Abonnement annulé ─────────────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as { metadata?: { supabase_user_id?: string } }
      const uid = userId ?? sub.metadata?.supabase_user_id
      if (uid) {
        await admin.from('profiles').update({
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          subscription_id: null,
          subscription_ends_at: null,
        } as any).eq('id', uid)
      }
      break
    }

    // ── Paiement one-shot réussi (crédits pay-as-you-go) ─────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as { mode: string; line_items?: { data: { price: { id: string } }[] }; metadata?: { supabase_user_id?: string }; payment_intent?: string }
      if (session.mode !== 'payment') break

      const uid = userId ?? session.metadata?.supabase_user_id
      if (!uid) break

      // Récupérer les line items pour identifier les crédits achetés
      const stripeSession = await getStripe().checkout.sessions.retrieve(
        (event.data.object as { id: string }).id,
        { expand: ['line_items'] }
      )

      for (const item of stripeSession.line_items?.data ?? []) {
        const priceId = item.price?.id ?? ''
        const creditDef = PRICE_TO_CREDITS[priceId]
        if (!creditDef) continue

        // Ajouter les crédits
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 6)

        await admin.from('credits').insert({
          user_id: uid,
          credit_type: creditDef.type,
          amount: creditDef.amount,
          expires_at: expiresAt.toISOString(),
        } as any)

        await (admin as any).from('credit_transactions').insert({
          user_id: uid,
          credit_type: creditDef.type,
          payment_intent_id: session.payment_intent,
          credits_bought: creditDef.amount,
          amount_paid: item.amount_total,
        } as any)

        await admin.from('notifications').insert({
          user_id: uid,
          type: 'credits_added',
          title: `${creditDef.amount} crédit${creditDef.amount > 1 ? 's' : ''} ajouté${creditDef.amount > 1 ? 's' : ''}`,
          body: `Vos crédits sont disponibles dans votre tableau de bord.`,
          link: '/dashboard',
        })
      }
      break
    }

    // ── Paiement échoué ───────────────────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as { subscription?: string; customer_email?: string }
      // TODO: envoyer email de relance + notif in-app
      console.error('Paiement échoué pour subscription:', invoice.subscription)
      break
    }
  }

  return NextResponse.json({ received: true })
}
