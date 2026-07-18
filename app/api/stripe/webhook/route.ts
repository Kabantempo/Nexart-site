export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured, SubscriptionTier, STRIPE_PRICES, STRIPE_CREDIT_PRICES } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'
import { sendMail } from '@/lib/mailer'
import { emailPaymentFailed } from '@/lib/email-templates'

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  [STRIPE_PRICES.creator.boost.monthly]:    STRIPE_PRICES.creator.boost.tier,
  [STRIPE_PRICES.creator.pro.monthly]:      STRIPE_PRICES.creator.pro.tier,
  [STRIPE_PRICES.creator.premium.monthly]:  STRIPE_PRICES.creator.premium.tier,
  [STRIPE_PRICES.organizer.pro.monthly]:    STRIPE_PRICES.organizer.pro.tier,
  [STRIPE_PRICES.organizer.studio.monthly]: STRIPE_PRICES.organizer.studio.tier,
}

const PRICE_TO_CREDITS: Record<string, { type: string; amount: number }> = {
  [STRIPE_CREDIT_PRICES.boost_x1.id]:  { type: 'boost_candidature', amount: STRIPE_CREDIT_PRICES.boost_x1.credits },
  [STRIPE_CREDIT_PRICES.boost_x5.id]:  { type: 'boost_candidature', amount: STRIPE_CREDIT_PRICES.boost_x5.credits },
  [STRIPE_CREDIT_PRICES.boost_x10.id]: { type: 'boost_candidature', amount: STRIPE_CREDIT_PRICES.boost_x10.credits },
  [STRIPE_CREDIT_PRICES.boost_x20.id]: { type: 'boost_candidature', amount: STRIPE_CREDIT_PRICES.boost_x20.credits },
  [STRIPE_CREDIT_PRICES.event_x1.id]:  { type: 'event_creation',    amount: STRIPE_CREDIT_PRICES.event_x1.credits },
  [STRIPE_CREDIT_PRICES.event_x3.id]:  { type: 'event_creation',    amount: STRIPE_CREDIT_PRICES.event_x3.credits },
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

        await sendPushToUsers([uid], '✅ Abonnement activé', `Votre abonnement ${tier} est maintenant actif.`, '/dashboard')
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from('credit_transactions').insert({
          user_id: uid,
          credit_type: creditDef.type,
          payment_intent_id: session.payment_intent,
          credits_bought: creditDef.amount,
          amount_paid: item.amount_total,
        })

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
      const invoice = event.data.object as { subscription?: string; customer_email?: string; amount_due?: number }
      console.error('Paiement échoué pour subscription:', invoice.subscription)

      if (userId) {
        await admin.from('notifications').insert({
          user_id: userId,
          type: 'payment_failed',
          title: 'Échec de paiement',
          body: 'Votre paiement a échoué. Mettez à jour votre moyen de paiement.',
          link: '/dashboard?tab=billing',
        })
        await sendPushToUsers([userId], '⚠️ Paiement échoué', 'Mettez à jour votre moyen de paiement.', '/dashboard?tab=billing')

        // Email de relance
        const customerEmail = invoice.customer_email
        if (customerEmail) {
          await sendMail({
            to: customerEmail,
            subject: '⚠️ Échec de paiement — Nexart',
            html: emailPaymentFailed(invoice.amount_due ? `${(invoice.amount_due / 100).toFixed(2)} €` : ''),
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
