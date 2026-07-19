'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Zap, ArrowRight, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_PRICES, STRIPE_CREDIT_PRICES } from '@/lib/stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CREATOR_PLANS = [
  {
    name: 'Essentiel',
    price: 'Gratuit',
    period: 'Pour toujours',
    featured: false,
    priceId: null,
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      '2 candidatures le 1er mois, puis 1/mois',
      'Portfolio 10 photos',
      'Profil public créateur',
      'Messagerie avec les organisateurs',
      'Favoris événements & créateurs',
    ],
  },
  {
    name: 'Boost',
    price: '5,99€',
    period: '/mois',
    featured: false,
    priceId: STRIPE_PRICES.creator.boost.monthly,
    cta: "S'abonner",
    ctaHref: null,
    features: [
      '4 candidatures/mois',
      'Accès événements 24h avant les gratuits',
      'Portfolio 30 photos',
      'Mise en avant régionale',
      'Analytics basiques (vues, taux réponse)',
      'Badge "Créateur actif"',
    ],
  },
  {
    name: 'Pro',
    price: '14,99€',
    period: '/mois',
    featured: true,
    priceId: STRIPE_PRICES.creator.pro.monthly,
    cta: "S'abonner",
    ctaHref: null,
    features: [
      'Candidatures illimitées',
      'Accès événements 48h avant les gratuits',
      'Portfolio illimité',
      'Analytics avancés + recommandations',
      'Messagerie groupée complète',
      'Badge "Vérifié"',
      'Contrats personnalisés automatisés',
    ],
  },
  {
    name: 'Premium',
    price: '29,99€',
    period: '/mois',
    featured: false,
    priceId: STRIPE_PRICES.creator.premium.monthly,
    cta: "S'abonner",
    ctaHref: null,
    features: [
      'Tout le plan Pro',
      'Mise en avant homepage + newsletter',
      '3 crédits boost offerts/mois',
      'Stats comparatives vs autres créateurs',
      'Accès bêta nouvelles fonctionnalités',
      'Support prioritaire < 24h',
    ],
  },
]

const ORGANIZER_PLANS = [
  {
    name: 'Découverte',
    price: 'Gratuit',
    period: '',
    featured: false,
    priceId: null,
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      '1 événement actif à vie',
      'Vérification SIRET/RNA obligatoire',
      'Tarification simple (tarif unique)',
      'Contrat téléchargeable (template)',
      'Visibilité standard',
    ],
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/mois',
    featured: true,
    priceId: STRIPE_PRICES.organizer.pro.monthly,
    cta: "S'abonner",
    ctaHref: null,
    features: [
      'Événements illimités',
      '3 modèles de tarification (fixe, variable, %)',
      'Contrats auto-générés + pré-remplis',
      'Signature simple (SES) horodatée',
      'Messagerie groupée avec créateurs',
      'Analytics (candidatures, taux remplissage)',
      'Badge "Organisateur Vérifié"',
    ],
  },
  {
    name: 'Studio',
    price: '79€',
    period: '/mois',
    featured: false,
    priceId: STRIPE_PRICES.organizer.studio.monthly,
    cta: "S'abonner",
    ctaHref: null,
    features: [
      'Tout le plan Pro',
      'Calendrier multi-événements consolidé',
      'Signature avancée (SEA) + archivage légal',
      'Stats comparatives événements',
      'Accès multi-utilisateurs équipe',
      'Support prioritaire + accompagnement',
    ],
  },
]

const CREDITS_LIST = [
  { key: 'boost_x1',  label: '1 boost candidature',     price: '2,99€',  economy: null,           priceId: STRIPE_CREDIT_PRICES.boost_x1.id },
  { key: 'boost_x5',  label: '5 boosts candidature',    price: '12,99€', economy: 'économie 13%', priceId: STRIPE_CREDIT_PRICES.boost_x5.id },
  { key: 'boost_x10', label: '10 boosts candidature',   price: '24,99€', economy: 'économie 17%', priceId: STRIPE_CREDIT_PRICES.boost_x10.id },
  { key: 'boost_x20', label: '20 boosts candidature',   price: '44,99€', economy: 'économie 25%', priceId: STRIPE_CREDIT_PRICES.boost_x20.id },
  { key: 'event_x1',  label: '1 événement à la carte',  price: '9,99€',  economy: null,           priceId: STRIPE_CREDIT_PRICES.event_x1.id },
  { key: 'event_x3',  label: '3 événements à la carte', price: '24,99€', economy: 'économie 16%', priceId: STRIPE_CREDIT_PRICES.event_x3.id },
]

