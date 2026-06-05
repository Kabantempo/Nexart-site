'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Grid2x2Plus, Menu, X, LogOut, LayoutDashboard, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export function NavbarFull() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && !user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            email: session.user.email || '',
            role: profile.role,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          })
        }
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null)
    })

    return () => subscription.unsubscribe()
  }, [setUser, user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{ width: '40px', height: '40px', backgroundColor: '#6366F1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
            <Grid2x2Plus size={24} />
          </div>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Nexart</span>
        </Link>

        {/* Desktop Menu */}
        <nav
          style={{ display: 'none', gap: '8px', alignItems: 'center', flex: 1, marginLeft: '48px' }}
          className="desktop-nav"
        >
          {/* Découvrir Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggleDropdown('discover')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 200ms ease' }}
              onMouseEnter={() => setOpenDropdown('discover')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              Découvrir
              <ChevronDown size={18} style={{ transform: openDropdown === 'discover' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            </button>

            <AnimatePresence>
              {openDropdown === 'discover' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', minWidth: '320px', zIndex: 100, padding: '8px' }}
                  onMouseEnter={() => setOpenDropdown('discover')}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {[
                    { title: 'Marchés & Événements', href: '/events', desc: '100+ événements en France' },
                    { title: 'Créateurs & Artisans', href: '/creators', desc: '500+ talents connectés' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', borderRadius: '8px', transition: 'background-color 150ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</span>
                      <span style={{ fontSize: '12px', color: '#888888' }}>{item.desc}</span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search link */}
          <Link
            href="/search"
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#888888', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'all 200ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#6366F1'; e.currentTarget.style.backgroundColor = '#F5F5F7' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888888'; e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <Search size={16} />
            Rechercher
          </Link>

          {/* Ressources Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggleDropdown('resources')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 200ms ease' }}
              onMouseEnter={() => setOpenDropdown('resources')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              Ressources
              <ChevronDown size={18} style={{ transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            </button>

            <AnimatePresence>
              {openDropdown === 'resources' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)', minWidth: '280px', zIndex: 100, padding: '8px' }}
                  onMouseEnter={() => setOpenDropdown('resources')}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {[
                    { title: 'À propos', href: '/about' },
                    { title: 'Centre d\'aide', href: '#' },
                    { title: 'Confidentialité', href: '#' },
                    { title: 'Blog', href: '#' },
                    { title: 'Partenariats', href: '#' },
                    { title: 'Nous contacter', href: '#' },
                  ].map((item, idx) => (
                    <Link
                      key={`resource-${idx}`}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderRadius: '8px', transition: 'background-color 150ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {item.title}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Desktop CTA */}
        <div style={{ display: 'none', gap: '12px', alignItems: 'center' }} className="desktop-cta">
          {user ? (
            <>
              <Link
                href="/dashboard"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#1A1A1A', textDecoration: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#1A1A1A' }}
              >
                <LayoutDashboard size={16} />
                {user.full_name?.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#F5F5F7', color: '#888888', fontSize: '14px', cursor: 'pointer', transition: 'all 200ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#E05A5A' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7'; e.currentTarget.style.color = '#888888' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4F46E5' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
              >
                S'inscrire
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '8px', border: 'none', backgroundColor: '#F5F5F7', color: '#1A1A1A', cursor: 'pointer', fontSize: '18px' }}
          className="mobile-menu-btn"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', display: 'none', overflow: 'hidden' }}
            className="mobile-menu"
          >
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Discover */}
              <div>
                <button
                  onClick={() => toggleDropdown('discover')}
                  style={{ width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Découvrir
                  <ChevronDown size={18} style={{ transform: openDropdown === 'discover' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
                </button>
                <AnimatePresence>
                  {openDropdown === 'discover' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      {[
                        { title: 'Marchés & Événements', href: '/events', desc: '100+ événements' },
                        { title: 'Créateurs & Artisans', href: '/creators', desc: '500+ talents' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setIsMobileOpen(false); setOpenDropdown(null) }}
                          style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', borderRadius: '8px', backgroundColor: '#F5F5F7', marginTop: '8px' }}
                        >
                          <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.title}</span>
                          <span style={{ fontSize: '11px', color: '#888888' }}>{item.desc}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources */}
              <div>
                <button
                  onClick={() => toggleDropdown('resources')}
                  style={{ width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Ressources
                  <ChevronDown size={18} style={{ transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
                </button>
                <AnimatePresence>
                  {openDropdown === 'resources' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      {[
                        { title: 'À propos', href: '/about' },
                        { title: 'Centre d\'aide', href: '#' },
                        { title: 'Confidentialité', href: '#' },
                        { title: 'Blog', href: '#' },
                        { title: 'Partenariats', href: '#' },
                        { title: 'Nous contacter', href: '#' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setIsMobileOpen(false); setOpenDropdown(null) }}
                          style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '13px', borderRadius: '8px', backgroundColor: '#F5F5F7', marginTop: '8px' }}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile CTA */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileOpen(false)}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}
                    >
                      Mon espace
                    </Link>
                    <button
                      onClick={() => { setIsMobileOpen(false); handleLogout() }}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#F5F5F7', color: '#888888', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileOpen(false)}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileOpen(false)}
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}
                    >
                      S'inscrire
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .desktop-cta { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-menu { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .mobile-menu { display: block !important; }
        }
      `}</style>
    </header>
  )
}
