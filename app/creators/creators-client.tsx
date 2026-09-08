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
import { VerifiedBadge } from '@/components/ui/verified-badge'

const ITEMS_PER_PAGE = 12

type CreatorItem = { id: string; full_name: string; avatar_url?: string; portfolio_images?: string[]; disciplines?: string[]; city?: string }

function FeaturedCarousel({ items }: { items: CreatorItem[] }) {
  const [active, setActive] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!items.length) return
    const t = setInterval(() => setActive(i => (i + 1) % items.length), 4000)
    return () => clearInterval(t)
  }, [items])

  const feat = items[active] ?? null
  if (!feat) return null

  return (
    <div style={{ margin: '0 0 24px', position: 'relative' }}>
      <motion.div key={feat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        onClick={() => router.push(`/creators/${feat.id}`)}
        style={{ height: 210, position: 'relative', backgroundColor: 'var(--ev-card-bg)', cursor: 'pointer', overflow: 'hidden' }}>
        {(feat.portfolio_images?.[0] || feat.avatar_url) && (
          <Image src={feat.portfolio_images?.[0] || feat.avatar_url!} alt={feat.full_name || ''} fill style={{ objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,20,0.92) 0%, rgba(10,10,20,0.25) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 12px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          {feat.avatar_url && (
            <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', position: 'relative' }}>
              <Image src={feat.avatar_url} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 800, color: colors.text.white, lineHeight: 1.2 }}>{feat.full_name}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {(feat.disciplines || []).slice(0, 2).map((d: string) => (
                  <span key={d} style={{ backgroundColor: 'rgba(99,102,241,0.3)', color: colors.purple.bgPale, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>{d}</span>
                ))}
              </div>
              {feat.city && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={9} style={{ flexShrink: 0 }} />{feat.city}</span>}
            </div>
          </div>
        </div>
      </motion.div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {items.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: i === active ? 18 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, backgroundColor: i === active ? colors.violet.primary : 'var(--ev-chip-bg)', transition: 'width 0.3s, background-color 0.3s' }} />
        ))}
      </div>
    </div>
  )
}

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

function Skeleton() {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ height: 192, backgroundColor: 'var(--bg-secondary)', animationName: 'pulse' }} />
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <div style={{ aspectRatio: '3/4', backgroundColor: 'var(--bg-secondary)' }} />
              <div style={{ padding: 16 }}>
                <div style={{ height: 14, backgroundColor: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ height: 11, width: '60%', backgroundColor: 'var(--bg-secondary)', borderRadius: 8 }} />
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
  const headerVisible = true
  const [mobileDisc,       setMobileDisc]       = useState('tous')
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  useEffect(() => {}, [isDesktop])

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
  const verifiedCount = creators.filter(c => c.siret_verified).length

  const resetFilters = () => { setCityFilter('all'); setDisciplineFilter('all'); setSortOrder('alpha'); setSearchTerm(''); setUserCoords(null); setGeoError(null); setAvailableOnly(false); setOpenToCollab(false) }

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
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: colors.feedback.danger.solid }}>Une erreur est survenue.</p>
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
        style={{ flexShrink: 0, width: CARD_W, borderRadius: 14, backgroundColor: 'var(--ev-card-bg)', border: '1px solid var(--ev-border)', overflow: 'hidden', scrollSnapAlign: 'start', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ position: 'relative', width: '100%', height: IMG_H, flexShrink: 0, backgroundColor: 'var(--ev-card-bg2)' }}>
          {((c as any).page_settings?.cover_image ?? (c as any).banner_url ?? c.portfolio_images?.[0]) ? (
            <Image src={(c as any).page_settings?.cover_image ?? (c as any).banner_url ?? c.portfolio_images[0]} alt={c.full_name || ''} fill sizes={`${CARD_W}px`} style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${colors.violet.primary}18 0%, ${colors.violet.primary}08 100%)` }}>
              {c.avatar_url ? (
                <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${colors.violet.primary}30`, flexShrink: 0, position: 'relative' }}>
                  <Image src={c.avatar_url} alt={c.full_name || ''} fill sizes="72px" style={{ objectFit: 'cover' }} />
                </div>
              ) : (
                <span style={{ fontSize: 34, fontWeight: 800, color: colors.violet.primary, opacity: 0.7 }}>{c.full_name?.slice(0, 2).toUpperCase() || '?'}</span>
              )}
            </div>
          )}
          {c.siret_verified && (
            <span style={{ position: 'absolute', top: 7, left: 7 }}><VerifiedBadge size={18} /></span>
          )}
          {(c as any).profile_boosted_until && new Date((c as any).profile_boosted_until) > new Date() && (
            <span style={{ position: 'absolute', top: 7, right: 7, backgroundColor: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>Boosté</span>
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
          {c.city && <span style={{ fontSize: 10, color: 'var(--ev-card-date)', display: 'flex', alignItems: 'center', gap: 2 }}><MapPin size={8} style={{ flexShrink: 0 }} />{c.city}</span>}
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

    return (
      <>
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        `}</style>

        <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>

          {/* Fixed header */}
          <div style={{ position: 'fixed', top: 58, left: 0, right: 0, zIndex: 10, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--ev-border)' }}>
            <div style={{ padding: '10px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--ev-sort-active)', letterSpacing: -0.5 }}>Créateurs</h1>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ev-chip-text)', backgroundColor: 'var(--ev-chip-bg)', borderRadius: 20, padding: '2px 10px' }}>{mobileFiltered.length} résultats</span>
            </div>
            <div style={{ padding: '6px 16px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-secondary)', borderRadius: 14, padding: '8px 14px', border: '1.5px solid var(--border-color)' }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth={2.5}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input type="text" placeholder="Nom, discipline, ville…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', backgroundColor: 'transparent', caretColor: colors.violet.primary }} />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth={2.5}><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }} className="hide-scrollbar">
              <div style={{ display: 'flex', gap: 7, paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
                {discFilters.map(f => (
                  <button key={f.key} onClick={() => setMobileDisc(f.key)} style={{ flexShrink: 0, padding: '4px 13px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.15s, color 0.15s', background: mobileDisc === f.key ? `linear-gradient(135deg, ${colors.violet.primary}, ${colors.violet.hover})` : 'transparent', color: mobileDisc === f.key ? colors.text.white : 'var(--ev-chip-text)', border: mobileDisc === f.key ? 'none' : '1px solid var(--ev-border)', boxShadow: mobileDisc === f.key ? `0 2px 10px ${colors.violet.ring}` : 'none' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '0 16px 10px' }}>
              <div style={{ display: 'inline-flex', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--ev-border)' }}>
                {([['alpha', 'A → Z'], ['newest', 'Récents'], ['rating', 'Note'], ['popular', 'Pop.']] as const).map(([key, label], i) => (
                  <button key={key} onClick={() => setSortOrder(key)} style={{ padding: '5px 12px', border: 'none', borderLeft: i > 0 ? '1px solid var(--ev-border)' : 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, backgroundColor: sortOrder === key ? 'var(--ev-sort-active)' : 'transparent', color: sortOrder === key ? 'var(--bg-primary)' : 'var(--ev-chip-text)', transition: 'background 0.15s, color 0.15s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: 192 }} />

          {featCreators.length > 0 && <FeaturedCarousel items={featCreators} />}

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

          {verifiedSection.length > 0 && <MSection title="Créateurs vérifiés" items={verifiedSection} />}
          {newestSection.length > 0 && <MSection title="Nouveaux arrivants" items={newestSection} />}
          {availableSection.length > 0 && <MSection title="Disponibles maintenant" items={availableSection} />}
          {collabSection.length > 0 && <MSection title="Ouverts aux collabs" items={collabSection} />}
          {discSections.map(s => <MSection key={s.title} title={s.title} items={s.items} />)}

          {mobileFiltered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Search size={36} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--ev-card-date)', opacity: 0.5 }} />
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
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        .cr-card { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
        .cr-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(99,102,241,0.13); border-color: ${colors.violet.primary} !important; }
        .cr-card:hover .cr-img { transform: scale(1.05); }
        .cr-img { transition: transform 500ms ease; }
        .cr-chip { transition: background 120ms, color 120ms; cursor: pointer; }
        .cr-chip:hover { background: ${colors.violet.primary}18 !important; color: ${colors.violet.primary} !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', padding: '48px 48px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.violet.primary, margin: '0 0 12px' }}>Communauté</p>
              <h1 style={{ fontSize: 52, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 10px' }}>Créateurs</h1>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>Des talents partout en France</p>
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              {[
                { val: creators.length,         label: 'créateurs'   },
                { val: uniqueCities.length,      label: 'villes'      },
                { val: uniqueDisciplines.length, label: 'disciplines' },
                ...(verifiedCount > 0 ? [{ val: verifiedCount, label: 'vérifiés' }] : []),
              ].map(({ val, label }) => (
                <div key={label} style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.05em', lineHeight: 1 }}>{val}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 560 }} ref={searchContainerRef}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: colors.text.secondary, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Nom, discipline, ville…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowSuggestions(true) }}
              onFocus={e => { e.currentTarget.style.borderColor = colors.violet.primary; if (searchTerm.length >= 2) setShowSuggestions(true) }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
              onKeyDown={e => {
                if (!showSuggestions || !suggestions.length) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1)) }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestion(i => Math.max(i - 1, -1)) }
                else if (e.key === 'Enter' && activeSuggestion >= 0) { e.preventDefault(); setSearchTerm(suggestions[activeSuggestion].value); setShowSuggestions(false); setActiveSuggestion(-1) }
              }}
              style={{ width: '100%', paddingLeft: 44, paddingRight: searchTerm ? 44 : 18, paddingTop: 14, paddingBottom: 14, borderRadius: 14, border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 150ms' }}
            />
            {searchTerm && (
              <button onClick={() => { setSearchTerm(''); setShowSuggestions(false) }} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: colors.text.secondary, display: 'flex' }}>
                <X size={15} />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }}>
                {(() => {
                  let gIdx = -1
                  const labels: Record<string, string> = { creator: 'Créateurs', discipline: 'Disciplines', city: 'Villes' }
                  return (['creator', 'discipline', 'city'] as const).map(type => {
                    const group = suggestions.filter(s => s.type === type)
                    if (!group.length) return null
                    return (
                      <div key={type}>
                        <p style={{ padding: '10px 16px 4px', fontSize: 10, fontWeight: 700, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{labels[type]}</p>
                        {group.map(s => {
                          gIdx++
                          const idx = gIdx
                          const isActive = activeSuggestion === idx
                          return (
                            <button key={s.value} onMouseDown={() => { setSearchTerm(s.value); setShowSuggestions(false); setActiveSuggestion(-1) }}
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 13, color: isActive ? colors.violet.primary : 'var(--text-primary)', backgroundColor: isActive ? `${colors.violet.primary}10` : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
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
        </div>
      </div>

      {/* ── Body: sidebar + grid ── */}
      <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', alignItems: 'flex-start', padding: '0 0 100px' }}>

        {/* Sidebar */}
        <aside style={{ width: 248, flexShrink: 0, padding: '36px 0 36px 48px', position: 'sticky', top: 64, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.04em', lineHeight: 1 }}>{filtered.length}</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>résultat{filtered.length !== 1 ? 's' : ''}</p>
          </div>

          {uniqueDisciplines.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Discipline</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[{ key: 'all', label: 'Toutes' }, ...uniqueDisciplines.map(d => ({ key: d, label: d }))].map(({ key, label }) => (
                  <button key={key} onClick={() => setDisciplineFilter(key)} className="cr-chip"
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: disciplineFilter === key ? 700 : 500, backgroundColor: disciplineFilter === key ? `${colors.violet.primary}14` : 'transparent', color: disciplineFilter === key ? colors.violet.primary : 'var(--text-primary)', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '20px 0' }} />

          {uniqueCities.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Ville</p>
              <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${cityFilter !== 'all' ? colors.violet.primary : 'var(--border-color)'}`, backgroundColor: cityFilter !== 'all' ? `${colors.violet.primary}08` : 'var(--bg-secondary)', color: cityFilter !== 'all' ? colors.violet.primary : 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                <option value="all">Toutes les villes</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Trier par</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {([['alpha', 'A → Z'], ['newest', 'Récents'], ['rating', 'Note'], ['popular', 'Popularité']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setSortOrder(key)} className="cr-chip"
                  style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: sortOrder === key ? 700 : 500, backgroundColor: sortOrder === key ? `${colors.violet.primary}14` : 'transparent', color: sortOrder === key ? colors.violet.primary : 'var(--text-primary)', fontFamily: 'inherit' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '20px 0' }} />

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 12px' }}>Disponibilité</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setAvailableOnly(v => !v)} style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: availableOnly ? colors.green.primary : 'var(--border-color)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: availableOnly ? 16 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: availableOnly ? 600 : 400, color: availableOnly ? colors.green.primary : 'var(--text-secondary)' }}>Disponible</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div onClick={() => setOpenToCollab(v => !v)} style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: openToCollab ? colors.violet.primary : 'var(--border-color)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: openToCollab ? 16 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: openToCollab ? 600 : 400, color: openToCollab ? colors.violet.primary : 'var(--text-secondary)' }}>Open collabs</span>
              </label>
            </div>
          </div>

          <button onClick={userCoords ? () => { setUserCoords(null); setGeoError(null) } : handleGeolocate} disabled={geoLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${userCoords ? colors.violet.primary : 'var(--border-color)'}`, backgroundColor: userCoords ? `${colors.violet.primary}10` : 'transparent', color: userCoords ? colors.violet.primary : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 150ms' }}>
            <Navigation size={13} />
            {geoLoading ? 'Localisation…' : userCoords ? 'Autour de moi (actif)' : 'Autour de moi'}
          </button>
          {geoError && <p style={{ fontSize: 11, color: colors.feedback.danger.solid, margin: '6px 0 0' }}>{geoError}</p>}

          {hasActiveFilters && (
            <button onClick={resetFilters} style={{ marginTop: 20, fontSize: 12, fontWeight: 600, color: colors.feedback.danger.solid, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              Effacer les filtres
            </button>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '32px 48px 0 32px', minWidth: 0 }}>

          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
              {searchTerm && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 12px', borderRadius: 20, backgroundColor: `${colors.violet.primary}12`, color: colors.violet.primary, fontSize: 12, fontWeight: 600 }}>"{searchTerm}" <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
              {cityFilter !== 'all' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 12px', borderRadius: 20, backgroundColor: `${colors.violet.primary}12`, color: colors.violet.primary, fontSize: 12, fontWeight: 600 }}>{cityFilter} <button onClick={() => setCityFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
              {disciplineFilter !== 'all' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 12px', borderRadius: 20, backgroundColor: `${colors.violet.primary}12`, color: colors.violet.primary, fontSize: 12, fontWeight: 600 }}>{disciplineFilter} <button onClick={() => setDisciplineFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
              {availableOnly && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 12px', borderRadius: 20, backgroundColor: `${colors.green.primary}18`, color: colors.green.primary, fontSize: 12, fontWeight: 600 }}>Disponible <button onClick={() => setAvailableOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
              {openToCollab && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 12px', borderRadius: 20, backgroundColor: `${colors.violet.primary}12`, color: colors.violet.primary, fontSize: 12, fontWeight: 600 }}>Open collab <button onClick={() => setOpenToCollab(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
            </div>
          )}

          {visible.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {visible.map((creator, idx) => (
                  <FadeUp key={creator.id} delay={Math.min(idx * 0.04, 0.24)}>
                    <Link href={`/creators/${creator.id}`} className="cr-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>

                      {/* Image 180px */}
                      <div style={{ position: 'relative', width: '100%', height: 180, flexShrink: 0, backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        {((creator as any).page_settings?.cover_image ?? (creator as any).banner_url ?? creator.portfolio_images?.[0]) ? (
                          <Image src={(creator as any).page_settings?.cover_image ?? (creator as any).banner_url ?? creator.portfolio_images[0]} alt={creator.full_name || ''} fill className="cr-img" style={{ objectFit: 'cover' }} sizes="360px" />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${colors.violet.primary}10 0%, ${colors.violet.primary}04 100%)` }}>
                            {creator.avatar_url ? (
                              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${colors.violet.primary}30`, position: 'relative' }}>
                                <Image src={creator.avatar_url} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <span style={{ fontSize: 36, fontWeight: 800, color: colors.violet.primary, opacity: 0.7 }}>{creator.full_name?.slice(0, 2).toUpperCase() || '?'}</span>
                            )}
                          </div>
                        )}
                        {/* badges */}
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                          {(creator as any).profile_boosted_until && new Date((creator as any).profile_boosted_until) > new Date() && (
                            <span style={{ padding: '2px 7px', borderRadius: 20, backgroundColor: colors.violet.primary, color: '#fff', fontSize: 10, fontWeight: 700 }}>Boosté</span>
                          )}
                          {creator.siret_verified && <VerifiedBadge size={18} />}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {creator.avatar_url && (
                            <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--border-color)', position: 'relative' }}>
                              <Image src={creator.avatar_url} alt="" fill sizes="36px" style={{ objectFit: 'cover' }} />
                            </div>
                          )}
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{creator.full_name}</p>
                        </div>
                        {creator.disciplines?.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {creator.disciplines.slice(0, 2).map((d: string) => (
                              <span key={d} style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{d}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {creator.city ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                              <MapPin size={10} /> {creator.city}
                            </span>
                          ) : <span />}
                          <span style={{ fontSize: 12, fontWeight: 700, color: colors.violet.primary, display: 'flex', alignItems: 'center', gap: 3 }}>Voir le profil <ArrowRight size={11} /></span>
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
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <Search size={40} style={{ margin: '0 auto 16px', display: 'block', color: 'var(--border-color)' }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {hasActiveFilters ? 'Aucun résultat' : 'Aucun créateur inscrit'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
                {hasActiveFilters ? 'Essayez de modifier vos filtres.' : 'Les premiers créateurs arrivent bientôt.'}
              </p>
              {hasActiveFilters
                ? <button onClick={resetFilters} style={{ padding: '10px 24px', borderRadius: 12, border: `1.5px solid ${colors.violet.primary}`, backgroundColor: 'transparent', color: colors.violet.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Réinitialiser</button>
                : <Link href="/register" style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 12, backgroundColor: colors.violet.primary, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Rejoindre en tant que créateur</Link>
              }
            </div>
          )}
        </main>
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
