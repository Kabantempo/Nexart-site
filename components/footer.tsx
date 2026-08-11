'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Globe, MessageCircle, MapPin } from 'lucide-react'

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

const NAV = {
  'Pour créateurs': [
    { label: 'Parcourir les événements', href: '/events' },
    { label: 'Créateurs artisanaux',     href: '/creators' },
    { label: 'Carte interactive',        href: '/carte' },
    { label: 'Calendrier',               href: '/calendrier' },
    { label: "Comment ça marche",        href: '/about' },
    { label: "S'inscrire",               href: '/register' },
  ],
  'Pour organisateurs': [
    { label: 'Créer un événement',    href: '/events/create' },
    { label: 'Trouver des créateurs', href: '/creators' },
    { label: 'Offres & tarifs',       href: '/offres' },
    { label: 'Analytiques',           href: '/organizer/analytics' },
  ],
  'Communauté': [
    { label: 'Recherche',   href: '/search' },
    { label: 'Mes favoris', href: '/favorites' },
    { label: 'Messagerie',  href: '/messages' },
  ],
  'Nexart': [
    { label: 'À propos',          href: '/about' },
    { label: 'Carnet de route',   href: '/carnet-de-route' },
    { label: 'Patch Notes',       href: '/patch-notes' },
    { label: 'Contact',           href: '/contact' },
  ],
}

const SOCIALS = [
  {
    icon: InstagramIcon,
    href: 'https://instagram.com/nexart_app',
    label: 'Instagram @nexart_app',
  },
  {
    icon: Globe,
    href: 'https://nexart.fr',
    label: 'Site web',
  },
  {
    icon: MessageCircle,
    href: '/contact',
    label: 'Contact',
  },
]

const LEGAL = [
  { label: 'CGU',                           href: '/conditions' },
  { label: 'Confidentialité',               href: '/confidentialite' },
  { label: 'Mentions légales',              href: '/mentions-legales' },
  { label: 'Support',                       href: '/contact' },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'success' : 'error')
      if (res.ok) setEmail('')
    } catch {
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 4000)
  }

  return (
    <footer style={{ backgroundColor: '#06060f', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#fff' }}>
      {/* Top section */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 24px 56px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '48px 32px',
        }}>

          {/* Brand + newsletter */}
          <div style={{ minWidth: '220px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', textDecoration: 'none' }}>
              <Image src="/logo-mark.png" alt="Nexart" width={30} height={30} style={{ borderRadius: '8px' }} />
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Nexart</span>
            </Link>

            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.65', marginBottom: '12px' }}>
              La plateforme qui connecte créateurs artisanaux et organisateurs d'événements en France.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
              <MapPin size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>France</span>
            </div>

            {/* Socials */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.45)',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.color = '#fff'
                    el.style.backgroundColor = 'rgba(255,255,255,0.1)'
                    el.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.color = 'rgba(255,255,255,0.45)'
                    el.style.backgroundColor = 'rgba(255,255,255,0.04)'
                    el.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}
                >
                  <Icon size={15} />
                </Link>
              ))}
            </div>

            {/* Newsletter */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Newsletter
            </p>
            <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                disabled={status === 'loading' || status === 'success'}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  opacity: status === 'loading' || status === 'success' ? 0.5 : 1,
                }}
              />
              <button
                type="submit"
                aria-label="S'inscrire à la newsletter"
                disabled={status === 'loading' || status === 'success'}
                style={{
                  flexShrink: 0,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#6366F1',
                  cursor: 'pointer',
                  opacity: status === 'loading' || status === 'success' ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={15} color="#fff" />
              </button>
            </form>
            {status === 'success' && (
              <p style={{ fontSize: '12px', color: '#4ade80', marginTop: '6px' }}>Inscription confirmée !</p>
            )}
            {status === 'error' && (
              <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px' }}>Erreur, réessayez.</p>
            )}
          </div>

          {/* Nav columns */}
          {Object.entries(NAV).map(([title, links]) => (
            <div key={title}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '18px' }}>
                {title}
              </p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {links.map(({ label, href }) => (
                  <Link
                    key={href + label}
                    href={href}
                    style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)' }}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Divider + bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
            © 2026 Nexart. Tous droits réservés.
          </p>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center' }}>
            {LEGAL.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.75)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)' }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
