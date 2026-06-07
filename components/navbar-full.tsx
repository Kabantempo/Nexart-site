'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Grid2x2Plus, Menu, X, LogOut, Search, MessageCircle, Heart, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export function NavbarFull() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()
  const firstName = user?.full_name?.split(' ')[0] ?? null

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

  const openSearch = () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
  const closeSearch = () => { setSearchOpen(false); setSearchValue('') }
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) { router.push(`/events?q=${encodeURIComponent(searchValue.trim())}`); closeSearch() }
  }

  const dropdownStyle = (name: string): React.CSSProperties => ({
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    minWidth: name === 'discover' ? '320px' : '280px',
    zIndex: 100,
    padding: '8px',
    opacity: openDropdown === name ? 1 : 0,
    visibility: openDropdown === name ? 'visible' : 'hidden',
    transform: openDropdown === name ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'opacity 200ms ease, transform 200ms ease, visibility 200ms ease',
  })

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
      <style>{`
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
        .nav-link:hover { color: #6366F1 !important; background-color: #F5F5F7 !important; }
        .nav-dropdown-link:hover { background-color: #F5F5F7 !important; }
        .nav-btn-outline:hover { border-color: #6366F1 !important; color: #6366F1 !important; }
        .nav-btn-primary:hover { background-color: #4F46E5 !important; }
        .nav-logout:hover { background-color: #FEF2F2 !important; color: #E05A5A !important; }
      `}</style>
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
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('discover')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === 'discover' ? null : 'discover')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 200ms ease' }}
            >
              Découvrir
              <ChevronDown size={18} style={{ transform: openDropdown === 'discover' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            </button>

            <div style={dropdownStyle('discover')}>
              {[
                { title: 'Marchés & Événements', href: '/events', desc: 'Trouvez votre prochain marché' },
                { title: 'Créateurs & Artisans', href: '/creators', desc: 'Découvrez les artisans' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenDropdown(null)}
                  className="nav-dropdown-link"
                  style={{ display: 'flex', flexDirection: 'column', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', borderRadius: '8px', transition: 'background-color 150ms ease' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.title}</span>
                  <span style={{ fontSize: '12px', color: '#888888' }}>{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Search link */}
          <Link
            href="/search"
            className="nav-link"
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#888888', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'all 200ms ease' }}
          >
            <Search size={16} />
            Rechercher
          </Link>

          {/* Ressources Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setOpenDropdown('resources')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '15px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 200ms ease' }}
            >
              Ressources
              <ChevronDown size={18} style={{ transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            </button>

            <div style={dropdownStyle('resources')}>
              {[
                { title: 'À propos', href: '/about' },
                { title: 'Blog', href: '/blog' },
                { title: 'Nous contacter', href: '/contact' },
                { title: 'Centre d\'aide', href: '#' },
              ].map((item, idx) => (
                <Link
                  key={`resource-${idx}`}
                  href={item.href}
                  onClick={() => setOpenDropdown(null)}
                  className="nav-dropdown-link"
                  style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderRadius: '8px', transition: 'background-color 150ms ease' }}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Desktop CTA */}
        <div style={{ display: 'none', gap: '12px', alignItems: 'center' }} className="desktop-cta">
          {user ? (
            <>
              {/* Messages */}
              <Link href="/messages" title="Messages"
                style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', transition: 'background-color 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
                <MessageCircle size={18} color="#1A1A1A" />
              </Link>

              {/* Favoris */}
              <Link href="/favorites" title="Favoris"
                style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none', transition: 'background-color 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF' }}>
                <Heart size={18} color="#1A1A1A" />
              </Link>

              {/* Profil dropdown */}
              <div style={{ position: 'relative' }}
                onMouseLeave={() => setOpenDropdown(null)}>
                <button onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                  onMouseEnter={() => setOpenDropdown('profile')}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '20px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', transition: 'background-color 150ms ease' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {user.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>{firstName?.[0]?.toUpperCase() ?? '?'}</span>
                    }
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{firstName ?? 'Moi'}</span>
                  <ChevronDown size={14} color="#888888" style={{ transform: openDropdown === 'profile' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
                </button>
                <div style={{
                  position: 'absolute', top: '110%', right: 0, backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  minWidth: '180px', zIndex: 100, overflow: 'hidden', padding: '4px',
                  opacity: openDropdown === 'profile' ? 1 : 0,
                  visibility: openDropdown === 'profile' ? 'visible' : 'hidden',
                  transform: openDropdown === 'profile' ? 'translateY(0)' : 'translateY(-8px)',
                  transition: 'opacity 200ms ease, transform 200ms ease, visibility 200ms ease',
                }}>
                  <Link href="/profile" onClick={() => setOpenDropdown(null)}
                    className="nav-dropdown-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderRadius: '8px', transition: 'background-color 150ms ease' }}>
                    <User size={15} color="#888888" /> Mon profil
                  </Link>
                  <Link href="/messages" onClick={() => setOpenDropdown(null)}
                    className="nav-dropdown-link"
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderRadius: '8px', transition: 'background-color 150ms ease' }}>
                    <MessageCircle size={15} color="#888888" /> Messages
                  </Link>
                  <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '4px 0' }} />
                  <button onClick={handleLogout} className="nav-logout"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', color: '#E05A5A', fontSize: '14px', cursor: 'pointer', textAlign: 'left', borderRadius: '8px' }}>
                    <LogOut size={15} color="#E05A5A" /> Déconnexion
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link"
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}>
                Se connecter
              </Link>
              <Link href="/register" className="nav-btn-primary"
                style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms ease' }}>
                S'inscrire
              </Link>
            </>
          )}

          {/* Search */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {searchOpen ? (
              <form onSubmit={submitSearch}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F5F5F7', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '0 10px', height: '36px', width: '220px', transition: 'width 200ms ease' }}>
                <Search size={15} color="#888888" style={{ flexShrink: 0 }} />
                <input ref={searchRef} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Ville, marché…"
                  style={{ flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#1A1A1A', outline: 'none', minWidth: 0 }} />
                <button type="button" onClick={closeSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}>
                  <X size={14} color="#888888" />
                </button>
              </form>
            ) : (
              <button onClick={openSearch}
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 150ms ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F7' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                <Search size={16} color="#1A1A1A" />
              </button>
            )}
          </div>
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
      <div
        className="mobile-menu"
        style={{
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          display: 'none',
          overflow: 'hidden',
          maxHeight: isMobileOpen ? '600px' : '0',
          transition: 'max-height 300ms ease',
        }}
      >
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'discover' ? null : 'discover')}
              style={{ width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Découvrir
              <ChevronDown size={18} style={{ transform: openDropdown === 'discover' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            </button>
            <div style={{ overflow: 'hidden', maxHeight: openDropdown === 'discover' ? '200px' : '0', transition: 'max-height 200ms ease' }}>
              {[
                { title: 'Marchés & Événements', href: '/events', desc: 'Trouvez votre prochain marché' },
                { title: 'Créateurs & Artisans', href: '/creators', desc: 'Découvrez les artisans' },
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
            </div>
          </div>

          <div>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'resources' ? null : 'resources')}
              style={{ width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#1A1A1A', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Ressources
              <ChevronDown size={18} style={{ transform: openDropdown === 'resources' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms ease' }} />
            </button>
            <div style={{ overflow: 'hidden', maxHeight: openDropdown === 'resources' ? '200px' : '0', transition: 'max-height 200ms ease' }}>
              {[
                { title: 'À propos', href: '/about' },
                { title: 'Blog', href: '/blog' },
                { title: 'Nous contacter', href: '/contact' },
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
            </div>
          </div>

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#F5F5F7', borderRadius: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {user.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>{firstName?.[0]?.toUpperCase() ?? '?'}</span>
                  }
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{firstName ?? 'Mon compte'}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link href="/messages" onClick={() => setIsMobileOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: '#1A1A1A', fontSize: '13px', fontWeight: '600' }}>
                  <MessageCircle size={16} /> Messages
                </Link>
                <Link href="/favorites" onClick={() => setIsMobileOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: '#1A1A1A', fontSize: '13px', fontWeight: '600' }}>
                  <Heart size={16} /> Favoris
                </Link>
              </div>
              <Link href="/profile" onClick={() => setIsMobileOpen(false)}
                style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', color: '#6366F1', fontSize: '13px', fontWeight: '600' }}>
                <User size={16} /> Mon profil
              </Link>
              <button onClick={() => { setIsMobileOpen(false); handleLogout() }}
                style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <Link href="/login" onClick={() => setIsMobileOpen(false)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', textDecoration: 'none', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                Se connecter
              </Link>
              <Link href="/register" onClick={() => setIsMobileOpen(false)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                S'inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
