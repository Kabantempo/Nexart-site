'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, X, LogOut, Search, User, MessageCircle, ArrowUpRight, Heart, Calendar, Palette, Brush, Building2, Zap, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { NotificationBell } from '@/components/ui/notification-bell'
import { WhatsNew } from '@/components/ui/whats-new'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PushNotificationButton } from '@/components/push-notifications'

export function NavbarFull() {
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [dropdown,    setDropdown]    = useState<string | null>(null)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<{ events: {id:string;title:string;city?:string;cover_image?:string}[]; creators: {id:string;full_name:string;username?:string;avatar_url?:string;disciplines?:string[]}[] }>({ events: [], creators: [] })
  const [searchLoading, setSearchLoading] = useState(false)
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [scrolled,    setScrolled]    = useState(false)
  const searchRef  = useRef<HTMLInputElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [creditBalance, setCreditBalance] = useState<number | null>(null)

  const user      = useAuthStore((s) => s.user)
  const setUser   = useAuthStore((s) => s.setUser)
  const router    = useRouter()
  const pathname  = usePathname()
  const firstName = user?.full_name?.split(' ')[0] ?? null
  const isHero    = pathname === '/'
  const dark      = isHero && !scrolled

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [pathname])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const su = session.user
        let { data: p } = await supabase.from('profiles').select('*').eq('id', su.id).maybeSingle()
        if (!p) {
          const defaultName = su.user_metadata?.full_name ?? su.email?.split('@')[0] ?? ''
          await supabase.from('profiles').upsert({ id: su.id, full_name: defaultName, role: su.user_metadata?.role ?? 'visitor' })
          const { data: created } = await supabase.from('profiles').select('*').eq('id', su.id).maybeSingle()
          p = created
        }
        if (p) setUser({ id: p.id, email: su.email || '', role: p.role, full_name: p.full_name, avatar_url: p.avatar_url, is_creator: p.is_creator, is_organizer: p.is_organizer })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { if (!s) setUser(null) })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser])

  useEffect(() => { setMobileOpen(false); setDropdown(null) }, [pathname])

  useEffect(() => {
    if (!user) { setCreditBalance(null); return }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch('/api/credits/balance', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (res.ok) { const j = await res.json(); setCreditBalance(j.balance ?? 0) }
    })
  }, [user])

  const go = (ms = 500) => { closeTimer.current = setTimeout(() => setDropdown(null), ms) }
  const stay = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }

  const handleLogout = async () => { await supabase.auth.signOut(); setUser(null); router.push('/') }
  const openSearch   = () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
  const closeSearch  = () => { setSearchOpen(false); setSearchValue(''); setSearchResults({ events: [], creators: [] }) }
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) { router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`); closeSearch() }
  }

  const handleSearchChange = (val: string) => {
    setSearchValue(val)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!val.trim()) { setSearchResults({ events: [], creators: [] }); return }
    setSearchLoading(true)
    searchDebounce.current = setTimeout(async () => {
      const q = val.trim().toLowerCase()
      const [{ data: events }, { data: profiles }] = await Promise.all([
        supabase.from('events').select('id,title,city,cover_image').eq('status','published').ilike('title', `%${q}%`).limit(4),
        supabase.from('profiles').select('id,full_name,username,avatar_url').eq('role','creator').ilike('full_name', `%${q}%`).limit(4),
      ])
      setSearchResults({ events: (events ?? []) as any, creators: (profiles ?? []) as any })
      setSearchLoading(false)
    }, 250)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // ── Dropdown panel ────────────────────────────────────────────────
  const Panel = ({ id, children, align = 'left', width = 'w-52' }: { id: string; children: React.ReactNode; align?: 'left' | 'right' | 'center'; width?: string }) => (
    <AnimatePresence>
      {dropdown === id && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={stay}
          onMouseLeave={() => go()}
          className={`absolute top-full mt-2.5 ${width} bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/[0.08] p-1.5 origin-top z-50 ${
            align === 'right'  ? 'right-0' :
            align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
          }`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ── Nav trigger ───────────────────────────────────────────────────
  const Trigger = ({ id, label, active }: { id: string; label: string; active: boolean }) => (
    <button
      onMouseEnter={() => { stay(); setDropdown(id) }}
      onMouseLeave={() => go()}
      onClick={() => setDropdown(d => d === id ? null : id)}
      className={`flex items-center gap-1 text-[13.5px] font-medium px-3 py-2 transition-colors duration-150 select-none ${
        active
          ? dark ? 'text-white' : 'text-gray-900'
          : dark ? 'text-white/75 hover:text-white' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {label}
      <ChevronDown size={12} className={`transition-transform duration-200 opacity-50 ${dropdown === id ? 'rotate-180' : ''}`} />
    </button>
  )

  return (
    <>
      {/* ── Bar ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? 'pointer-events-none' : ''
        }`}
        style={dark && !scrolled ? {
          '--bg-primary': 'rgba(255,255,255,0.08)',
          '--bg-secondary': 'rgba(255,255,255,0.12)',
          '--bg-tertiary': 'rgba(255,255,255,0.16)',
          '--border-color': 'rgba(255,255,255,0.15)',
          '--text-primary': '#ffffff',
          '--text-secondary': 'rgba(255,255,255,0.7)',
          '--navbar-bg': 'transparent',
        } as React.CSSProperties : undefined}
      >
        <div className={`transition-all duration-500 ${scrolled ? 'pointer-events-auto mx-3 sm:mx-6 mt-3' : ''}`}>
        <div className={`max-w-7xl mx-auto px-5 sm:px-8 h-[58px] flex items-center gap-8 transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-lg shadow-black/5'
            : ''
        }`}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo-mark.png" alt="Nexart" width={26} height={26} className="rounded-lg" priority />
            <span className={`text-[15px] font-semibold tracking-tight transition-colors duration-300 ${dark ? 'text-white' : 'text-gray-900'}`}>
              Nexart
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0 flex-1">

            {/* Découvrir */}
            <div className="relative" onMouseEnter={() => { stay(); setDropdown('discover') }} onMouseLeave={() => go()}>
              <Trigger id="discover" label="Découvrir" active={isActive('/events') || isActive('/creators')} />
              <Panel id="discover" width="w-[300px]">
                {[
                  { href: '/events',   label: 'Événements artisanaux', desc: 'Marchés, pop-ups, salons, festivals' },
                  { href: '/creators', label: 'Créateurs & Artisans',  desc: 'Parcourez les artisans inscrits' },
                  { href: '/carte',    label: 'Carte interactive',       desc: 'Événements près de chez vous' },
                ].map(({ href, label, desc }) => (
                  <Link key={href} href={href} onClick={() => setDropdown(null)}
                    className={`group flex items-start gap-3 px-3.5 py-3 rounded-xl transition-colors ${isActive(href) ? 'bg-gray-50' : 'hover:bg-gray-50/70'}`}
                  >
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-[13px] font-semibold leading-none mb-1 ${isActive(href) ? 'text-indigo-600' : 'text-gray-800'}`}>{label}</p>
                      <p className="text-[12px] text-gray-400">{desc}</p>
                    </div>
                    <ArrowUpRight size={13} className="text-gray-300 group-hover:text-gray-500 mt-0.5 transition-colors shrink-0" />
                  </Link>
                ))}
              </Panel>
            </div>

            {/* Offres */}
            <Link href="/offres"
              className={`px-3.5 py-2 text-[13px] font-semibold rounded-lg transition-colors duration-150 ${isActive('/offres') ? 'text-indigo-600 bg-indigo-50' : dark ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Offres
            </Link>
          </nav>

          {/* Desktop right */}
          <div className="hidden lg:flex items-center gap-1 ml-auto">

            {/* Search */}
            <div ref={searchContainerRef} className="relative">
              <AnimatePresence mode="wait">
                {searchOpen ? (
                  <motion.form key="open"
                    initial={{ width: 32, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 32, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    onSubmit={submitSearch}
                    className={`flex items-center gap-2 h-8 px-3 rounded-lg border overflow-hidden ${dark ? 'bg-white/8 border-white/12' : 'bg-gray-100 border-transparent'}`}
                  >
                    <Search size={12} className={dark ? 'text-white/40 shrink-0' : 'text-gray-400 shrink-0'} />
                    <input ref={searchRef} value={searchValue} onChange={e => handleSearchChange(e.target.value)}
                      placeholder="Rechercher…"
                      className={`flex-1 bg-transparent text-[13px] outline-none min-w-0 ${dark ? 'text-white placeholder:text-white/30' : 'text-gray-900 placeholder:text-gray-400'}`}
                    />
                    {searchLoading
                      ? <div style={{ width: 12, height: 12, border: '2px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                      : <button type="button" onClick={closeSearch}><X size={12} className={dark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'} /></button>
                    }
                  </motion.form>
                ) : (
                  <motion.button key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={openSearch}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
                  >
                    <Search size={15} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Live results dropdown */}
              <AnimatePresence>
                {searchOpen && searchValue.trim() && (searchResults.events.length > 0 || searchResults.creators.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px', backgroundColor: 'var(--bg-primary)', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid var(--border-color)', overflow: 'hidden', zIndex: 999 }}
                  >
                    {searchResults.events.length > 0 && (
                      <div>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', padding: '10px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Événements</p>
                        {searchResults.events.map(ev => (
                          <Link key={ev.id} href={`/events/${ev.id}`} onClick={closeSearch}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', textDecoration: 'none', transition: 'background 100ms' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EEF2FF', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {ev.cover_image
                                ? <Image src={ev.cover_image} alt={ev.title} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                : <Calendar size={16} color="#6366F1" />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                              {ev.city && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{ev.city}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.creators.length > 0 && (
                      <div style={{ borderTop: searchResults.events.length > 0 ? '1px solid #F3F4F6' : 'none' }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', padding: '10px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Créateurs</p>
                        {searchResults.creators.map(cr => (
                          <Link key={cr.id} href={`/creators/${cr.id}`} onClick={closeSearch}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', textDecoration: 'none', transition: 'background 100ms' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {cr.avatar_url
                                ? <Image src={cr.avatar_url} alt={cr.full_name} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                : <Palette size={14} color="#6366F1" />
                              }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{cr.username ?? cr.full_name}</p>
                              {cr.username && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{cr.full_name}</p>}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #F3F4F6' }}>
                      <Link href={`/search?q=${encodeURIComponent(searchValue.trim())}`} onClick={closeSearch}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', color: '#6366F1' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F5FF')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Search size={13} /> Voir tous les résultats
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <WhatsNew dark={dark} />
            <ThemeToggle />

            {user ? (
              <>
                <NotificationBell userId={user.id} dark={dark} />
                <PushNotificationButton />
                <Link href="/favorites" title="Mes favoris" className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  <Heart size={16} />
                </Link>
                <Link href="/messages" className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  <MessageCircle size={16} />
                </Link>

                {/* Credits badge */}
                {creditBalance !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', borderRadius: '20px', padding: '3px 8px 3px 6px', height: '28px' }}>
                    <Zap size={11} color="#FFF" fill="#FFF" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#FFF', lineHeight: 1, marginLeft: '2px' }}>{creditBalance}</span>
                    <Link href="/dashboard?tab=credits" title="Acheter des crédits"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', marginLeft: '4px', flexShrink: 0 }}
                    >
                      <Plus size={9} color="#FFF" strokeWidth={3} />
                    </Link>
                  </div>
                )}

                {/* Profile */}
                <div className="relative ml-1" onMouseEnter={() => { stay(); setDropdown('profile') }} onMouseLeave={() => go()}>
                  <button onClick={() => setDropdown(d => d === 'profile' ? null : 'profile')}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${dark ? 'hover:bg-white/8' : 'hover:bg-gray-100'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
                      {user.avatar_url
                        ? <Image src={user.avatar_url} alt={user.full_name ?? firstName ?? 'Avatar'} width={24} height={24} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        : <span className="text-[9px] font-black text-white">{firstName?.[0]?.toUpperCase() ?? '?'}</span>
                      }
                    </div>
                    <span className={`text-[13px] font-medium transition-colors ${dark ? 'text-white/70' : 'text-gray-600'}`}>{firstName ?? 'Moi'}</span>
                    <ChevronDown size={11} className={`opacity-40 transition-transform ${dropdown === 'profile' ? 'rotate-180' : ''}`} />
                  </button>
                  <Panel id="profile" align="right" width="w-[190px]">
                    <div className="px-3.5 py-2.5 mb-1 border-b border-gray-100">
                      <p className="text-[12px] font-semibold text-gray-900">{firstName}</p>
                      <p className="text-[11px] text-gray-400 truncate mb-1.5">{user.email}</p>
                      <div className="flex gap-1 flex-wrap">
                        {(user.is_creator || user.role === 'creator') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">Créateur</span>
                        )}
                        {(user.is_organizer || user.role === 'organizer') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">Organisateur</span>
                        )}
                        {!user.is_creator && !user.is_organizer && user.role === 'visitor' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-400 border border-gray-100">Visiteur</span>
                        )}
                      </div>
                    </div>
                    {/* Dashboard(s) */}
                    {(user.is_creator || user.role === 'creator') && (user.is_organizer || user.role === 'organizer') ? (
                      <>
                        <Link href="/dashboard?tab=creator" onClick={() => setDropdown(null)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          <Brush size={13} className="text-indigo-400" /> Dashboard créateur
                        </Link>
                        <Link href="/dashboard?tab=organizer" onClick={() => setDropdown(null)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors">
                          <Building2 size={13} className="text-violet-400" /> Dashboard organisateur
                        </Link>
                      </>
                    ) : (
                      <Link href="/dashboard" onClick={() => setDropdown(null)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <User size={13} className="text-gray-400" /> Mon dashboard
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setDropdown(null)} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                      <User size={13} className="text-gray-400" /> Mon profil
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left">
                      <LogOut size={13} /> Déconnexion
                    </button>
                  </Panel>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 ml-1">
                <Link href="/login"
                  className={`px-3.5 py-2 text-[13px] font-medium transition-colors duration-150 ${dark ? 'text-white/75 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Connexion
                </Link>
                <Link href="/register"
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                    dark
                      ? 'bg-white text-gray-900 hover:bg-white/90'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
            className="lg:hidden ml-auto flex flex-col gap-[5px] justify-center w-9 h-9 rounded-lg transition-colors bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <motion.span animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className={`block h-[2px] w-5 mx-auto rounded-full ${dark ? 'bg-white' : 'bg-gray-800'}`} />
            <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.2 }} className={`block h-[2px] w-5 mx-auto rounded-full ${dark ? 'bg-white' : 'bg-gray-800'}`} />
            <motion.span animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className={`block h-[2px] w-5 mx-auto rounded-full ${dark ? 'bg-white' : 'bg-gray-800'}`} />
          </button>
        </div>
        </div>
      </header>


      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-[#06060f]/96 backdrop-blur-2xl lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-[58px] z-40 lg:hidden flex flex-col px-5 pt-6 pb-10 gap-1 overflow-y-auto max-h-[calc(100vh-58px)]"
            >
              {/* Search mobile */}
              <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
                onSubmit={submitSearch}
                className="flex items-center gap-2 h-11 px-4 rounded-xl bg-white/8 border border-white/10 mb-4"
              >
                <Search size={14} className="text-white/40 shrink-0" />
                <input
                  value={searchValue} onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Rechercher événements, créateurs…"
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/30 outline-none"
                />
                {searchValue && <button type="button" onClick={() => { setSearchValue(''); setSearchResults({ events: [], creators: [] }) }}><X size={13} className="text-white/30" /></button>}
              </motion.form>

              {/* Nav links */}
              {[
                { href: '/events',   label: 'Événements' },
                { href: '/creators', label: 'Créateurs' },
                { href: '/carte',    label: 'Carte' },
                { href: '/offres',   label: 'Offres' },
              ].map(({ href, label }, i) => (
                <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.05 }}>
                  <Link href={href} onClick={() => setMobileOpen(false)}
                    className={`block py-3 text-[22px] font-bold tracking-tight transition-colors ${isActive(href) ? 'text-white' : 'text-white/35 hover:text-white/80'}`}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="mt-6 pt-6 border-t border-white/8 flex flex-col gap-2"
              >
                {user ? (
                  <>
                    {/* User profile row */}
                    <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden shrink-0">
                        {user.avatar_url
                          ? <Image src={user.avatar_url} alt={user.full_name ?? firstName ?? 'Avatar'} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          : <span className="text-xs font-black text-white">{firstName?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{firstName ?? 'Mon compte'}</p>
                        <p className="text-xs text-white/35 truncate">{user.email}</p>
                      </div>
                    </Link>

                    {/* Quick links row */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <Link href="/messages" onClick={() => setMobileOpen(false)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/6 hover:bg-white/10 transition-colors">
                        <MessageCircle size={18} className="text-white/70" />
                        <span className="text-[11px] text-white/50 font-medium">Messages</span>
                      </Link>
                      <Link href="/favorites" onClick={() => setMobileOpen(false)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/6 hover:bg-white/10 transition-colors">
                        <Heart size={18} className="text-white/70" />
                        <span className="text-[11px] text-white/50 font-medium">Favoris</span>
                      </Link>
                      <Link href="/notifications" onClick={() => setMobileOpen(false)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/6 hover:bg-white/10 transition-colors">
                        <Calendar size={18} className="text-white/70" />
                        <span className="text-[11px] text-white/50 font-medium">Notifs</span>
                      </Link>
                    </div>

                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-3 rounded-xl bg-white/10 text-white text-[15px] font-bold">
                      Mon dashboard
                    </Link>
                    <button onClick={() => { setMobileOpen(false); handleLogout() }} className="text-left text-sm text-white/35 hover:text-red-400 transition-colors py-2">
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center py-3.5 rounded-xl bg-white text-gray-900 text-[15px] font-bold">
                      S'inscrire gratuitement
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center text-sm text-white/35 hover:text-white/60 transition-colors py-2">
                      Déjà un compte ? Se connecter
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
