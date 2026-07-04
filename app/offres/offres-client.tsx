'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Zap, Lock, ArrowRight } from 'lucide-react'

const CREATOR_PLANS = [
  {
    name: 'Essentiel',
    price: 'Gratuit',
    period: 'Pour toujours',
    featured: false,
    comingSoon: false,
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
    comingSoon: true,
    cta: 'Bientôt disponible',
    ctaHref: '/contact',
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
    comingSoon: true,
    cta: 'Bientôt disponible',
    ctaHref: '/contact',
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
    comingSoon: true,
    cta: 'Bientôt disponible',
    ctaHref: '/contact',
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
    comingSoon: false,
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
    comingSoon: true,
    cta: 'Bientôt disponible',
    ctaHref: '/contact',
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
    comingSoon: true,
    cta: 'Bientôt disponible',
    ctaHref: '/contact',
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

const CREDITS = [
  { label: '1 boost candidature',     price: '2,99€',  economy: null },
  { label: '5 boosts candidature',    price: '12,99€', economy: 'économie 13%' },
  { label: '10 boosts candidature',   price: '24,99€', economy: 'économie 17%' },
  { label: '20 boosts candidature',   price: '44,99€', economy: 'économie 25%' },
  { label: '1 événement à la carte',  price: '9,99€',  economy: null },
  { label: '3 événements à la carte', price: '24,99€', economy: 'économie 16%' },
]

type Plan = typeof CREATOR_PLANS[0]

function PlanCard({ plan, delay = 0 }: { plan: Plan; delay?: number }) {
  const dark = plan.featured

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col gap-6 rounded-2xl p-7 ${
        dark
          ? 'bg-[#0F0C29] border-2 border-indigo-500/40 shadow-xl shadow-indigo-900/20'
          : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md'
      } transition-all duration-200`}
    >
      {plan.featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-bold whitespace-nowrap shadow-sm">
          Le plus populaire
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

      {plan.comingSoon ? (
        <div className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold ${
          dark ? 'border-white/10 text-white/30 bg-white/5' : 'border-gray-100 text-gray-400 bg-gray-50'
        }`}>
          <Lock size={13} /> Bientôt disponible
        </div>
      ) : (
        <Link href={plan.ctaHref}
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

const FAQ = [
  { q: 'Quand les abonnements seront-ils disponibles ?', r: "Très prochainement — les paiements sont en cours d'activation. Vous serez notifié dès que c'est live." },
  { q: 'Les crédits expirent-ils ?', r: 'Oui, les crédits pay-as-you-go ont une validité de 6 mois à partir de la date d\'achat.' },
  { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment depuis votre tableau de bord.' },
]

export default function OffresPageClient() {
  return (
    <div className="bg-white min-h-screen">

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
            <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed mb-8">
              Gratuit pour commencer. Passez au niveau supérieur quand vous êtes prêt.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Zap size={12} className="text-indigo-400" />
              <span className="text-xs text-indigo-300 font-medium">Abonnements disponibles dès l&apos;activation de Stripe</span>
            </div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">

        {/* Créateurs */}
        <section className="mt-16">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Pour les créateurs</h2>
            <p className="text-sm text-gray-400">Artisans, indépendants, créateurs de toutes disciplines.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATOR_PLANS.map((p, i) => <PlanCard key={p.name} plan={p} delay={i * 0.06} />)}
          </div>
        </section>

        {/* Organisateurs */}
        <section className="mt-16">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Pour les organisateurs</h2>
            <p className="text-sm text-gray-400">Marchés, pop-ups, salons, associations, collectivités.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {ORGANIZER_PLANS.map((p, i) => <PlanCard key={p.name} plan={p} delay={i * 0.08} />)}
          </div>
        </section>

        {/* Crédits */}
        <section className="mt-16">
          <div className="mb-7">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Sans abonnement — Crédits à l&apos;unité</h2>
            <p className="text-sm text-gray-400">Payez uniquement ce que vous utilisez. Valables 6 mois.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CREDITS.map((c, i) => (
              <motion.div key={c.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-150">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                  {c.economy && <p className="text-xs text-emerald-600 font-medium mt-0.5">{c.economy}</p>}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-base font-black text-gray-900">{c.price}</p>
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wide mt-0.5">Bientôt</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 mb-7">Questions fréquentes</h2>
            <div className="flex flex-col divide-y divide-gray-50">
              {FAQ.map(({ q, r }) => (
                <div key={q} className="py-5 first:pt-0 last:pb-0">
                  <p className="text-sm font-bold text-gray-900 mb-1.5">{q}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
