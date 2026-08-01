'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, X, LogOut, Search, User, MessageCircle, ArrowUpRight, Heart, Calendar, Palette, Brush, Building2, Zap, Plus, MapPin, TrendingUp, BookOpen, FileText, BarChart2, Ticket, Users, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { WhatsNew } from '@/components/ui/whats-new'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// ── Styles helpers ──────────────────────────────────────────────────────────

const s = {
  navLink: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13.5px',
    fontWeight: 500,
    padding: '12px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    transition: 'color 0.15s',
    userSelect: 'none',
    color: active ? '#111827' : '#4B5563',
    textDecoration: 'none',
  }),
  panel: (align: 'left' | 'right' | 'center', width: number): React.CSSProperties => ({
    position: 'absolute',
    // paddingTop crée un pont transparent entre le trigger et le panel
    // pour que la souris ne quitte pas le sous-arbre React lors du survol
    top: '100%',
    paddingTop: '10px',
    width: `${width}px`,
    zIndex: 50,
    ...(align === 'right' ? { right: 0 } : align === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : { left: 0 }),
  }),
  panelInner: (): React.CSSProperties => ({
    backgroundColor: '#fff',
    border: '1px solid #F3F4F6',
    borderRadius: '18px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
    padding: '6px',
    transformOrigin: 'top',
  }),
  panelItem: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '12px',
    textDecoration: 'none',
    backgroundColor: active ? '#F9FAFB' : 'transparent',
    transition: 'background 0.12s',
    cursor: 'pointer',
  }),
  panelItemSimple: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    textDecoration: 'none',
    backgroundColor: active ? '#EEF2FF' : 'transparent',
    color: active ? '#6366F1' : '#374151',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'all 0.12s',
    cursor: 'pointer',
  }),
}

