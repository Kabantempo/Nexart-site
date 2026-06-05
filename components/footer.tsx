'use client'

import Link from 'next/link'
import { Mail, Globe, Heart, Share2, MessageCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#F5F5F7',
        borderTop: '1px solid #E5E7EB',
        paddingTop: '80px',
        paddingBottom: '40px',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '48px',
            marginBottom: '48px',
          }}
        >
          {/* Brand & Newsletter */}
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px', color: '#6366F1' }}>
              Nexart
            </h2>
            <p style={{ fontSize: '14px', color: '#888888', marginBottom: '24px', lineHeight: '1.6' }}>
              La plateforme de mise en relation entre créateurs et marchés artisanaux en France.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                placeholder="Votre email"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  fontFamily: 'inherit',
                }}
              />
              <button
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 300ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5B5BD6'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6366F1'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Mail size={18} />
              </button>
            </div>
          </div>

          {/* Pour Créateurs */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#1A1A1A' }}>
              Pour créateurs
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Parcourir les événements', href: '/events' },
                { label: 'Comment ça marche', href: '/about' },
                { label: "S'inscrire", href: '/register' },
                { label: 'FAQ', href: '/faq' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: '14px',
                    color: '#888888',
                    textDecoration: 'none',
                    transition: 'color 300ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#6366F1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888888'
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Pour Organisateurs */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#1A1A1A' }}>
              Pour organisateurs
            </h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Créer un événement', href: '/events' },
                { label: 'Trouver des créateurs', href: '/creators' },
                { label: "S'inscrire", href: '/register' },
                { label: 'Ressources', href: '/about' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: '14px',
                    color: '#888888',
                    textDecoration: 'none',
                    transition: 'color 300ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#6366F1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888888'
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Réseaux Sociaux */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#1A1A1A' }}>
              Nous suivre
            </h3>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {[
                { icon: Globe, href: '#website', label: 'Site web' },
                { icon: Share2, href: '#twitter', label: 'Twitter' },
                { icon: Heart, href: '#instagram', label: 'Instagram' },
                { icon: MessageCircle, href: '#contact', label: 'Contact' },
              ].map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFFFFF',
                    transition: 'all 300ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#6366F1'
                    e.currentTarget.style.borderColor = '#6366F1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                >
                  <social.icon size={20} style={{ color: '#6366F1' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #E5E7EB', marginBottom: '32px' }} />

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
            © 2026 Nexart. Tous droits réservés.
          </p>
          <nav style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Confidentialité', href: '/legal/privacy' },
              { label: 'Conditions', href: '/legal/terms' },
              { label: 'Cookies', href: '/legal/cookies' },
              { label: 'Contact', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '14px',
                  color: '#888888',
                  textDecoration: 'none',
                  transition: 'color 300ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#6366F1'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#888888'
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
