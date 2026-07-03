'use client'

import Link from 'next/link'
import { CheckCircle, Zap, Star } from 'lucide-react'

const OFFERS = [
  {
    name: 'Essentiel',
    price: 'Gratuit',
    priceDetail: 'Pour toujours',
    badge: null,
    color: '#6366F1',
    bg: '#EEF2FF',
    icon: <CheckCircle size={22} color="#6366F1" />,
    features: [
      'Profil créateur public',
      'Candidatures illimitées aux événements',
      'Portfolio photos',
      'Messagerie avec les organisateurs',
      'Favoris',
    ],
    cta: 'Commencer gratuitement',
    ctaHref: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'Bientôt',
    priceDetail: 'Disponible prochainement',
    badge: 'Bientôt',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: <Zap size={22} color="#7C3AED" />,
    features: [
      'Tout le plan Essentiel',
      'Mise en avant dans les résultats',
      'Badge créateur vérifié',
      'Statistiques de profil',
      'Accès prioritaire aux nouveaux événements',
    ],
    cta: 'Être notifié',
    ctaHref: '/contact',
    highlight: true,
  },
  {
    name: 'Premium',
    price: 'Bientôt',
    priceDetail: 'Disponible prochainement',
    badge: 'Bientôt',
    color: '#059669',
    bg: '#ECFDF5',
    icon: <Star size={22} color="#059669" />,
    features: [
      'Tout le plan Pro',
      'Support dédié prioritaire',
      'IA pour optimiser votre profil',
      'Accès aux événements en avant-première',
      'Outils de gestion avancés',
    ],
    cta: 'Être notifié',
    ctaHref: '/contact',
    highlight: false,
  },
]

export default function OffresPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Hero */}
      <div style={{ backgroundColor: '#06060f', padding: '80px 16px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.10) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#818CF8', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Tarifs</span>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '900', color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.1 }}>
            Choisissez votre plan
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
            Commencez gratuitement et évoluez selon vos besoins.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 16px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {OFFERS.map((offer) => (
            <div key={offer.name} style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '32px',
              border: offer.highlight ? `2px solid ${offer.color}` : '1px solid #E2E8F0',
              boxShadow: offer.highlight ? `0 8px 32px ${offer.color}20` : '0 1px 8px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}>
              {offer.highlight && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', backgroundColor: offer.color, color: '#FFF', fontSize: '11px', fontWeight: '800', padding: '4px 16px', borderRadius: '99px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  RECOMMANDÉ
                </div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: offer.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {offer.icon}
                </div>
                <div>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>{offer.name}</p>
                  {offer.badge && (
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '99px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>{offer.badge}</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '32px', fontWeight: '900', color: offer.color, margin: '0 0 2px' }}>{offer.price}</p>
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{offer.priceDetail}</p>
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {offer.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#374151' }}>
                    <CheckCircle size={15} color={offer.color} fill={offer.bg} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href={offer.ctaHref} style={{
                display: 'block',
                textAlign: 'center',
                padding: '13px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                textDecoration: 'none',
                backgroundColor: offer.highlight ? offer.color : 'transparent',
                color: offer.highlight ? '#FFF' : offer.color,
                border: `2px solid ${offer.color}`,
                transition: 'all 150ms',
              }}>
                {offer.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ rapide */}
        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
            Des questions ?{' '}
            <Link href="/contact" style={{ color: '#6366F1', fontWeight: '600', textDecoration: 'none' }}>
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
