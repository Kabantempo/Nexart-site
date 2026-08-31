'use client'

import { useCreators } from '@/lib/hooks'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Search, X, ArrowUpAZ, Clock, Palette, Sparkles, BadgeCheck, Star, TrendingUp, Navigation, Zap } from 'lucide-react'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import { NexPagination } from '@/components/ui/nex-pagination'

const ITEMS_PER_PAGE = 12

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

function WordReveal({ children, delay = 0, className = '' }: { children: string; delay?: number; className?: string }) {
  return (
    <span className={className}>
      {children.split(' ').map((w, i) => (
        <motion.span key={i} className="inline-block mr-[0.22em] last:mr-0"
          initial={{ opacity: 0, y: '110%' }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: delay + i * 0.075, ease: [0.22, 1, 0.36, 1] }}>
          {w}
        </motion.span>
      ))}
    </span>
  )
}

const DISCIPLINE_PILL = 'bg-black/60 backdrop-blur-sm'

function Skeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="h-48 bg-[${colors.dark.base}] animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <div className="h-12 bg-gray-100 rounded-2xl mb-4 animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-2xl mb-8 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg" />
                <div className="h-3 w-2/3 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CreatorsContent() {
  const { creators, loading, error } = useCreators()
  const searchParams = useSearchParams()

  const [searchTerm,       setSearchTerm]       = useState(searchParams?.get('q') || '')
  const [cityFilter,       setCityFilter]       = useState('all')
  const [disciplineFilter, setDisciplineFilter] = useState('all')
  const [sortOrder,        setSortOrder]        = useState<'alpha' | 'newest' | 'rating' | 'popular'>('alpha')
  const [visibleCount,     setVisibleCount]     = useState(ITEMS_PER_PAGE)
  const [ratingsMap,       setRatingsMap]       = useState<Record<string, number>>({})
  const [followersMap,     setFollowersMap]     = useState<Record<string, number>>({})
  const [userCoords,       setUserCoords]       = useState<{ lat: number; lng: number } | null>(null)
  const [geoLoading,       setGeoLoading]       = useState(false)
  const [geoError,         setGeoError]         = useState<string | null>(null)
  const [showSuggestions,  setShowSuggestions]  = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const [availableOnly,    setAvailableOnly]    = useState(false)
  const [openToCollab,     setOpenToCollab]     = useState(false)
  const [isDesktop,        setIsDesktop]        = useState(true)
  const [headerVisible,    setHeaderVisible]    = useState(true)
  const [mobileDisc,       setMobileDisc]       = useState('tous')
  const [featActive,       setFeatActive]       = useState(0)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Sync URL → state on mount
  useEffect(() => {
    const q = searchParams?.get('q'); if (q) setSearchTerm(q)
    const city = searchParams?.get('city'); if (city) setCityFilter(city)
    const disc = searchParams?.get('disc'); if (disc) setDisciplineFilter(disc)
    if (searchParams?.get('available') === '1') setAvailableOnly(true)
    if (searchParams?.get('collab') === '1') setOpenToCollab(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, disciplineFilter, sortOrder, availableOnly, openToCollab])
  useEffect(() => { setActiveSuggestion(-1) }, [searchTerm, showSuggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSuggestions(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape) }
  }, [])

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isDesktop) return
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 60) { setHeaderVisible(true); lastY = y; return }
      setHeaderVisible(y < lastY); lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isDesktop])

  useEffect(() => {
    if (isDesktop) return
    const items = creators.filter(c => c.portfolio_images?.[0] || c.avatar_url).slice(0, 5)
    if (!items.length) return
    const t = setInterval(() => setFeatActive(i => (i + 1) % items.length), 4000)
    return () => clearInterval(t)
  }, [isDesktop, creators])

  useEffect(() => {
    const loadStats = async () => {
      const [{ data: reviews }, { data: follows }] = await Promise.all([
        supabase.from('reviews').select('reviewed_id, rating'),
        supabase.from('creator_followers').select('creator_id'),
      ])
      const rm: Record<string, { sum: number; count: number }> = {}
      ;(reviews ?? []).forEach(r => {
        if (!rm[r.reviewed_id]) rm[r.reviewed_id] = { sum: 0, count: 0 }
        rm[r.reviewed_id].sum += r.rating
        rm[r.reviewed_id].count++
      })
      setRatingsMap(Object.fromEntries(Object.entries(rm).map(([id, v]) => [id, v.sum / v.count])))
      const fm: Record<string, number> = {}
      ;(follows ?? []).forEach(f => { fm[f.creator_id] = (fm[f.creator_id] ?? 0) + 1 })
      setFollowersMap(fm)
    }
    loadStats()
  }, [])

  const uniqueCities      = [...new Set(creators.map((c) => c.city).filter(Boolean))].sort() as string[]
  const uniqueDisciplines = [...new Set(creators.flatMap((c) => c.disciplines || []).filter(Boolean))].sort() as string[]

  const suggestions = searchTerm.length >= 2 ? (() => {
    const term = searchTerm.toLowerCase()
    const matchedCreators = creators.filter(c => c.full_name?.toLowerCase().includes(term)).slice(0, 6).map(c => ({ type: 'creator' as const, value: c.full_name }))
    const matchedDiscs = uniqueDisciplines.filter(d => d.toLowerCase().includes(term)).slice(0, 3).map(d => ({ type: 'discipline' as const, value: d }))
    const matchedCities = uniqueCities.filter(c => c.toLowerCase().includes(term)).slice(0, 3).map(c => ({ type: 'city' as const, value: c }))
    return [...matchedCreators, ...matchedDiscs, ...matchedCities].slice(0, 6)
  })() : []

  const creatorsWithDist = userCoords
    ? creators.map(c => ({
        ...c,
        _dist: (c.lat && c.lng) ? haversine(userCoords.lat, userCoords.lng, c.lat, c.lng) : Infinity
      }))
    : creators.map(c => ({ ...c, _dist: Infinity }))

  const filtered = creatorsWithDist
    .filter((c) =>
      !searchTerm ||
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.disciplines || []).some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter((c) => cityFilter === 'all' || c.city === cityFilter)
    .filter((c) => disciplineFilter === 'all' || (c.disciplines || []).includes(disciplineFilter))
    .filter((c) => !availableOnly || (c as any).availability === 'available')
    .filter((c) => !openToCollab || (c as any).open_to_collab === true)
    .sort((a, b) => {
      if (userCoords)              return a._dist - b._dist
      if (sortOrder === 'alpha')   return (a.full_name || '').localeCompare(b.full_name || '', 'fr')
      if (sortOrder === 'newest')  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortOrder === 'rating')  return (ratingsMap[b.id] ?? 0) - (ratingsMap[a.id] ?? 0)
      if (sortOrder === 'popular') return (followersMap[b.id] ?? 0) - (followersMap[a.id] ?? 0)
      return 0
    })

  const visible     = filtered.slice(0, visibleCount)
  const hasMore     = visibleCount < filtered.length
  const hasActiveFilters = cityFilter !== 'all' || disciplineFilter !== 'all' || sortOrder !== 'alpha' || !!searchTerm || availableOnly || openToCollab
  const sortLabels: Record<string, string> = { alpha: 'A → Z', newest: 'Récents', rating: 'Note', popular: 'Popularité' }
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100
  const verifiedCount = creators.filter(c => c.siret_verified).length

  const resetFilters = () => { setCityFilter('all'); setDisciplineFilter('all'); setSortOrder('alpha'); setSearchTerm(''); setUserCoords(null); setGeoError(null); setAvailableOnly(false); setOpenToCollab(false) }

  const shareFilters = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (cityFilter !== 'all') params.set('city', cityFilter)
    if (disciplineFilter !== 'all') params.set('disc', disciplineFilter)
    if (availableOnly) params.set('available', '1')
    if (openToCollab) params.set('collab', '1')
    const url = `${window.location.pathname}?${params.toString()}`
    router.push(url, { scroll: false })
    navigator.clipboard.writeText(window.location.origin + url).catch(() => {})
  }

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setGeoError('Géolocalisation non supportée'); return }
    setGeoLoading(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSortOrder('alpha')
        setGeoLoading(false)
      },
      () => { setGeoError('Localisation refusée'); setGeoLoading(false) }
    )
  }

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  if (loading) return <Skeleton />

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-red-500">Une erreur est survenue.</p>
    </div>
  )

  // ── Mobile layout ────────────────────────────────────────────────────────────
  if (!isDesktop) {
    const CARD_W = 180
    const IMG_H  = 148

    const discFilters = [{ key: 'tous', label: 'Tous' }, ...uniqueDisciplines.slice(0, 9).map(d => ({ key: d, label: d }))]
    const mobileFiltered = mobileDisc === 'tous' ? filtered : filtered.filter(c => (c.disciplines || []).includes(mobileDisc))
    const featCreators   = creators.filter(c => c.portfolio_images?.[0] || c.avatar_url).slice(0, 5)
    const verifiedSection  = mobileFiltered.filter(c => c.siret_verified).slice(0, 10)
    const newestSection    = [...mobileFiltered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)
    const availableSection = mobileFiltered.filter(c => (c as any).availability === 'available').slice(0, 10)
    const collabSection    = mobileFiltered.filter(c => (c as any).open_to_collab).slice(0, 10)
    const discSections = uniqueDisciplines.slice(0, 5).map(disc => ({
      title: disc,
      items: mobileFiltered.filter(c => (c.disciplines || []).includes(disc)).slice(0, 10),
    })).filter(s => s.items.length >= 2)

    const MCard = ({ c, i = 0 }: { c: typeof creators[0]; i?: number }) => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: i * 0.06 }}
        onClick={() => router.push(`/creators/${c.id}`)}
        style={{ flexShrink: 0, width: CARD_W, borderRadius: 14, backgroundColor: 'var(--ev-card-bg)', overflow: 'hidden', scrollSnapAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ position: 'relative', width: '100%', height: IMG_H, flexShrink: 0, backgroundColor: 'var(--ev-card-bg2)' }}>
          {(c.portfolio_images?.[0] || c.avatar_url) ? (
            <Image src={c.portfolio_images?.[0] || c.avatar_url!} alt={c.full_name || ''} fill sizes={`${CARD_W}px`} style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: colors.violet.primary, opacity: 0.7 }}>{c.full_name?.slice(0, 2).toUpperCase() || '?'}</span>
            </div>
          )}
          {c.siret_verified && (
            <span style={{ position: 'absolute', top: 7, left: 7, backgroundColor: 'rgba(99,102,241,0.9)', color: colors.text.white, fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>✓ Vérifié</span>
          )}
          {(c as any).profile_boosted_until && new Date((c as any).profile_boosted_until) > new Date() && (
            <span style={{ position: 'absolute', top: 7, right: 7, backgroundColor: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>⚡ Boosté</span>
          )}
        </div>
        <div style={{ padding: '9px 11px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ev-card-title)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {c.full_name}
          </p>
          {(c.disciplines || []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(c.disciplines || []).slice(0, 2).map((d: string) => (
                <span key={d} style={{ backgroundColor: 'var(--ev-card-tag-bg)', color: 'var(--ev-card-tag-text)', fontSize: 9, fontWeight: 600, borderRadius: 20, padding: '2px 7px' }}>{d}</span>
              ))}
            </div>
          )}
          {c.city && <span style={{ fontSize: 10, color: 'var(--ev-card-date)' }}>📍 {c.city}</span>}
        </div>
      </motion.div>
    )

    const MSection = ({ title, items }: { title: string; items: typeof creators }) => {
      if (!items.length) return null
      return (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 10px 16px', fontSize: 16, fontWeight: 800, color: 'var(--ev-sort-active)', letterSpacing: -0.3 }}>{title}</h2>
          <div style={{ overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: 16 }} className="hide-scrollbar">
            <div style={{ display: 'flex', gap: 10, paddingLeft: 16, paddingRight: 16, paddingBottom: 6 }}>
              {items.map((c, i) => <MCard key={c.id} c={c} i={i} />)}
            </div>
          </div>
        </div>
      )
    }

    const featEv = featCreators[featActive] ?? null

    return (
      <>
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        `}</style>

        <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>

          {/* Fixed header */}
          <div style={{ position: 'fixed', top: headerVisible ? 58 : -300, left: 0, right: 0, zIndex: 10, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--ev-border)', transition: 'top 0.25s ease' }}>
            <div style={{ padding: '10px 16px 6px' }}>
              <h1 style={{ margin: '0 0 1px', fontSize: 22, fontWeight: 800, color: 'var(--ev-sort-active)', letterSpacing: -0.5 }}>Créateurs</h1>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ev-card-date)' }}>Des talents partout en France</p>
            </div>
            {/* search */}
            <div style={{ padding: '0 16px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ev-chip-bg)', borderRadius: 12, padding: '8px 14px' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={colors.text.light} strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input type="text" placeholder="Nom, discipline, ville…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'transparent' }} />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={colors.text.light} strokeWidth={2.5}><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
            {/* discipline chips */}
            <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
              <div style={{ display: 'flex', gap: 7, paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
                {discFilters.map(f => (
                  <button key={f.key} onClick={() => setMobileDisc(f.key)} style={{ flexShrink: 0, padding: '4px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.15s, color 0.15s', backgroundColor: mobileDisc === f.key ? colors.violet.primary : 'var(--ev-chip-bg)', color: mobileDisc === f.key ? colors.text.white : 'var(--ev-chip-text)' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {/* sort */}
            <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px' }}>
              {([['alpha', 'A → Z'], ['newest', 'Récents'], ['rating', '⭐ Note'], ['popular', '🔥 Pop.']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setSortOrder(key)} style={{ padding: '4px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, backgroundColor: sortOrder === key ? 'var(--ev-sort-active)' : 'var(--ev-chip-bg)', color: sortOrder === key ? 'var(--bg-primary)' : 'var(--ev-chip-text)' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ height: 192 }} />

          {/* Featured carousel */}
          {featCreators.length > 0 && featEv && (
            <div style={{ margin: '0 0 24px', position: 'relative' }}>
              <motion.div key={featEv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                onClick={() => router.push(`/creators/${featEv.id}`)}
                style={{ height: 210, position: 'relative', backgroundColor: 'var(--ev-card-bg)', cursor: 'pointer', overflow: 'hidden' }}>
                {(featEv.portfolio_images?.[0] || featEv.avatar_url) && (
                  <Image src={featEv.portfolio_images?.[0] || featEv.avatar_url!} alt={featEv.full_name || ''} fill style={{ objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,20,0.92) 0%, rgba(10,10,20,0.25) 60%, transparent 100%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 12px' }}>
                  <p style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 800, color: colors.text.white, lineHeight: 1.2 }}>{featEv.full_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {(featEv.disciplines || []).slice(0, 2).map((d: string) => (
                        <span key={d} style={{ backgroundColor: 'rgba(99,102,241,0.3)', color: colors.purple.bgPale, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>{d}</span>
                      ))}
                    </div>
                    {featEv.city && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>📍 {featEv.city}</span>}
                  </div>
                </div>
              </motion.div>
              {/* dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                {featCreators.map((_, i) => (
                  <button key={i} onClick={() => setFeatActive(i)} style={{ width: i === featActive ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, backgroundColor: i === featActive ? colors.violet.primary : 'var(--ev-chip-bg)', transition: 'width 0.3s, background-color 0.3s' }} />
                ))}
              </div>
            </div>
          )}

          {/* Stories — cercles PP + nom */}
          {mobileFiltered.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
                <div style={{ display: 'flex', gap: 14, paddingLeft: 16, paddingRight: 16, paddingBottom: 4 }}>
                  {mobileFiltered.slice(0, 15).map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.22, delay: i * 0.04 }}
                      onClick={() => router.push(`/creators/${c.id}`)}
                      style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', width: 58 }}
                    >
                      <div style={{ position: 'relative', width: 54, height: 54, borderRadius: '50%', flexShrink: 0, padding: 2.5, background: c.siret_verified ? `linear-gradient(135deg, ${colors.violet.primary}, ${colors.purple.violet}, ${colors.fuchsia.primary})` : `linear-gradient(135deg, ${colors.gray['300']}, ${colors.text.light})` }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--ev-card-bg2)', border: '2px solid var(--bg-primary)' }}>
                        {(c.avatar_url || c.portfolio_images?.[0]) ? (
                          <Image src={c.avatar_url || c.portfolio_images![0]} alt={c.full_name || ''} fill sizes="54px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: colors.violet.primary }}>{c.full_name?.slice(0, 1).toUpperCase() || '?'}</span>
                          </div>
                        )}
                      </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ev-card-title)', textAlign: 'center', lineHeight: 1.2, maxWidth: 58, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {c.full_name?.split(' ')[0] || '—'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sections */}
          {verifiedSection.length > 0 && <MSection title="Créateurs vérifiés ✓" items={verifiedSection} />}
          {newestSection.length > 0 && <MSection title="Nouveaux arrivants" items={newestSection} />}
          {availableSection.length > 0 && <MSection title="Disponibles maintenant" items={availableSection} />}
          {collabSection.length > 0 && <MSection title="Ouverts aux collabs" items={collabSection} />}
          {discSections.map(s => <MSection key={s.title} title={s.title} items={s.items} />)}

          {/* Empty state */}
          {mobileFiltered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ev-sort-active)', margin: '0 0 6px' }}>Aucun créateur trouvé</p>
              <p style={{ fontSize: 13, color: 'var(--ev-card-date)' }}>Essayez un autre mot-clé ou discipline</p>
              <button onClick={resetFilters} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 20, border: `1px solid ${colors.violet.primary}`, backgroundColor: 'transparent', color: colors.violet.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  // ── Desktop layout ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* Hero */}
      <div className="creators-hero bg-[${colors.dark.base}] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 left-0 w-80 h-80 rounded-full bg-indigo-600/15 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={13} className="text-violet-400" />
              <span className="text-indigo-400 text-xs font-semibold">Communauté</span>
            </div>
          </motion.div>

          <div className="overflow-hidden mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              <WordReveal delay={0.05}>Créateurs</WordReveal>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            className="text-white/40 text-base mb-10"
          >
            Des talents partout en France — trouvez le créateur idéal pour votre événement
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            {[
              { value: creators.length, label: 'créateurs' },
              { value: uniqueCities.length, label: 'villes' },
              { value: uniqueDisciplines.length, label: 'disciplines' },
              ...(verifiedCount > 0 ? [{ value: verifiedCount, label: 'vérifiés' }] : []),
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-white font-bold text-sm">{value}</span>
                <span className="text-white/40 text-xs">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* Search */}
        <div className="relative mb-4" ref={searchContainerRef}>
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Nom, discipline, ville…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true) }}
            onFocus={() => { if (searchTerm.length >= 2) setShowSuggestions(true) }}
            onKeyDown={(e) => {
              if (!showSuggestions || !suggestions.length) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveSuggestion(i => Math.max(i - 1, -1))
              } else if (e.key === 'Enter' && activeSuggestion >= 0) {
                e.preventDefault()
                setSearchTerm(suggestions[activeSuggestion].value)
                setShowSuggestions(false)
                setActiveSuggestion(-1)
              }
            }}
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setShowSuggestions(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden" role="listbox">
              {(() => {
                let globalIdx = -1
                const labels: Record<string, string> = { creator: 'Créateurs', discipline: 'Disciplines', city: 'Villes' }
                return (['creator', 'discipline', 'city'] as const).map(type => {
                  const group = suggestions.filter(s => s.type === type)
                  if (!group.length) return null
                  return (
                    <div key={type}>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels[type]}</p>
                      {group.map(s => {
                        globalIdx++
                        const idx = globalIdx
                        const isActive = activeSuggestion === idx
                        return (
                          <button key={s.value}
                            role="option"
                            aria-selected={isActive}
                            onMouseDown={() => { setSearchTerm(s.value); setShowSuggestions(false); setActiveSuggestion(-1) }}
                            style={{ backgroundColor: isActive ? colors.violet.bg : undefined, color: isActive ? colors.purple.indigoDark : undefined }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                            {s.value}
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="creators-filter-panel bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-7">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-5 items-start sm:items-end">
            {uniqueCities.length > 0 && (
              <div className="w-full sm:w-auto">
                <p className="text-[11px] font-bold text-gray-400 mb-3">Ville</p>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                  className={`w-full sm:w-auto px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer focus:outline-none transition ${
                    cityFilter !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                  <option value="all">Toutes les villes</option>
                  {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {uniqueDisciplines.length > 0 && (
              <div className="w-full sm:w-auto">
                <p className="text-[11px] font-bold text-gray-400 mb-3">Discipline</p>
                <select value={disciplineFilter} onChange={(e) => setDisciplineFilter(e.target.value)}
                  className={`w-full sm:w-auto px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer focus:outline-none transition ${
                    disciplineFilter !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                  <option value="all">Toutes les disciplines</option>
                  {uniqueDisciplines.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div className="w-full sm:w-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-3">Trier par</p>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                {([['alpha', <ArrowUpAZ key="a" size={13} />, 'A → Z'], ['newest', <Clock key="c" size={13} />, 'Récents'], ['rating', <Star key="r" size={13} />, 'Note'], ['popular', <TrendingUp key="p" size={13} />, 'Popularité']] as const).map(([key, icon, label], i) => (
                  <button key={key} onClick={() => setSortOrder(key)}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${i === 1 ? 'border-l border-gray-200' : ''} ${
                      sortOrder === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-3">Disponibilité</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div
                    onClick={() => setAvailableOnly(v => !v)}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                      backgroundColor: availableOnly ? colors.green.primary : colors.border.default,
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '2px',
                      left: availableOnly ? '18px' : '2px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      backgroundColor: colors.bg.primary, transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', color: availableOnly ? colors.green.text : colors.gray["600"], fontWeight: availableOnly ? 600 : 400 }}>
                    Disponible pour événements
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div
                    onClick={() => setOpenToCollab(v => !v)}
                    style={{
                      width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                      backgroundColor: openToCollab ? colors.violet.primary : colors.border.default,
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '2px',
                      left: openToCollab ? '18px' : '2px',
                      width: '16px', height: '16px', borderRadius: '50%',
                      backgroundColor: colors.bg.primary, transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                  <span style={{ fontSize: '13px', color: openToCollab ? colors.purple.indigoDeep : colors.gray["600"], fontWeight: openToCollab ? 600 : 400 }}>
                    Ouvert aux collaborations
                  </span>
                </label>
              </div>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-3">Proximité</p>
              <button
                onClick={userCoords ? () => { setUserCoords(null); setGeoError(null) } : handleGeolocate}
                disabled={geoLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                  userCoords
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
                } disabled:opacity-50`}
              >
                <Navigation size={14} />
                {geoLoading ? 'Localisation…' : userCoords ? 'Autour de moi ✓' : 'Autour de moi'}
              </button>
              {geoError && <p className="text-xs text-red-500 mt-1">{geoError}</p>}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap items-center">
              <span className="text-xs text-gray-400 font-medium">Actifs :</span>
              {searchTerm && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">"{searchTerm}" <button onClick={() => setSearchTerm('')}><X size={11} /></button></span>}
              {cityFilter !== 'all' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{cityFilter} <button onClick={() => setCityFilter('all')}><X size={11} /></button></span>}
              {disciplineFilter !== 'all' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{disciplineFilter} <button onClick={() => setDisciplineFilter('all')}><X size={11} /></button></span>}
              {sortOrder !== 'alpha' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{sortLabels[sortOrder]} <button onClick={() => setSortOrder('alpha')}><X size={11} /></button></span>}
              {availableOnly && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Disponible <button onClick={() => setAvailableOnly(false)}><X size={11} /></button></span>}
              {openToCollab && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">Open collab <button onClick={() => setOpenToCollab(false)}><X size={11} /></button></span>}
              <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-600 font-semibold ml-1">Tout effacer</button>
              <div className="ml-auto">
                <button onClick={shareFilters}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 11px', borderRadius: '20px', border: `1px solid ${colors.border.default}`,
                    backgroundColor: colors.bg.primary, color: colors.gray["500"], fontSize: '11px', fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔗 Partager ces filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6">
          <Palette size={15} className="text-gray-400" />
          <span className="creators-results-count text-sm text-gray-500">
            <strong className="font-bold text-gray-900 text-base">{filtered.length}</strong> créateur{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span className="text-gray-400"> · filtré{filtered.length !== 1 ? 's' : ''}</span>}
          </span>
        </div>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visible.map((creator, idx) => (
                <FadeUp key={creator.id} delay={Math.min(idx * 0.04, 0.3)}>
                  <Link href={`/creators/${creator.id}`}
                    className="creators-card group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full"
                  >
                    {/* Media header — portfolio if available, avatar fallback */}
                    <div className="relative shrink-0 overflow-hidden bg-gray-100">
                      {creator.portfolio_images?.length >= 2 ? (
                        /* Mini gallery: 1 large + column of 2 */
                        <div className="flex h-48 gap-px">
                          <div className="relative flex-1 overflow-hidden">
                            <Image src={creator.portfolio_images[0]} alt={`Portfolio de ${creator.full_name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          </div>
                          <div className="flex flex-col gap-px w-[38%]">
                            <div className="relative flex-1 overflow-hidden">
                              <Image src={creator.portfolio_images[1]} alt={`Portfolio de ${creator.full_name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            </div>
                            {creator.portfolio_images[2] ? (
                              <div className="relative flex-1 overflow-hidden">
                                <Image src={creator.portfolio_images[2]} alt={`Portfolio de ${creator.full_name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                {creator.portfolio_images.length > 3 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">+{creator.portfolio_images.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : creator.portfolio_images?.length === 1 ? (
                        <div className="relative aspect-square">
                          <Image src={creator.portfolio_images[0]} alt={creator.full_name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ) : creator.avatar_url ? (
                        <div className="relative aspect-square">
                          <Image src={creator.avatar_url} alt={creator.full_name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ) : (
                        <div className="aspect-square w-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.purple.bgF5} 0%, ${colors.purple.bgDdd} 100%)` }}>
                          <span className="text-5xl font-bold select-none" style={{ color: colors.violet.primary, opacity: 0.85 }}>
                            {creator.full_name?.slice(0, 2).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Avatar circle (when showing portfolio) */}
                      {creator.portfolio_images?.length > 0 && creator.avatar_url && (
                        <div className="absolute bottom-3 left-3 w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-md">
                          <Image src={creator.avatar_url} alt={creator.full_name} fill className="object-cover" />
                        </div>
                      )}

                      {/* Discipline pills (show on hover) */}
                      {creator.disciplines?.length > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <div className={`flex flex-wrap gap-1 ${creator.portfolio_images?.length > 0 && creator.avatar_url ? 'pl-11' : ''}`}>
                            {creator.disciplines.slice(0, 3).map((d: string) => (
                              <span key={d} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${DISCIPLINE_PILL}`}>
                                {d}
                              </span>
                            ))}
                            {creator.disciplines.length > 3 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-black/50 backdrop-blur-sm">
                                +{creator.disciplines.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                        {(creator as any).profile_boosted_until && new Date((creator as any).profile_boosted_until) > new Date() && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 border border-indigo-500 shadow-sm shadow-indigo-300">
                            <Zap size={9} className="text-white" fill="white" />
                            <span className="text-[10px] font-bold text-white">Boosté</span>
                          </div>
                        )}
                        {creator.siret_verified && creator.insurance_verified && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm border border-indigo-200">
                            <BadgeCheck size={10} className="text-indigo-600" />
                            <span className="text-[10px] font-semibold text-indigo-600">Vérifié</span>
                          </div>
                        )}
                        {creator.created_at && Date.now() - new Date(creator.created_at).getTime() < 30 * 24 * 3600 * 1000 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/90 backdrop-blur-sm border border-amber-300">
                            <span className="text-[10px] font-bold text-white">Nouveau</span>
                          </div>
                        )}
                        {(creator as { is_active?: boolean }).is_active && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 backdrop-blur-sm border border-emerald-200">
                            <span className="text-[10px] font-semibold text-emerald-600">● Actif</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="creators-card-name font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">{creator.full_name}</h3>

                      {creator.disciplines?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {creator.disciplines.slice(0, 2).map((d: string) => (
                            <span key={d} className="creators-card-badge text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{d}</span>
                          ))}
                          {creator.disciplines.length > 2 && (
                            <span className="creators-card-badge text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-400">+{creator.disciplines.length - 2}</span>
                          )}
                        </div>
                      )}

                      {creator.bio && (
                        <p className="creators-card-meta text-xs text-gray-400 leading-relaxed mb-3 flex-1 line-clamp-2">{creator.bio}</p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1 text-indigo-600 text-xs font-semibold group-hover:gap-2 transition-all">
                          Voir le profil <ArrowRight size={12} />
                        </span>
                        {creator.city && (
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <MapPin size={11} />
                            {creator.city}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>

            <NexPagination
              variant="load-more"
              hasMore={hasMore}
              loaded={Math.min(visibleCount, filtered.length)}
              total={filtered.length}
              onLoadMore={() => setVisibleCount(c => c + ITEMS_PER_PAGE)}
              label="créateurs"
            />
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <p className="text-5xl mb-5">{hasActiveFilters ? '🔍' : '🎨'}</p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun créateur inscrit pour le moment'}
            </h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
              {hasActiveFilters ? "Aucun créateur ne correspond à vos critères." : 'Les premiers artisans arrivent bientôt.'}
            </p>
            {hasActiveFilters
              ? <button onClick={resetFilters} className="px-6 py-2.5 rounded-xl border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors">Réinitialiser</button>
              : <Link href="/register" className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors">Rejoindre en tant que créateur</Link>
            }
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CreatorsClient() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CreatorsContent />
    </Suspense>
  )
}
