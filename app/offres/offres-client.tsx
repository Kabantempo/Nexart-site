'use client'

import Link from 'next/link'
import { Check, Zap, Lock } from 'lucide-react'

// ─── Plans créateurs ──────────────────────────────────────────────────────────
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
      'Boutique créateur (20 items, commission 8%)',
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
      'Boutique étendue (50 items, commission 6%)',
      'Mise en avant homepage + newsletter',
      '3 crédits boost offerts/mois',
      'Stats comparatives vs autres créateurs',
      'Accès bêta nouvelles fonctionnalités',
      'Support prioritaire < 24h',
    ],
  },
]

// ─── Plans organisateurs ──────────────────────────────────────────────────────
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

// ─── Crédits pay-as-you-go ────────────────────────────────────────────────────
const CREDITS = [
  { label: '1 boost candidature',    price: '2,99€', economy: null },
  { label: '5 boosts candidature',   price: '12,99€', economy: 'économie 13%' },
  { label: '10 boosts candidature',  price: '24,99€', economy: 'économie 17%' },
  { label: '20 boosts candidature',  price: '44,99€', economy: 'économie 25%' },
  { label: '1 événement à la carte', price: '9,99€', economy: null },
  { label: '3 événements à la carte',price: '24,99€', economy: 'économie 16%' },
]

function PlanCard({ plan }: { plan: typeof CREATOR_PLANS[0] }) {
  return (
    <div style={{
      padding: '28px',
      borderRadius: '16px',
      border: plan.featured ? '2px solid #111827' : '1px solid #E5E7EB',
      backgroundColor: plan.featured ? '#111827' : '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      position: 'relative',
    }}>
      {plan.featured && (
        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#111827', color: '#FFF', fontSize: '11px', fontWeight: '700', padding: '3px 12px', borderRadius: '99px', border: '1px solid #374151', whiteSpace: 'nowrap' }}>
          ⭐ Le plus populaire
        </div>
      )}
      <div>
        <p style={{ fontSize: '12px', fontWeight: '700', color: plan.featured ? 'rgba(255,255,255,0.5)' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{plan.name}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '32px', fontWeight: '800', color: plan.featured ? '#FFFFFF' : '#111827' }}>{plan.price}</span>
          <span style={{ fontSize: '13px', color: plan.featured ? 'rgba(255,255,255,0.4)' : '#9CA3AF' }}>{plan.period}</span>
        </div>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: plan.featured ? 'rgba(255,255,255,0.75)' : '#374151' }}>
            <Check size={14} style={{ flexShrink: 0, marginTop: '2px', color: plan.featured ? '#FFFFFF' : '#111827' }} />
            {f}
          </li>
        ))}
      </ul>

      {plan.comingSoon ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 20px', borderRadius: '10px', border: plan.featured ? '1px solid rgba(255,255,255,0.15)' : '1px solid #E5E7EB', backgroundColor: plan.featured ? 'rgba(255,255,255,0.06)' : '#F9FAFB', justifyContent: 'center', marginTop: 'auto' }}>
          <Lock size={13} color={plan.featured ? 'rgba(255,255,255,0.4)' : '#9CA3AF'} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: plan.featured ? 'rgba(255,255,255,0.4)' : '#9CA3AF' }}>Bientôt disponible</span>
        </div>
      ) : (
        <a href={plan.ctaHref} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px 20px', borderRadius: '10px', backgroundColor: plan.featured ? '#FFFFFF' : '#111827', color: plan.featured ? '#111827' : '#FFFFFF', fontSize: '14px', fontWeight: '700', textDecoration: 'none', marginTop: 'auto' }}>
          {plan.cta}
        </a>
      )}
    </div>
  )
}

export default function OffresPageClient() {
  return (
    <div style={{ backgroundColor: '#FAFAFA', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Hero */}
      <div style={{ backgroundColor: '#06060f', padding: '80px 24px 60px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366F1', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Tarifs</p>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: '800', color: '#FFFFFF', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Simple, transparent, adapté
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Gratuit pour commencer. Passez au niveau supérieur quand vous êtes prêt.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '20px', padding: '6px 14px', borderRadius: '99px', backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Zap size={12} color="#A5B4FC" />
          <span style={{ fontSize: '12px', color: '#A5B4FC', fontWeight: '600' }}>Abonnements disponibles dès l&apos;activation de Stripe</span>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>

        {/* Créateurs */}
        <div style={{ marginTop: '56px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Pour les créateurs</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>Artisans, indépendants, créateurs de toutes disciplines.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {CREATOR_PLANS.map(p => <PlanCard key={p.name} plan={p} />)}
          </div>
        </div>

        {/* Organisateurs */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Pour les organisateurs</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>Marchés, pop-ups, salons, associations, collectivités.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {ORGANIZER_PLANS.map(p => <PlanCard key={p.name} plan={p} />)}
          </div>
        </div>

        {/* Pay-as-you-go */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Sans abonnement — Crédits à l&apos;unité</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '28px' }}>Payez uniquement ce que vous utilisez. Valables 6 mois.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {CREDITS.map(c => (
              <div key={c.label} style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#111827', margin: 0 }}>{c.label}</p>
                  {c.economy && <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0 0' }}>{c.economy}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>{c.price}</p>
                  <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '2px 0 0', fontWeight: '600' }}>BIENTÔT</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ rapide */}
        <div style={{ marginTop: '64px', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '0 0 24px' }}>Questions fréquentes</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              { q: 'Quand les abonnements seront-ils disponibles ?', r: 'Très prochainement — les paiements sont en cours d\'activation. Vous serez notifié dès que c\'est live.' },
              { q: 'Les crédits expirent-ils ?', r: 'Oui, les crédits pay-as-you-go ont une validité de 6 mois à partir de la date d\'achat.' },
              { q: 'Puis-je changer de plan à tout moment ?', r: 'Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment depuis votre tableau de bord.' },
              { q: 'La commission sur les ventes boutique est-elle prélevée automatiquement ?', r: 'Oui, 8% (Pro) ou 6% (Premium) sont prélevés automatiquement à chaque vente via Stripe.' },
            ].map(({ q, r }) => (
              <div key={q} style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '20px' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>{q}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.6 }}>{r}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
