'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Menu,
  X,
  ChevronDown,
  Users,
  Calendar,
  MessageSquare,
  Award,
  Zap,
  Star,
  Shield,
  FileText,
  ArrowRight,
  HelpCircle,
  Handshake,
} from 'lucide-react'
import { GridCard } from './ui/grid-card'

type NavItemType = {
  title: string
  href: string
  description?: string
  icon?: React.ComponentType<{ size: number; color?: string }>
}

const discoverItems: NavItemType[] = [
  {
    title: 'Événements',
    href: '/events',
    description: 'Marchés, salons et pop-ups',
    icon: Calendar,
  },
  {
    title: 'Créateurs',
    href: '/creators',
    description: 'Artisans et talents',
    icon: Users,
  },
  {
    title: 'Messagerie',
    href: '#',
    description: 'Communiquer en temps réel',
    icon: MessageSquare,
  },
]

const resourceItems: NavItemType[] = [
  {
    title: 'À propos',
    href: '/about',
    description: 'Notre mission et histoire',
    icon: Award,
  },
  {
    title: 'Aide',
    href: '#',
    description: 'Centre de support',
    icon: HelpCircle,
  },
  {
    title: 'Sécurité',
    href: '#',
    description: 'Confidentialité et données',
    icon: Shield,
  },
  {
    title: 'Contact',
    href: '/contact',
    icon: Handshake,
    description: 'Nous contacter',
  },
  {
    title: 'Blog',
    href: '#',
    icon: FileText,
    description: 'Actualités et tutoriels',
  },
  {
    title: 'Partenaires',
    href: '#',
    icon: Zap,
    description: 'Collaborer avec nous',
  },
]

export function NavbarAdvanced() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems = [
    { label: 'Découvrir', submenu: discoverItems },
    { label: 'Ressources', submenu: resourceItems },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingLeft: '16px', paddingRight: '16px' }}>
        {/* Desktop Navigation */}
        <nav
          style={{
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
              fontSize: '24px',
              fontWeight: '700',
              color: '#6366F1',
              textDecoration: 'none',
              flex: 'none',
            }}
          >
            Nexart
          </Link>

          {/* Desktop Menu */}
          {isDesktop && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {menuItems.map((item) => (
              <div key={item.label} style={{ position: 'relative' }}>
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === item.label ? null : item.label)
                  }
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    backgroundColor: 'transparent',
                    color: '#888888',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 300ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#6366F1'
                    if (!item.submenu) return
                    setOpenDropdown(item.label)
                  }}
                  onMouseLeave={(e) => {
                    if (openDropdown !== item.label) {
                      e.currentTarget.style.color = '#888888'
                    }
                  }}
                >
                  {item.label}
                  {item.submenu && (
                    <ChevronDown
                      size={16}
                      style={{
                        transition: 'transform 300ms ease',
                        transform: openDropdown === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  )}
                </button>

                {/* Advanced Dropdown Menu */}
                {item.submenu && openDropdown === item.label && (
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
                      minWidth: '600px',
                      padding: '16px',
                      zIndex: 1000,
                    }}
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                      }}
                    >
                      {item.submenu.map((subitem) => {
                        const Icon = subitem.icon
                        return (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            style={{
                              textDecoration: 'none',
                            }}
                          >
                            <GridCard
                              style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                borderColor: '#E5E7EB',
                              }}
                              onMouseEnter={(e: any) => {
                                e.currentTarget.style.borderColor = '#6366F1'
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)'
                              }}
                              onMouseLeave={(e: any) => {
                                e.currentTarget.style.borderColor = '#E5E7EB'
                                e.currentTarget.style.boxShadow = 'none'
                              }}
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
                                <p
                                  style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1A1A1A',
                                    margin: 0,
                                  }}
                                >
                                  {subitem.title}
                                </p>
                                {subitem.description && (
                                  <p
                                    style={{
                                      fontSize: '12px',
                                      color: '#888888',
                                      margin: '4px 0 0 0',
                                    }}
                                  >
                                    {subitem.description}
                                  </p>
                                )}
                              </div>
                            </GridCard>
                          </Link>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 'none' }}>
            {/* Desktop Buttons */}
            {isDesktop && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link
                href="/login"
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#888888',
                  textDecoration: 'none',
                  transition: 'all 300ms ease',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
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
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  transition: 'all 300ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
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
                <ArrowRight size={16} />
              </Link>
            </div>
            )}

            {/* Mobile Menu Button */}
            {!isDesktop && (
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
            >
              {mobileMenuOpen ? <X size={20} color="#6366F1" /> : <Menu size={20} color="#6366F1" />}
            </button>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        {!isDesktop && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px 0',
              borderTop: '1px solid #E5E7EB',
            }}
            className="lg:hidden"
          >
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() =>
                        setOpenDropdown(openDropdown === item.label ? null : item.label)
                      }
                      style={{
                        width: '100%',
                        padding: '12px 0',
                        textAlign: 'left',
                        fontSize: '16px',
                        fontWeight: '600',
                        backgroundColor: 'transparent',
                        color: '#1A1A1A',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        size={16}
                        style={{
                          transition: 'transform 300ms ease',
                          transform: openDropdown === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    {openDropdown === item.label && (
                      <div
                        style={{
                          paddingLeft: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            style={{
                              padding: '12px 12px',
                              borderRadius: '8px',
                              textDecoration: 'none',
                              color: '#888888',
                              fontSize: '14px',
                              transition: 'all 300ms ease',
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#6366F1'
                              e.currentTarget.style.backgroundColor = '#F5F5F7'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#888888'
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            {subitem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '12px 0',
                      textDecoration: 'none',
                      color: '#1A1A1A',
                      fontSize: '16px',
                      fontWeight: '600',
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
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
          </motion.div>
        )}
      </div>
    </header>
  )
}
