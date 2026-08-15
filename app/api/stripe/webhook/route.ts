export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured, SubscriptionTier, STRIPE_PRICES, STRIPE_CREDIT_PRICES } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'
import { sendMail } from '@/lib/mailer'
import { emailPaymentFailed, emailStandPaymentConfirmed } from '@/lib/email-templates'

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

    // ── Paiement one-shot réussi (stand ou crédits) ──────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as { id: string; mode: string; payment_intent?: string; metadata?: Record<string, string> }
      if (session.mode !== 'payment') break

      // ── Paiement stand ────────────────────────────────────────────────────
      if (session.metadata?.type === 'stand_payment') {
        const { application_id, creator_id, amount_cents, commission_cents } = session.metadata ?? {}
        const paymentId = session.payment_intent ?? session.id

        if (application_id) {
          // Idempotency: skip if already processed
          const { data: existing } = await (admin as any)
            .from('applications')
            .select('id, status, stripe_payment_id')
            .eq('id', application_id)
            .maybeSingle()

          if (existing?.stripe_payment_id && existing.stripe_payment_id === paymentId) break

          await (admin as any).from('applications').update({
            status: 'paid',
            stripe_payment_id: paymentId,
          }).eq('id', application_id)

          await admin.from('notifications').insert({
            user_id: creator_id,
            type: 'stand_paid',
            title: '✅ Paiement confirmé',
            body: 'Votre stand est réservé ! Retrouvez les détails dans votre tableau de bord.',
            link: `/events/${session.metadata?.event_id}`,
          })

          // Log transaction
          await (admin as any).from('stand_payments').insert({
            application_id,
            creator_id,
            event_id: session.metadata?.event_id,
            organizer_id: session.metadata?.organizer_id,
            amount_cents: Number(amount_cents ?? 0),
            commission_cents: Number(commission_cents ?? 0),
            stripe_payment_id: paymentId,
          }).catch(() => null)

          // Email confirmation au créateur
          const { data: creatorProfile } = await (admin as any)
            .from('profiles')
            .select('full_name, email')
            .eq('id', creator_id)
            .maybeSingle()
          const { data: eventData } = await (admin as any)
            .from('events')
            .select('title')
            .eq('id', session.metadata?.event_id)
            .maybeSingle()

          if (creatorProfile?.email) {
            const amount = `${(Number(amount_cents ?? 0) / 100).toFixed(2)} €`
            await sendMail({
              to: creatorProfile.email,
              subject: `✅ Paiement confirmé — ${eventData?.title ?? 'votre stand'}`,
              html: emailStandPaymentConfirmed(
                creatorProfile.full_name?.split(' ')[0] ?? 'vous',
                eventData?.title ?? '',
                amount,
                session.metadata?.event_id ?? '',
              ),
            }).catch(() => null)
          }
        }
        break
      }

      // ── Crédits pay-as-you-go ─────────────────────────────────────────────
      const uid = userId ?? session.metadata?.supabase_user_id
      if (!uid) break

      const stripeSession = await getStripe().checkout.sessions.retrieve(session.id, { expand: ['line_items'] })

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

    // ── Stripe Connect: compte mis à jour ────────────────────────────────────
    case 'account.updated': {
      const account = event.data.object as { id: string; charges_enabled: boolean; payouts_enabled: boolean; details_submitted: boolean }
      const { data: orgProfile } = await (admin as any)
        .from('organizer_profiles')
        .select('user_id, stripe_connect_status, stripe_connect_onboarded_at')
        .eq('stripe_account_id', account.id)
        .maybeSingle()

      if (!orgProfile) break

      let newStatus: string
      if (account.charges_enabled && account.payouts_enabled) {
        newStatus = 'active'
      } else if (account.details_submitted) {
        newStatus = 'restricted'
      } else {
        newStatus = 'pending'
      }

      if (newStatus !== orgProfile.stripe_connect_status) {
        await (admin as any).from('organizer_profiles').update({
          stripe_connect_status: newStatus,
          ...(newStatus === 'active' && !orgProfile.stripe_connect_onboarded_at ? { stripe_connect_onboarded_at: new Date().toISOString() } : {}),
        }).eq('user_id', orgProfile.user_id)

        if (newStatus === 'active' && orgProfile.stripe_connect_status !== 'active') {
          await admin.from('notifications').insert({
            user_id: orgProfile.user_id,
            type: 'stripe_connect_active',
            title: '✅ Paiements directs activés',
            body: 'Votre compte Stripe Connect est validé. Les paiements de stands vous sont maintenant versés directement.',
            link: '/dashboard',
          })
        }
      }
      break
    }

    // ── Remboursement stand ───────────────────────────────────────────────────
    case 'charge.refunded': {
      const charge = event.data.object as { payment_intent?: string; id: string }
      const paymentId = charge.payment_intent ?? charge.id

      const { data: app } = await (admin as any)
        .from('applications')
        .select('id, creator_id, event_id')
        .eq('stripe_payment_id', paymentId)
        .maybeSingle()

      if (app) {
        await (admin as any).from('applications').update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        }).eq('id', app.id)

        await (admin as any).from('stand_payments').update({
          status: 'refunded',
        }).eq('stripe_payment_id', paymentId).catch(() => null)

        await admin.from('notifications').insert({
          user_id: app.creator_id,
          type: 'stand_refunded',
          title: '↩️ Remboursement effectué',
          body: 'Votre paiement de stand a été remboursé.',
          link: `/events/${app.event_id}`,
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
