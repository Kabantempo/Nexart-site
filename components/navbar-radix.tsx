'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Calendar, Users, Award, HelpCircle, Shield, Handshake, FileText, Zap, ArrowRight } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavGridCard,
  NavSmallItem,
  NavLargeItem,
  NavItemMobile,
  type NavItemType,
} from '@/components/ui/navigation-menu-nexart'

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

export function NavbarRadix() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

          {/* Desktop Menu - Hidden on mobile */}
          <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'flex' } }} className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Découvrir</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                        maxWidth: '500px',
                      }}
                    >
                      {discoverItems.map((item) => (
                        <NavGridCard key={item.href} link={item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Ressources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        maxWidth: '700px',
                      }}
                    >
                      {resourceItems.map((item) => (
                        <NavGridCard key={item.href} link={item} />
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 'none' }}>
            {/* Desktop Buttons */}
            <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'flex' } }} className="hidden lg:flex" style={{ gap: '12px' }}>
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
                  border: 'none',
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
                  border: 'none',
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
            >
              {mobileMenuOpen ? <X size={20} color="#6366F1" /> : <Menu size={20} color="#6366F1" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px 0',
              borderTop: '1px solid #E5E7EB',
            }}
            className="lg:hidden"
          >
            {/* Découvrir */}
            <div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                Découvrir
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                {discoverItems.map((item) => (
                  <NavItemMobile key={item.href} item={item} href={item.href} onClick={() => setMobileMenuOpen(false)} />
                ))}
              </div>
            </div>

            {/* Ressources */}
            <div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                Ressources
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                {resourceItems.map((item) => (
                  <NavItemMobile key={item.href} item={item} href={item.href} onClick={() => setMobileMenuOpen(false)} />
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
        )}
      </div>
    </header>
  )
}
