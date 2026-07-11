'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Globe, Share2, Heart, MessageCircle } from 'lucide-react'

const NAV = {
  'Pour créateurs': [
    { label: 'Parcourir les événements', href: '/events' },
    { label: "Comment ça marche",        href: '/about' },
    { label: "S'inscrire",               href: '/register' },
    { label: 'Contact',                  href: '/contact' },
  ],
  'Pour organisateurs': [
    { label: 'Créer un événement',    href: '/events' },
    { label: 'Trouver des créateurs', href: '/creators' },
    { label: "S'inscrire",            href: '/register' },
    { label: 'À propos',              href: '/about' },
  ],
  'Pour visiteurs': [
    { label: 'Carte interactive',      href: '/carte' },
    { label: 'Événements près de moi', href: '/events' },
    { label: 'Découvrir les créateurs', href: '/creators' },
    { label: "S'inscrire",             href: '/register' },
  ],
  'Ressources': [
    { label: 'Patch Notes',         href: '/patch-notes' },
    { label: 'Carnet de route',     href: '/carnet-de-route' },
    { label: 'À propos',            href: '/about' },
  ],
}

const SOCIALS = [
  { icon: Globe,         href: '#', label: 'Site web' },
  { icon: Share2,        href: '#', label: 'Twitter / X' },
  { icon: Heart,         href: '#', label: 'Instagram' },
  { icon: MessageCircle, href: '#', label: 'Contact' },
]

const LEGAL = [
  { label: 'Conditions d\'utilisation', href: '/conditions' },
  { label: 'Politique de confidentialité', href: '/confidentialite' },
  { label: 'Mentions légales',           href: '/mentions-legales' },
  { label: 'Contact support',             href: '/contact' },
]

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail || newsletterStatus === 'loading') return
    setNewsletterStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      setNewsletterStatus(res.ok ? 'success' : 'error')
      if (res.ok) setNewsletterEmail('')
    } catch {
      setNewsletterStatus('error')
    }
    setTimeout(() => setNewsletterStatus('idle'), 4000)
  }

  return (
    <footer className="bg-[#06060f] border-t border-white/6 text-white">
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-6">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <Image src="/logo-mark.png" alt="Nexart" width={30} height={30} className="rounded-lg" />
              <span className="text-xl font-bold text-white">Nexart</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-7">
              La plateforme qui connecte créateurs artisanaux et organisateurs d'événements en France.
            </p>
            {/* Newsletter */}
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Newsletter</p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="votre@email.fr"
                disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-white/8 bg-white/4 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/6 transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading' || newsletterStatus === 'success'}
                className="shrink-0 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                <Mail size={16} className="text-white" />
              </button>
            </form>
            {newsletterStatus === 'success' && (
              <p className="text-xs text-emerald-400 mt-2">Inscription confirmée !</p>
            )}
            {newsletterStatus === 'error' && (
              <p className="text-xs text-red-400 mt-2">Erreur, réessayez.</p>
            )}
          </div>

          {/* Nav columns */}
          {Object.entries(NAV).map(([title, links]) => (
            <div key={title}>
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-5">{title}</p>
              <nav className="flex flex-col gap-3">
                {links.map(({ label, href }) => (
                  <Link key={href + label} href={href} className="text-sm text-white/45 hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}

          {/* Socials */}
          <div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-5">Nous suivre</p>
            <div className="flex flex-wrap gap-2">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl border border-white/8 bg-white/4 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/15 transition-all duration-150"
                >
                  <Icon size={16} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">© 2026 Nexart. Tous droits réservés.</p>
          <nav className="flex flex-wrap gap-6 justify-center">
            {LEGAL.map(({ label, href }) => (
              <Link key={href} href={href} className="text-xs text-white/25 hover:text-white/55 transition-colors duration-150">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
