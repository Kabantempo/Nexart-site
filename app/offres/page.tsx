'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'

const PLANS = [
  {
    num: '01',
    name: 'Essentiel',
    price: 'Gratuit',
    period: 'Pour toujours',
    featured: false,
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      'Profil créateur public',
      'Candidatures illimitées',
      'Portfolio photos',
      'Messagerie avec les organisateurs',
      'Favoris',
    ],
  },
  {
    num: '02',
    name: 'Pro',
    price: 'Bientôt',
    period: 'Disponible prochainement',
    featured: true,
    cta: 'Être notifié',
    ctaHref: '/contact',
    features: [
      'Tout le plan Essentiel',
      'Mise en avant dans les résultats',
      'Badge créateur vérifié',
      'Statistiques de profil',
      'Accès prioritaire aux événements',
    ],
  },
  {
    num: '03',
    name: 'Premium',
    price: 'Bientôt',
    period: 'Disponible prochainement',
    featured: false,
    cta: 'Être notifié',
    ctaHref: '/contact',
    features: [
      'Tout le plan Pro',
      'Support dédié prioritaire',
      'IA pour optimiser votre profil',
      'Accès en avant-première',
      'Outils de gestion avancés',
    ],
  },
]

export default function OffresPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAFA' }}>

      {/* Header */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 24px 56px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#6366F1', letterSpacing: '0.5px', marginBottom: '16px', margin: '0 0 12px' }}>
          Tarifs
        </p>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: '700', color: '#111827', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.5px' }}>
          Simple, transparent, sans surprise
        </h1>
        <p style={{ fontSize: '17px', color: '#6B7280', margin: '0', lineHeight: 1.7, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
          Commencez gratuitement. Évoluez quand vous êtes prêt.
        </p>
      </div>

      {/* Plans */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 24px 96px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {PLANS.map((plan) => (
          <div key={plan.name} style={{
            backgroundColor: plan.featured ? '#111827' : '#FFFFFF',
            borderRadius: '16px',
            padding: '36px 32px',
            border: plan.featured ? 'none' : '1px solid #E5E7EB',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {plan.featured && (
              <span style={{
                position: 'absolute', top: '20px', right: '20px',
                fontSize: '10px', fontWeight: '700', letterSpacing: '0.8px',
                padding: '4px 10px', borderRadius: '99px',
                backgroundColor: '#6366F1', color: '#FFF',
                textTransform: 'uppercase',
              }}>
                Recommandé
              </span>
            )}

            <span style={{ fontSize: '11px', fontWeight: '600', color: plan.featured ? '#9CA3AF' : '#9CA3AF', letterSpacing: '0.5px', marginBottom: '12px', display: 'block' }}>
              {plan.num}
            </span>

            <h2 style={{ fontSize: '20px', fontWeight: '700', color: plan.featured ? '#FFFFFF' : '#111827', margin: '0 0 24px', letterSpacing: '-0.2px' }}>
              {plan.name}
            </h2>

            <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: `1px solid ${plan.featured ? 'rgba(255,255,255,0.1)' : '#F3F4F6'}` }}>
              <p style={{ fontSize: '36px', fontWeight: '700', color: plan.featured ? '#FFFFFF' : '#111827', margin: '0 0 4px', letterSpacing: '-0.5px', lineHeight: 1 }}>
                {plan.price}
              </p>
              <p style={{ fontSize: '13px', color: plan.featured ? '#9CA3AF' : '#9CA3AF', margin: 0 }}>
                {plan.period}
              </p>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: plan.featured ? '#D1D5DB' : '#374151', lineHeight: 1.5 }}>
                  <Check size={15} style={{ color: plan.featured ? '#6366F1' : '#6366F1', flexShrink: 0, marginTop: '2px' }} />
                  {f}
                </li>
              ))}
            </ul>

            <Link href={plan.ctaHref} style={{
              display: 'block',
              textAlign: 'center',
              padding: '13px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              backgroundColor: plan.featured ? '#6366F1' : 'transparent',
              color: plan.featured ? '#FFFFFF' : '#111827',
              border: plan.featured ? 'none' : '1px solid #D1D5DB',
              transition: 'opacity 150ms',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center', padding: '0 24px 64px' }}>
        <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
          Des questions ?{' '}
          <Link href="/contact" style={{ color: '#6366F1', fontWeight: '600', textDecoration: 'none' }}>
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  )
}