const FAQ = [
  { q: 'Puis-je annuler à tout moment ?', r: 'Oui, depuis votre tableau de bord → Facturation → Gérer mon abonnement. Aucun frais de résiliation.' },
  { q: 'Les crédits expirent-ils ?', r: "Oui, les crédits pay-as-you-go ont une validité de 6 mois à partir de la date d'achat." },
  { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui, upgrade ou downgrade depuis votre tableau de bord. La différence est calculée au prorata.' },
  { q: 'Les paiements sont-ils sécurisés ?', r: 'Oui, les paiements sont traités par Stripe, certifié PCI DSS niveau 1. Nexart ne stocke aucune donnée carte.' },
]

type Plan = {
  name: string
  price: string
  period: string
  featured: boolean
  priceId: string | null
  cta: string
  ctaHref: string | null
  features: string[]
}

const PLAN_TIER_MAP: Record<string, string> = {
  'Boost': 'boost', 'Pro': 'pro', 'Premium': 'premium',
  'Studio': 'org_studio',
}
const ORG_PLAN_TIER_MAP: Record<string, string> = {
  'Pro': 'org_pro', 'Studio': 'org_studio',
}

function PlanCard({ plan, delay = 0, onSubscribe, loading, currentTier, isOrganizer }: {
  plan: Plan
  delay?: number
  onSubscribe: (priceId: string, mode: 'subscription' | 'payment') => void
  loading: string | null
  currentTier: string | null
  isOrganizer?: boolean
}) {
  const dark = plan.featured
  const isLoading = loading === plan.priceId
  const tierMap = isOrganizer ? ORG_PLAN_TIER_MAP : PLAN_TIER_MAP
  const planTier = tierMap[plan.name] ?? null
  const isCurrentPlan = !!(currentTier && planTier && currentTier === planTier)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={dark ? {
        transform: 'scale(1.04)',
        boxShadow: '0 8px 40px rgba(99,102,241,0.35), 0 0 0 2px #6366F1',
        zIndex: 1,
      } : undefined}
      className={`relative flex flex-col gap-6 rounded-2xl p-7 ${
        dark
          ? 'bg-[#0F0C29] border-2 border-indigo-500'
          : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md'
      } transition-all duration-200`}
    >
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold whitespace-nowrap shadow-lg" style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.5)' }}>
          ⭐ Le plus populaire
        </div>
      )}

      <div>
        <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${dark ? 'text-indigo-400' : 'text-gray-400'}`}>{plan.name}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
          <span className={`text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>{plan.period}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 flex-1">
        {plan.features.map(f => (
          <li key={f} className={`flex items-start gap-2.5 text-sm ${dark ? 'text-white/75' : 'text-gray-600'}`}>
            <Check size={14} className={`shrink-0 mt-0.5 ${dark ? 'text-indigo-400' : 'text-gray-900'}`} />
            {f}
          </li>
        ))}
      </ul>

      {plan.priceId ? (
        isCurrentPlan ? (
          <div className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 ${
            dark ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 bg-indigo-50'
          }`}>
            <Check size={14} /> Plan actuel
          </div>
        ) : (
        <button
          onClick={() => onSubscribe(plan.priceId!, 'subscription')}
          disabled={!!loading}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
            dark
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <>{plan.cta} <ArrowRight size={14} /></>}
        </button>
        )
      ) : (
        <Link href={plan.ctaHref!}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
            dark
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}>
          {plan.cta} <ArrowRight size={14} />
        </Link>
      )}
    </motion.div>
  )
}

export default function OffresPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentTier, setCurrentTier] = useState<string | null>(null)
  const [tierLoading, setTierLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setTierLoading(false); return }
      const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', session.user.id).maybeSingle()
      if (profile) setCurrentTier((profile as any).subscription_tier ?? 'free')
      setTierLoading(false)
    })
  }, [])

  async function handleCheckout(priceId: string, mode: 'subscription' | 'payment') {
    setError(null)
    setLoading(priceId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/login?redirect=/offres`)
        return
      }

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode,
          userId: session.user.id,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/offres?payment=cancelled`,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Erreur lors de la création de la session')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(null)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)' }} className="min-h-screen">

      {/* Hero */}
      <div className="bg-[#06060f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-indigo-600/15 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-center gap-2 mb-5">
              <Zap size={13} className="text-indigo-400" />
              <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">Tarifs</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-4">
              Simple, transparent, adapté
            </h1>
            <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed">
              Gratuit pour commencer. Passez au niveau supérieur quand vous êtes prêt.
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Créateurs */}
        <section className="mt-16">
          <div className="mb-7">
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Pour les créateurs</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Artisans, indépendants, créateurs de toutes disciplines.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATOR_PLANS.map((p, i) => (
              <PlanCard key={p.name} plan={p} delay={i * 0.06} onSubscribe={handleCheckout} loading={loading} currentTier={currentTier} />
            ))}
          </div>
        </section>

        {/* Organisateurs */}
        <section className="mt-16">
          <div className="mb-7">
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Pour les organisateurs</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Marchés, pop-ups, salons, associations, collectivités.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {ORGANIZER_PLANS.map((p, i) => (
              <PlanCard key={p.name} plan={p} delay={i * 0.08} onSubscribe={handleCheckout} loading={loading} currentTier={currentTier} isOrganizer />
            ))}
          </div>
        </section>

        {/* Crédits */}
        <section className="mt-16">
          <div className="mb-7">
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Sans abonnement — Crédits à l&apos;unité</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Payez uniquement ce que vous utilisez. Valables 6 mois.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CREDITS_LIST.map((c, i) => (
              <motion.div key={c.key}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl border transition-all duration-150"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.label}</p>
                  {c.economy && <p className="text-xs text-emerald-600 font-medium mt-0.5">{c.economy}</p>}
                </div>
                <div className="text-right shrink-0 ml-3 flex flex-col items-end gap-1.5">
                  <p className="text-base font-black" style={{ color: 'var(--text-primary)' }}>{c.price}</p>
                  <button
                    onClick={() => handleCheckout(c.priceId, 'payment')}
                    disabled={!!loading}
                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-lg uppercase tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {loading === c.priceId ? <Loader2 size={10} className="animate-spin" /> : 'Acheter'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <div className="rounded-2xl border p-8 shadow-sm" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <h2 className="text-xl font-black mb-7" style={{ color: 'var(--text-primary)' }}>Questions fréquentes</h2>
            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border-color)' }}>
              {FAQ.map(({ q, r }) => (
                <div key={q} className="py-5 first:pt-0 last:pb-0">
                  <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{q}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
