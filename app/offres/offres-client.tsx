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
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        borderRadius: '16px',
        padding: '28px',
        backgroundColor: dark ? '#0F0C29' : '#ffffff',
        border: dark ? '2px solid #6366F1' : '1px solid #F3F4F6',
        transition: 'all 200ms',
        ...(dark ? {
          transform: 'scale(1.04)',
          boxShadow: '0 8px 40px rgba(99,102,241,0.35), 0 0 0 2px #6366F1',
          zIndex: 1,
        } : {}),
      }}
      onMouseEnter={e => { if (!dark) { (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' } }}
      onMouseLeave={e => { if (!dark) { (e.currentTarget as HTMLDivElement).style.borderColor = '#F3F4F6'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' } }}
    >
      {plan.featured && (
        <div style={{ position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#4F46E5', color: '#fff', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(99,102,241,0.5)' }}>
          ⭐ Le plus populaire
        </div>
      )}

      <div>
        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', color: dark ? '#818CF8' : '#9CA3AF' }}>{plan.name}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '30px', fontWeight: 900, color: dark ? '#fff' : '#111827' }}>{plan.price}</span>
          <span style={{ fontSize: '14px', color: dark ? 'rgba(255,255,255,0.4)' : '#9CA3AF' }}>{plan.period}</span>
        </div>
      </div>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, listStyle: 'none', margin: 0, padding: 0 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: dark ? 'rgba(255,255,255,0.75)' : '#4B5563' }}>
            <Check size={14} color={dark ? '#818CF8' : '#111827'} style={{ flexShrink: 0, marginTop: '2px' }} />
            {f}
          </li>
        ))}
      </ul>

      {plan.priceId ? (
        isCurrentPlan ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: `2px solid ${dark ? '#818CF8' : '#C7D2FE'}`, color: dark ? '#A5B4FC' : '#4F46E5', backgroundColor: dark ? 'rgba(99,102,241,0.1)' : '#EEF2FF' }}>
            <Check size={14} /> Plan actuel
          </div>
        ) : (
          <button
            onClick={() => onSubscribe(plan.priceId!, 'subscription')}
            disabled={!!loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'background-color 200ms', backgroundColor: dark ? '#4F46E5' : '#111827', color: '#fff' }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark ? '#4338CA' : '#1F2937' }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark ? '#4F46E5' : '#111827' }}
          >
            {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <>{plan.cta} <ArrowRight size={14} /></>}
          </button>
        )
      ) : (
        <Link href={plan.ctaHref!}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', transition: 'background-color 200ms', backgroundColor: dark ? '#4F46E5' : '#111827', color: '#fff' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = dark ? '#4338CA' : '#1F2937' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = dark ? '#4F46E5' : '#111827' }}>
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
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .offres-creator-grid { display: grid; grid-template-columns: 1fr; gap: 16px }
        @media (min-width: 640px) { .offres-creator-grid { grid-template-columns: repeat(2, 1fr) } }
        @media (min-width: 1024px) { .offres-creator-grid { grid-template-columns: repeat(4, 1fr) } }
        .offres-org-grid { display: grid; grid-template-columns: 1fr; gap: 16px }
        @media (min-width: 640px) { .offres-org-grid { grid-template-columns: repeat(3, 1fr) } }
        .offres-credits-grid { display: grid; grid-template-columns: 1fr; gap: 12px }
        @media (min-width: 640px) { .offres-credits-grid { grid-template-columns: repeat(2, 1fr) } }
        @media (min-width: 1024px) { .offres-credits-grid { grid-template-columns: repeat(3, 1fr) } }
      `}</style>

      {/* Hero */}
      <div style={{ backgroundColor: '#06060f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: '-128px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.15)', filter: 'blur(100px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '80px 16px 64px', position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <Zap size={13} color="#818CF8" />
              <span style={{ color: '#818CF8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tarifs</span>
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '16px' }}>
              Simple, transparent, adapté
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '384px', margin: '0 auto', lineHeight: 1.6 }}>
              Gratuit pour commencer. Passez au niveau supérieur quand vous êtes prêt.
            </p>
          </motion.div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 16px 96px' }}>

        {error && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Créateurs */}
        <section style={{ marginTop: '64px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px', color: 'var(--text-primary)' }}>Pour les créateurs</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Artisans, indépendants, créateurs de toutes disciplines.</p>
          </div>
          <div className="offres-creator-grid">
            {CREATOR_PLANS.map((p, i) => (
              <PlanCard key={p.name} plan={p} delay={i * 0.06} onSubscribe={handleCheckout} loading={loading} currentTier={currentTier} />
            ))}
          </div>
        </section>

        {/* Organisateurs */}
        <section style={{ marginTop: '64px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px', color: 'var(--text-primary)' }}>Pour les organisateurs</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Marchés, pop-ups, salons, associations, collectivités.</p>
          </div>
          <div className="offres-org-grid">
            {ORGANIZER_PLANS.map((p, i) => (
              <PlanCard key={p.name} plan={p} delay={i * 0.08} onSubscribe={handleCheckout} loading={loading} currentTier={currentTier} isOrganizer />
            ))}
          </div>
        </section>

        {/* Crédits */}
        <section style={{ marginTop: '64px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '4px', color: 'var(--text-primary)' }}>Sans abonnement — Crédits à l&apos;unité</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Payez uniquement ce que vous utilisez. Valables 6 mois.</p>
          </div>
          <div className="offres-credits-grid">
            {CREDITS_LIST.map((c, i) => (
              <motion.div key={c.key}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', transition: 'border-color 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#C7D2FE' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)' }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</p>
                  {c.economy && <p style={{ fontSize: '12px', color: '#059669', fontWeight: 500, marginTop: '2px' }}>{c.economy}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <p style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>{c.price}</p>
                  <button
                    onClick={() => handleCheckout(c.priceId, 'payment')}
                    disabled={!!loading}
                    style={{ fontSize: '10px', fontWeight: 700, color: '#fff', backgroundColor: '#4F46E5', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: loading && loading !== c.priceId ? 0.6 : 1, transition: 'background-color 150ms' }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4338CA' }}
                    onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4F46E5' }}
                  >
                    {loading === c.priceId ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : 'Acheter'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: '64px' }}>
          <div style={{ borderRadius: '16px', border: '1px solid var(--border-color)', padding: '32px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', backgroundColor: 'var(--card-bg)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '28px', color: 'var(--text-primary)' }}>Questions fréquentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FAQ.map(({ q, r }, i) => (
                <div key={q} style={{ padding: '20px 0', borderTop: i === 0 ? 'none' : '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>{q}</p>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{r}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