export function NavbarFull() {
  const [mobileOpen,    setMobileOpen]    = useState(false)
  const [dropdown,      setDropdown]      = useState<string | null>(null)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchValue,   setSearchValue]   = useState('')
  const [searchResults, setSearchResults] = useState<{
    events: { id: string; title: string; city?: string; cover_image?: string }[]
    creators: { id: string; full_name: string; username?: string; avatar_url?: string }[]
  }>({ events: [], creators: [] })
  const [searchLoading,   setSearchLoading]   = useState(false)
  const [searchActiveIdx, setSearchActiveIdx] = useState(-1)
  const [scrolled,        setScrolled]        = useState(false)
  const [creditBalance,   setCreditBalance]   = useState<number | null>(null)

  const searchDebounce    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchRef         = useRef<HTMLInputElement>(null)
  const closeTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef            = useRef<HTMLElement>(null)
  const dropdownItemsRef  = useRef<Map<string, HTMLAnchorElement[]>>(new Map())
  const triggerRefs       = useRef<Map<string, HTMLButtonElement>>(new Map())

  const user     = useAuthStore((s) => s.user)
  const setUser  = useAuthStore((s) => s.setUser)
  const router   = useRouter()
  const pathname = usePathname()
  const firstName = user?.full_name?.split(' ')[0] ?? null

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const go   = (ms = 500) => { closeTimer.current = setTimeout(() => setDropdown(null), ms) }
  const stay = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }

  const handleLogout  = async () => { await supabase.auth.signOut(); setUser(null); router.push('/') }
  const openSearch    = () => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }
  const closeSearch   = () => { setSearchOpen(false); setSearchValue(''); setSearchResults({ events: [], creators: [] }) }
  const submitSearch  = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) { router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`); closeSearch() }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = searchResults.events.length + searchResults.creators.length + 1
    if (!searchValue.trim() || total === 1) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSearchActiveIdx(i => (i + 1) % total) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchActiveIdx(i => (i - 1 + total) % total) }
    else if (e.key === 'Enter' && searchActiveIdx >= 0) {
      e.preventDefault()
      const { events, creators } = searchResults
      if (searchActiveIdx < events.length) router.push(`/events/${events[searchActiveIdx].id}`)
      else if (searchActiveIdx < events.length + creators.length) router.push(`/creators/${creators[searchActiveIdx - events.length].id}`)
      else router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`)
      closeSearch()
    } else if (e.key === 'Escape') {
      closeSearch()
    }
  }

  const handleSearchChange = (val: string) => {
    setSearchValue(val)
    setSearchActiveIdx(-1)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (!val.trim()) { setSearchResults({ events: [], creators: [] }); return }
    setSearchLoading(true)
    searchDebounce.current = setTimeout(async () => {
      const q = val.trim().toLowerCase()
      const [{ data: events }, { data: profiles }] = await Promise.all([
        supabase.from('events').select('id,title,city,cover_image').eq('status', 'published').ilike('title', `%${q}%`).limit(4),
        supabase.from('profiles').select('id,full_name,username,avatar_url').eq('role', 'creator').ilike('full_name', `%${q}%`).limit(4),
      ])
      setSearchResults({ events: (events ?? []) as any, creators: (profiles ?? []) as any })
      setSearchLoading(false)
    }, 250)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const registerItem = (id: string, el: HTMLAnchorElement | null, idx: number) => {
    if (!dropdownItemsRef.current.has(id)) dropdownItemsRef.current.set(id, [])
    const arr = dropdownItemsRef.current.get(id)!
    if (el) arr[idx] = el
  }

  const handleDropdownKeyDown = (e: React.KeyboardEvent, id: string) => {
    const items = dropdownItemsRef.current.get(id) ?? []
    const cur   = items.indexOf(document.activeElement as HTMLAnchorElement)
    if (e.key === 'ArrowDown')  { e.preventDefault(); items[(cur + 1) % items.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(cur - 1 + items.length) % items.length]?.focus() }
    else if (e.key === 'Escape') { e.preventDefault(); setDropdown(null); triggerRefs.current.get(id)?.focus() }
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  // Le wrapper transparent (paddingTop) crée un pont entre trigger et panel
  // pour que onMouseLeave du parent ne fire pas dans le gap de 10px.
  const Panel = ({ id, children, align = 'left', width = 220 }: { id: string; children: React.ReactNode; align?: 'left' | 'right' | 'center'; width?: number }) => (
    <AnimatePresence>
      {dropdown === id && (
        <div
          onKeyDown={(e) => handleDropdownKeyDown(e, id)}
          style={{ ...s.panel(align, width), pointerEvents: 'auto' }}
        >
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            style={s.panelInner()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // ── Trigger button ────────────────────────────────────────────────────────
  const Trigger = ({ id, label, active }: { id: string; label: string; active: boolean }) => (
    <button
      ref={(el) => { if (el) triggerRefs.current.set(id, el) }}
      onMouseEnter={() => setDropdown(id)}
      onClick={() => setDropdown(d => d === id ? null : id)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault(); setDropdown(id)
          setTimeout(() => { dropdownItemsRef.current.get(id)?.[0]?.focus() }, 50)
        } else if (e.key === 'Escape') {
          setDropdown(null)
        }
      }}
      aria-haspopup="menu"
      aria-expanded={dropdown === id}
      style={s.navLink(active)}
    >
      {label}
      <ChevronDown size={12} style={{ opacity: 0.45, transition: 'transform 0.2s', transform: dropdown === id ? 'rotate(180deg)' : 'rotate(0deg)' }} />
    </button>
  )

  // ── Panel rich item (with desc) ───────────────────────────────────────────
  const RichItem = ({ href, icon: Icon, label, desc, idx, panelId }: { href: string; icon: React.ElementType; label: string; desc: string; idx: number; panelId: string }) => {
    const active = isActive(href)
    return (
      <Link href={href} onClick={() => setDropdown(null)}
        role="menuitem"
        ref={(el) => registerItem(panelId, el, idx)}
        style={s.panelItem(active)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? '#F9FAFB' : 'transparent' }}
      >
        <div style={{ width: 34, height: 34, borderRadius: '10px', backgroundColor: active ? '#EEF2FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={active ? '#6366F1' : '#9CA3AF'} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: '1px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: active ? '#6366F1' : '#111827', margin: 0, lineHeight: 1.2, marginBottom: '2px' }}>{label}</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{desc}</p>
        </div>
        <ArrowUpRight size={13} style={{ color: '#D1D5DB', marginTop: '2px', flexShrink: 0 }} />
      </Link>
    )
  }

  // ── Panel simple item ─────────────────────────────────────────────────────
  const SimpleItem = ({ href, icon: Icon, label, idx, panelId, color = '#9CA3AF' }: { href: string; icon: React.ElementType; label: string; idx: number; panelId: string; color?: string }) => {
    const active = isActive(href)
    return (
      <Link href={href} onClick={() => setDropdown(null)}
        role="menuitem"
        ref={(el) => registerItem(panelId, el, idx)}
        style={s.panelItemSimple(active)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; (e.currentTarget as HTMLElement).style.color = '#111827' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = active ? '#EEF2FF' : 'transparent'; (e.currentTarget as HTMLElement).style.color = active ? '#6366F1' : '#374151' }}
      >
        <Icon size={14} color={active ? '#6366F1' : color} />
        {label}
      </Link>
    )
  }

  const iconBtn: React.CSSProperties = {
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '10px', background: 'none', border: 'none', cursor: 'pointer',
    color: '#9CA3AF', transition: 'color 0.15s, background 0.15s',
  }

  return (
    <>
      {/* ── Bar ── */}
      <header
        style={{
          position: 'fixed', inset: '0 0 auto 0', zIndex: 50,
          transition: 'all 0.5s',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ transition: 'all 0.5s', pointerEvents: 'auto', ...(scrolled ? { margin: '12px 24px 0' } : {}) }}>
          <div style={{
            maxWidth: '1280px', margin: '0 auto', padding: '0 20px',
            height: '58px', display: 'flex', alignItems: 'center', gap: '32px',
            transition: 'all 0.5s',
            backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            ...(scrolled ? {
              borderRadius: '18px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
              border: '1px solid rgba(0,0,0,0.06)',
            } : {
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }),
          }}>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
              <Image src="/logo-mark.png" alt="Nexart" width={26} height={26} style={{ borderRadius: '8px' }} priority />
              <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: '#111827' }}>
                Nexart
              </span>
            </Link>

            {/* Desktop nav */}
            <nav
              ref={navRef}
              style={{ display: 'none', alignItems: 'center', gap: 0, flex: 1 }}
              className="lg-flex"
              onMouseLeave={(e) => {
                if (!navRef.current?.contains(e.relatedTarget as Node)) setDropdown(null)
              }}
            >

              {/* Découvrir */}
              <div style={{ position: 'relative' }} onMouseEnter={() => setDropdown('discover')}>
                <Trigger id="discover" label="Découvrir" active={isActive('/events') || isActive('/creators') || isActive('/carte')} />
                <Panel id="discover" width={320}>
                  <RichItem panelId="discover" idx={0} href="/events"      icon={Ticket}   label="Événements artisanaux" desc="Marchés, pop-ups, salons, festivals" />
                  <RichItem panelId="discover" idx={1} href="/creators"    icon={Palette}  label="Créateurs & Artisans"  desc="Parcourez les artisans inscrits" />
                  <RichItem panelId="discover" idx={2} href="/carte"       icon={MapPin}   label="Carte interactive"      desc="Événements près de chez vous" />
                  <RichItem panelId="discover" idx={3} href="/calendrier"  icon={Calendar} label="Calendrier"             desc="Tous les événements à venir" />
                  <RichItem panelId="discover" idx={4} href="/search"      icon={Search}   label="Recherche avancée"      desc="Filtrer par discipline, région…" />
                </Panel>
              </div>

              {/* Communauté */}
              <div style={{ position: 'relative' }} onMouseEnter={() => setDropdown('community')}>
                <Trigger id="community" label="Communauté" active={isActive('/feed') || isActive('/tendances') || isActive('/favorites')} />
                <Panel id="community" width={240}>
                  <SimpleItem panelId="community" idx={0} href="/feed"      icon={Users}      label="Fil d'actualité" />
                  <SimpleItem panelId="community" idx={1} href="/tendances" icon={TrendingUp}  label="Tendances" />
                  <SimpleItem panelId="community" idx={2} href="/favorites" icon={Heart}       label="Mes favoris" />
                  <SimpleItem panelId="community" idx={3} href="/messages"  icon={MessageCircle} label="Messagerie" />
                </Panel>
              </div>

              {/* Organisateurs */}
              <div style={{ position: 'relative' }} onMouseEnter={() => setDropdown('organizer')}>
                <Trigger id="organizer" label="Organisateurs" active={isActive('/events/create') || isActive('/offres') || isActive('/organizer')} />
                <Panel id="organizer" width={280}>
                  <RichItem panelId="organizer" idx={0} href="/events/create"      icon={Plus}      label="Créer un événement"    desc="Publiez votre marché ou salon" />
                  <RichItem panelId="organizer" idx={1} href="/offres"             icon={Zap}       label="Offres & tarifs"        desc="Plans créateurs et organisateurs" />
                  <RichItem panelId="organizer" idx={2} href="/organizer/analytics" icon={BarChart2} label="Analytiques"            desc="Stats de vos événements" />
                </Panel>
              </div>

              {/* Nexart */}
              <div style={{ position: 'relative' }} onMouseEnter={() => setDropdown('about')}>
                <Trigger id="about" label="Nexart" active={isActive('/about') || isActive('/carnet-de-route') || isActive('/patch-notes')} />
                <Panel id="about" width={220}>
                  <SimpleItem panelId="about" idx={0} href="/about"           icon={Users}    label="À propos" />
                  <SimpleItem panelId="about" idx={1} href="/carnet-de-route" icon={BookOpen} label="Carnet de route" />
                  <SimpleItem panelId="about" idx={2} href="/patch-notes"     icon={FileText} label="Patch Notes" />
                  <SimpleItem panelId="about" idx={3} href="/contact"         icon={MessageCircle} label="Contact" />
                </Panel>
              </div>
            </nav>

            {/* Desktop right */}
            <div style={{ display: 'none', alignItems: 'center', gap: '2px', marginLeft: 'auto' }} className="lg-flex">

              {/* Search */}
              <div ref={searchContainerRef} style={{ position: 'relative' }}>
                <AnimatePresence mode="wait">
                  {searchOpen ? (
                    <motion.form key="open"
                      initial={{ width: 32, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 32, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      onSubmit={submitSearch}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '34px', padding: '0 12px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', overflow: 'hidden' }}
                    >
                      <Search size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                      <input ref={searchRef} value={searchValue}
                        onChange={e => handleSearchChange(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Rechercher…"
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '13px', color: '#111827', minWidth: 0 }}
                      />
                      {searchLoading
                        ? <div style={{ width: 12, height: 12, border: '2px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                        : <button type="button" onClick={closeSearch} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9CA3AF' }}><X size={12} /></button>
                      }
                    </motion.form>
                  ) : (
                    <motion.button key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={openSearch}
                      aria-label="Ouvrir la recherche"
                      style={{ ...iconBtn }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
                    >
                      <Search size={15} />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Live results */}
                <AnimatePresence>
                  {searchOpen && searchValue.trim() && (searchResults.events.length > 0 || searchResults.creators.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                      style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px', backgroundColor: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #F3F4F6', overflow: 'hidden', zIndex: 999, pointerEvents: 'auto' }}
                    >
                      {searchResults.events.length > 0 && (
                        <div>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', padding: '10px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Événements</p>
                          {searchResults.events.map((ev, i) => (
                            <Link key={ev.id} href={`/events/${ev.id}`} onClick={closeSearch}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', textDecoration: 'none', backgroundColor: searchActiveIdx === i ? '#F9FAFB' : 'transparent' }}
                              onMouseEnter={e => { setSearchActiveIdx(i); (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB' }}
                              onMouseLeave={e => { if (searchActiveIdx !== i) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                            >
                              <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: '#EEF2FF', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {ev.cover_image ? <Image src={ev.cover_image} alt={ev.title} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /> : <Calendar size={16} color="#6366F1" />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                                {ev.city && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{ev.city}</p>}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.creators.length > 0 && (
                        <div style={{ borderTop: searchResults.events.length > 0 ? '1px solid #F3F4F6' : 'none' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', padding: '10px 14px 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Créateurs</p>
                          {searchResults.creators.map((cr, i) => {
                            const idx = searchResults.events.length + i
                            return (
                              <Link key={cr.id} href={`/creators/${cr.id}`} onClick={closeSearch}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', textDecoration: 'none', backgroundColor: searchActiveIdx === idx ? '#F9FAFB' : 'transparent' }}
                                onMouseEnter={e => { setSearchActiveIdx(idx); (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB' }}
                                onMouseLeave={e => { if (searchActiveIdx !== idx) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                              >
                                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#EEF2FF', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {cr.avatar_url ? <Image src={cr.avatar_url} alt={cr.full_name} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /> : <Palette size={14} color="#6366F1" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{cr.username ?? cr.full_name}</p>
                                  {cr.username && <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{cr.full_name}</p>}
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #F3F4F6' }}>
                        <Link href={`/search?q=${encodeURIComponent(searchValue.trim())}`} onClick={closeSearch}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#6366F1' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                        >
                          <Search size={13} /> Voir tous les résultats
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <WhatsNew dark={false} />
              <ThemeToggle />

              {user ? (
                <>
                  <Link href="/favorites" title="Mes favoris" style={iconBtn}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
                  >
                    <Heart size={16} />
                  </Link>
                  <Link href="/messages" style={iconBtn}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'; (e.currentTarget as HTMLElement).style.color = '#374151' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
                  >
                    <MessageCircle size={16} />
                  </Link>

                  {/* Credits badge */}
                  {creditBalance !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', borderRadius: '20px', padding: '3px 8px 3px 6px', height: '28px' }}>
                      <Zap size={11} color="#FFF" fill="#FFF" />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFF', lineHeight: 1, marginLeft: '2px' }}>{creditBalance}</span>
                      <Link href="/dashboard?tab=credits" title="Acheter des crédits"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', marginLeft: '4px', flexShrink: 0 }}
                      >
                        <Plus size={9} color="#FFF" strokeWidth={3} />
                      </Link>
                    </div>
                  )}

                  {/* Profile dropdown */}
                  <div style={{ position: 'relative', marginLeft: '4px' }}
                    onMouseEnter={() => { stay(); setDropdown('profile') }}
                    onMouseLeave={() => go()}
                  >
                    <button
                      ref={(el) => { if (el) triggerRefs.current.set('profile', el) }}
                      onClick={() => setDropdown(d => d === 'profile' ? null : 'profile')}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') { e.preventDefault(); setDropdown('profile'); setTimeout(() => dropdownItemsRef.current.get('profile')?.[0]?.focus(), 50) }
                        else if (e.key === 'Escape') setDropdown(null)
                      }}
                      aria-haspopup="menu"
                      aria-expanded={dropdown === 'profile'}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '12px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {user.avatar_url
                          ? <Image src={user.avatar_url} alt={user.full_name ?? firstName ?? 'Avatar'} width={26} height={26} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          : <span style={{ fontSize: '9px', fontWeight: 900, color: '#fff' }}>{firstName?.[0]?.toUpperCase() ?? '?'}</span>
                        }
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#4B5563' }}>{firstName ?? 'Moi'}</span>
                      <ChevronDown size={11} style={{ opacity: 0.4, transition: 'transform 0.2s', transform: dropdown === 'profile' ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    <Panel id="profile" align="right" width={200}>
                      <div style={{ padding: '12px 14px 10px', marginBottom: '4px', borderBottom: '1px solid #F3F4F6' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{firstName}</p>
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(user.is_creator || user.role === 'creator') && (
                            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: '#EEF2FF', color: '#6366F1', border: '1px solid #E0E7FF' }}>Créateur</span>
                          )}
                          {(user.is_organizer || user.role === 'organizer') && (
                            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE' }}>Organisateur</span>
                          )}
                          {!user.is_creator && !user.is_organizer && user.role === 'visitor' && (
                            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, backgroundColor: '#F9FAFB', color: '#9CA3AF', border: '1px solid #F3F4F6' }}>Visiteur</span>
                          )}
                        </div>
                      </div>

                      <SimpleItem panelId="profile" idx={0} href="/dashboard" icon={User} label="Mon dashboard" />
                      <SimpleItem panelId="profile" idx={user.is_creator || user.is_organizer ? 2 : 1} href="/profile"       icon={User}  label="Mon profil" />
                      <SimpleItem panelId="profile" idx={user.is_creator || user.is_organizer ? 3 : 2} href="/notifications" icon={Bell}  label="Notifications" />
                      <SimpleItem panelId="profile" idx={user.is_creator || user.is_organizer ? 4 : 3} href="/settings"      icon={User}  label="Paramètres" />

                      <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '4px 0' }} />
                      <button onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 500, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#FEF2F2'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={14} /> Déconnexion
                      </button>
                    </Panel>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                  <Link href="/login"
                    style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 500, color: '#4B5563', textDecoration: 'none', borderRadius: '10px', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                  >
                    Connexion
                  </Link>
                  <Link href="/register"
                    style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', textDecoration: 'none', transition: 'all 0.15s', backgroundColor: '#111827', color: '#fff' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
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
              style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', justifyContent: 'center', alignItems: 'center', width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0,0,0,0.08)', border: 'none', cursor: 'pointer' }}
              className="lg-hidden"
            >
              <motion.span animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }}
                style={{ display: 'block', height: '2px', width: '18px', borderRadius: '2px', backgroundColor: '#1F2937' }}
              />
              <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.2 }}
                style={{ display: 'block', height: '2px', width: '18px', borderRadius: '2px', backgroundColor: '#1F2937' }}
              />
              <motion.span animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }}
                style={{ display: 'block', height: '2px', width: '18px', borderRadius: '2px', backgroundColor: '#1F2937' }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(6,6,15,0.96)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
              onClick={() => setMobileOpen(false)}
              className="lg-hidden"
            />
            <motion.nav
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'fixed', left: 0, right: 0, top: '58px', zIndex: 40, display: 'flex', flexDirection: 'column', padding: '24px 20px 40px', gap: '4px', overflowY: 'auto', maxHeight: 'calc(100vh - 58px)' }}
              className="lg-hidden"
            >
              {/* Search */}
              <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}
                onSubmit={submitSearch}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '44px', padding: '0 16px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}
              >
                <Search size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                <input value={searchValue} onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Rechercher événements, créateurs…"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', color: '#fff' }}
                />
                {searchValue && (
                  <button type="button" aria-label="Effacer" onClick={() => { setSearchValue(''); setSearchResults({ events: [], creators: [] }) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}
                  ><X size={13} /></button>
                )}
              </motion.form>

              {/* Main links */}
              {[
                { href: '/events',   label: 'Événements' },
                { href: '/creators', label: 'Créateurs' },
                { href: '/carte',    label: 'Carte' },
                { href: '/offres',   label: 'Offres' },
                { href: '/feed',     label: 'Communauté' },
                { href: '/calendrier', label: 'Calendrier' },
              ].map(({ href, label }, i) => (
                <motion.div key={href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 + 0.05 }}>
                  <Link href={href} onClick={() => setMobileOpen(false)}
                    style={{ display: 'block', padding: '10px 0', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', textDecoration: 'none', transition: 'color 0.15s', color: isActive(href) ? '#fff' : 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isActive(href) ? '#fff' : 'rgba(255,255,255,0.3)'}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', textDecoration: 'none' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {user.avatar_url
                          ? <Image src={user.avatar_url} alt={user.full_name ?? firstName ?? 'Avatar'} width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          : <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>{firstName?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>{firstName ?? 'Mon compte'}</p>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                      </div>
                    </Link>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                      {[
                        { href: '/messages',     icon: MessageCircle, label: 'Messages' },
                        { href: '/favorites',    icon: Heart,         label: 'Favoris' },
                        { href: '/notifications',icon: Bell,          label: 'Notifs' },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 8px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.06)'}
                        >
                          <Icon size={18} color="rgba(255,255,255,0.65)" />
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{label}</span>
                        </Link>
                      ))}
                    </div>

                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}
                    >
                      Mon dashboard
                    </Link>
                    <button onClick={() => { setMobileOpen(false); handleLogout() }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'rgba(255,255,255,0.3)', padding: '8px 0', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F87171'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
                    >
                      Se déconnecter
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/register" onClick={() => setMobileOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px', borderRadius: '14px', backgroundColor: '#fff', color: '#111827', fontSize: '15px', fontWeight: 700, textDecoration: 'none' }}
                    >
                      S'inscrire gratuitement
                    </Link>
                    <Link href="/login" onClick={() => setMobileOpen(false)}
                      style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.35)', padding: '8px', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}
                    >
                      Déjà un compte ? Se connecter
                    </Link>
                  </>
                )}
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ── CSS helpers (desktop show/hide) ── */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-flex { display: flex !important; }
          .lg-hidden { display: none !important; }
        }
        @media (max-width: 1023px) {
          .lg-flex { display: none !important; }
          .lg-hidden { display: flex !important; }
        }
      `}</style>
    </>
  )
}
