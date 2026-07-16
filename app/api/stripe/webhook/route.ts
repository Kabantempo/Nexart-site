export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured, SubscriptionTier } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'
import { sendMail } from '@/lib/mailer'

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

        await admin.from('credit_transactions').insert({
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
            html: `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F4F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F8;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#DC2626,#B91C1C);padding:40px 48px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">⚠️ Votre paiement a échoué</h1>
  </td></tr>
  <tr><td style="padding:32px 48px;">
    <p style="color:#374151;font-size:15px;line-height:1.6;">Nous n'avons pas pu traiter votre paiement pour votre abonnement Nexart.</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Pour continuer à bénéficier de votre abonnement, veuillez mettre à jour votre moyen de paiement.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
      <tr><td style="background:#6366F1;border-radius:12px;">
        <a href="https://nexart.fr/dashboard?tab=billing" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">Mettre à jour mon paiement →</a>
      </td></tr>
    </table>
    <p style="color:#9CA3AF;font-size:13px;margin-top:24px;">Si vous avez des questions, contactez-nous à <a href="mailto:contact@nexart.fr" style="color:#6366F1;">contact@nexart.fr</a></p>
  </td></tr>
  <tr><td style="padding:16px 48px 24px;border-top:1px solid #F1F5F9;">
    <p style="margin:0;color:#94A3B8;font-size:12px;">© 2026 Nexart · <a href="https://nexart.fr" style="color:#6366F1;text-decoration:none;">nexart.fr</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
          })
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
