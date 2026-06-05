'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ChevronDown, Calendar, Users, MapPin, MessageSquare, Shield, HelpCircle, Award, Zap, FileText, Handshake } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type NavItemType = {
  title: string
  href: string
  description?: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
}

const discoverItems: NavItemType[] = [
  {
    title: 'Découvrir les événements',
    href: '/events',
    description: 'Marchés, salons et pop-ups en France',
    icon: Calendar,
  },
  {
    title: 'Parcourir les créateurs',
    href: '/creators',
    description: '500+ artisans et talents',
    icon: Users,
  },
  {
    title: 'Carte interactive',
    href: '#',
    description: 'Localisez les opportunités près de vous',
    icon: MapPin,
  },
  {
    title: 'Messagerie en temps réel',
    href: '#',
    description: 'Communiquez avec créateurs et organisateurs',
    icon: MessageSquare,
  },
]

const resourceItems: NavItemType[] = [
  {
    title: 'À propos de Nexart',
    href: '/about',
    description: 'Notre mission pour connecter l\'artisanat',
    icon: Award,
  },
  {
    title: 'Centre d\'aide',
    href: '#',
    description: 'FAQ, tutoriels et support',
    icon: HelpCircle,
  },
  {
    title: 'Confidentialité & Sécurité',
    href: '#',
    description: 'Comment nous protégeons vos données',
    icon: Shield,
  },
  {
    title: 'Blog & Actualités',
    href: '#',
    description: 'Tendances et success stories',
    icon: FileText,
  },
  {
    title: 'Partenariats',
    href: '#',
    description: 'Collaborons pour grandir ensemble',
    icon: Handshake,
  },
  {
    title: 'Nous contacter',
    href: '/contact',
    description: 'Questions ? Écrivez-nous',
    icon: Zap,
  },
]

export function NavbarUXUI() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(true)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <nav
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '18px' }}>N</span>
          </div>
          <span style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A' }}>
            Nexart
          </span>
        </Link>

        {/* Desktop Menu - Hidden on mobile */}
        <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'flex' } }} className="hidden lg:flex" style={{ gap: '8px' }}>
          {/* Découvrir Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onMouseEnter={() => setActiveDropdown('discover')}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#888888',
                border: 'none',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 300ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#6366F1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888888'
              }}
              aria-label="Menu Découvrir"
              aria-expanded={activeDropdown === 'discover'}
            >
              Découvrir
              <ChevronDown
                size={16}
                style={{
                  transition: 'transform 300ms ease',
                  transform: activeDropdown === 'discover' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {activeDropdown === 'discover' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    padding: '16px',
                    zIndex: 1000,
                    minWidth: '500px',
                  }}
                  onMouseEnter={() => setActiveDropdown('discover')}
                  onMouseLeave={() => setActiveDropdown(null)}
                  role="navigation"
                  aria-label="Menu Découvrir"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {discoverItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            border: '1px solid #E5E7EB',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 300ms ease',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#6366F1'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
                            e.currentTarget.style.backgroundColor = '#F5F5F7'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB'
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onClick={() => setActiveDropdown(null)}
                        >
                          {Icon && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Icon size={18} color="#6366F1" />
                            </div>
                          )}
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
                              {item.title}
                            </p>
                            <p style={{ fontSize: '12px', color: '#888888', margin: '4px 0 0 0' }}>
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ressources Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onMouseEnter={() => setActiveDropdown('resources')}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                color: '#888888',
                border: 'none',
                fontSize: '16px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 300ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#6366F1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888888'
              }}
              aria-label="Menu Ressources"
              aria-expanded={activeDropdown === 'resources'}
            >
              Ressources
              <ChevronDown
                size={16}
                style={{
                  transition: 'transform 300ms ease',
                  transform: activeDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>

            {/* Dropdown Content */}
            <AnimatePresence>
              {activeDropdown === 'resources' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                    padding: '16px',
                    zIndex: 1000,
                    minWidth: '600px',
                  }}
                  onMouseEnter={() => setActiveDropdown('resources')}
                  onMouseLeave={() => setActiveDropdown(null)}
                  role="navigation"
                  aria-label="Menu Ressources"
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {resourceItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: 'transparent',
                            border: '1px solid #E5E7EB',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 300ms ease',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#6366F1'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
                            e.currentTarget.style.backgroundColor = '#F5F5F7'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E5E7EB'
                            e.currentTarget.style.boxShadow = 'none'
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          onClick={() => setActiveDropdown(null)}
                        >
                          {Icon && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Icon size={18} color="#6366F1" />
                            </div>
                          )}
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>
                              {item.title}
                            </p>
                            <p style={{ fontSize: '12px', color: '#888888', margin: '4px 0 0 0' }}>
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tarifs Link */}
          <a
            href="#"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#6366F1',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            Tarifs
          </a>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Desktop Buttons */}
          <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'flex' } }} className="hidden lg:flex" style={{ gap: '12px' }}>
            <Link
              href="/login"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: '#888888',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'color 300ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#6366F1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888888'
              }}
            >
              Connexion
            </Link>
            <Link
              href="/register"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 300ms ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => {
                e.style.backgroundColor = '#5B5BD6'
                e.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.style.backgroundColor = '#6366F1'
                e.style.boxShadow = 'none'
              }}
            >
              S'inscrire
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 300ms ease',
            }}
            className="lg:hidden"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} color="#6366F1" /> : <Menu size={20} color="#6366F1" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Découvrir Section */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                  Découvrir
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                  {discoverItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#888888',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 300ms ease',
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F5F7'
                        e.currentTarget.style.color = '#6366F1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#888888'
                      }}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>

              {/* Ressources Section */}
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                  Ressources
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                  {resourceItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: '#888888',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 300ms ease',
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F5F5F7'
                        e.currentTarget.style.color = '#6366F1'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#888888'
                      }}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>

              {/* Mobile Buttons */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link
                  href="/login"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#888888',
                    textDecoration: 'none',
                    border: '1px solid #E5E7EB',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 300ms ease',
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#6366F1'
                    e.currentTarget.style.borderColor = '#6366F1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888888'
                    e.currentTarget.style.borderColor = '#E5E7EB'
                  }}
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 300ms ease',
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                  onMouseEnter={(e) => {
                    e.style.backgroundColor = '#5B5BD6'
                  }}
                  onMouseLeave={(e) => {
                    e.style.backgroundColor = '#6366F1'
                  }}
                >
                  S'inscrire
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
