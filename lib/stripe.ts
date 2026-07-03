import Stripe from 'stripe'

// ─── Plans & prix ─────────────────────────────────────────────────────────────
// À remplir avec les vrais Price IDs depuis le dashboard Stripe
export const STRIPE_PRICES = {
  creator: {
    boost:   { monthly: 'price_BOOST_MONTHLY',   amount: 599,  label: 'Boost',   tier: 'boost' },
    pro:     { monthly: 'price_PRO_MONTHLY',      amount: 1499, label: 'Pro',     tier: 'pro' },
    premium: { monthly: 'price_PREMIUM_MONTHLY',  amount: 2999, label: 'Premium', tier: 'premium' },
  },
  organizer: {
    pro:    { monthly: 'price_ORG_PRO_MONTHLY',    amount: 2900, label: 'Pro',    tier: 'org_pro' },
    studio: { monthly: 'price_ORG_STUDIO_MONTHLY', amount: 7900, label: 'Studio', tier: 'org_studio' },
  },
} as const

// ─── Crédits pay-as-you-go ────────────────────────────────────────────────────
export const STRIPE_CREDIT_PRICES = {
  boost_x1:  { id: 'price_BOOST_X1',  amount: 299,  credits: 1,  label: '1 boost candidature' },
  boost_x5:  { id: 'price_BOOST_X5',  amount: 1299, credits: 5,  label: '5 boosts candidature' },
  boost_x10: { id: 'price_BOOST_X10', amount: 2499, credits: 10, label: '10 boosts candidature' },
  boost_x20: { id: 'price_BOOST_X20', amount: 4499, credits: 20, label: '20 boosts candidature' },
  event_x1:  { id: 'price_EVENT_X1',  amount: 999,  credits: 1,  label: '1 événement à la carte' },
  event_x3:  { id: 'price_EVENT_X3',  amount: 2499, credits: 3,  label: '3 événements à la carte' },
} as const

export type SubscriptionTier = 'free' | 'boost' | 'pro' | 'premium' | 'org_pro' | 'org_studio'

// ─── Limites par tier ─────────────────────────────────────────────────────────
export const TIER_LIMITS: Record<SubscriptionTier, {
  candidatures_per_month: number | 'unlimited'
  portfolio_photos: number | 'unlimited'
  boutique_items: number | false
  boutique_commission: number | false
  analytics: 'none' | 'basic' | 'advanced'
  early_access_hours: number
  events_active: number | 'unlimited'
}> = {
  free:       { candidatures_per_month: 1,           portfolio_photos: 10,          boutique_items: false, boutique_commission: false, analytics: 'none',     early_access_hours: 0,  events_active: 1 },
  boost:      { candidatures_per_month: 4,           portfolio_photos: 30,          boutique_items: false, boutique_commission: false, analytics: 'basic',    early_access_hours: 24, events_active: 1 },
  pro:        { candidatures_per_month: 'unlimited', portfolio_photos: 'unlimited', boutique_items: 20,    boutique_commission: 0.08,  analytics: 'advanced', early_access_hours: 48, events_active: 1 },
  premium:    { candidatures_per_month: 'unlimited', portfolio_photos: 'unlimited', boutique_items: 50,    boutique_commission: 0.06,  analytics: 'advanced', early_access_hours: 48, events_active: 1 },
  org_pro:    { candidatures_per_month: 'unlimited', portfolio_photos: 'unlimited', boutique_items: false, boutique_commission: false, analytics: 'basic',    early_access_hours: 0,  events_active: 'unlimited' },
  org_studio: { candidatures_per_month: 'unlimited', portfolio_photos: 'unlimited', boutique_items: false, boutique_commission: false, analytics: 'advanced', early_access_hours: 0,  events_active: 'unlimited' },
}

// ─── Singleton Stripe server ───────────────────────────────────────────────────
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('XXXX')) {
    throw new Error('STRIPE_SECRET_KEY non configurée — en attente des papiers Stripe')
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-05-28.basil' })
  }
  return stripeInstance
}

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('XXXX'))
}
