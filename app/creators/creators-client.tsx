'use client'

import { useCreators } from '@/lib/hooks'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Search, X, ArrowUpAZ, Clock, Palette, Sparkles, BadgeCheck, Star, TrendingUp, Navigation, Zap } from 'lucide-react'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ITEMS_PER_PAGE = 12

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  return (
    <motion.div ref={ref} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

function WordReveal({ children, delay = 0 }: { children: string; delay?: number }) {
  return (
    <span>
      {children.split(' ').map((w, i) => (
        <motion.span key={i} style={{ display: 'inline-block', marginRight: '0.22em' }}
          initial={{ opacity: 0, y: '110%' }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.58, delay: delay + i * 0.075, ease: [0.22, 1, 0.36, 1] }}>
          {w}
        </motion.span>
      ))}
    </span>
  )
}

function Skeleton() {
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`@keyframes creators-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      <div style={{ height: '192px', backgroundColor: '#06060f', animation: 'creators-pulse 1.5s ease-in-out infinite' }} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px 80px' }}>
        <div style={{ height: '48px', backgroundColor: '#F3F4F6', borderRadius: '16px', marginBottom: '16px', animation: 'creators-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: '80px', backgroundColor: '#F3F4F6', borderRadius: '16px', marginBottom: '32px', animation: 'creators-pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ borderRadius: '16px', border: '1px solid #F3F4F6', overflow: 'hidden', animation: `creators-pulse 1.5s ease-in-out ${i * 60}ms infinite` }}>
              <div style={{ aspectRatio: '1', backgroundColor: '#F3F4F6' }} />
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ height: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
                <div style={{ height: '12px', width: '66%', backgroundColor: '#F3F4F6', borderRadius: '8px' }} />
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

  const [searchTerm,       setSearchTerm]       = useState(searchParams.get('q') || '')
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
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const q = searchParams.get('q'); if (q) setSearchTerm(q)
    const city = searchParams.get('city'); if (city) setCityFilter(city)
    const disc = searchParams.get('disc'); if (disc) setDisciplineFilter(disc)
    if (searchParams.get('available') === '1') setAvailableOnly(true)
    if (searchParams.get('collab') === '1') setOpenToCollab(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, disciplineFilter, sortOrder, availableOnly, openToCollab])
  useEffect(() => { setActiveSuggestion(-1) }, [searchTerm, showSuggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowSuggestions(false) }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEscape) }
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      const [{ data: reviews }, { data: follows }] = await Promise.all([
        supabase.from('reviews').select('reviewed_id, rating'),
        supabase.from('creator_followers').select('creator_id'),
      ])
      const rm: Record<string, { sum: number; count: number }> = {}
      ;(reviews ?? []).forEach(r => {
        if (!rm[r.reviewed_id]) rm[r.reviewed_id] = { sum: 0, count: 0 }
        rm[r.reviewed_id].sum += r.rating; rm[r.reviewed_id].count++
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

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const creatorsWithDist = userCoords
    ? creators.map(c => ({ ...c, _dist: (c.lat && c.lng) ? haversine(userCoords.lat, userCoords.lng, c.lat, c.lng) : Infinity }))
    : creators.map(c => ({ ...c, _dist: Infinity }))

  const filtered = creatorsWithDist
    .filter((c) => !searchTerm || c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.bio?.toLowerCase().includes(searchTerm.toLowerCase()) || c.city?.toLowerCase().includes(searchTerm.toLowerCase()) || (c.disciplines || []).some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())))
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
    setGeoLoading(true); setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSortOrder('alpha'); setGeoLoading(false) },
      () => { setGeoError('Localisation refusée'); setGeoLoading(false) }
    )
  }

  if (loading) return <Skeleton />

  if (error) return (
    <div style={{ maxWidth: '512px', margin: '0 auto', padding: '128px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</p>
      <p style={{ color: '#EF4444' }}>Une erreur est survenue.</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`
        @keyframes creators-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .creators-grid { display: grid; gap: 24px; grid-template-columns: 1fr }
        @media (min-width: 640px) { .creators-grid { grid-template-columns: repeat(2, 1fr) } }
        @media (min-width: 1024px) { .creators-grid { grid-template-columns: repeat(3, 1fr) } }
        @media (min-width: 1280px) { .creators-grid { grid-template-columns: repeat(4, 1fr) } }
        .creators-card { display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; background: #fff; border: 1px solid #F3F4F6; transition: all 0.2s; height: 100%; text-decoration: none; }
        .creators-card:hover { border-color: #D1D5DB; box-shadow: 0 10px 25px rgba(0,0,0,0.08); transform: translateY(-4px) }
        .creators-card:hover .creators-card-img { transform: scale(1.05) }
        .creators-card:hover .creators-card-overlay { opacity: 1 }
        .creators-card:hover .creators-card-disc-pills { transform: translateY(0); opacity: 1 }
        .creators-card:hover .creators-card-title { color: #4F46E5 }
        .creators-card:hover .creators-card-cta { gap: 8px }
        .creators-card-img { transition: transform 0.7s; object-fit: cover; width: 100%; height: 100% }
        .creators-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1), transparent); opacity: 0; transition: opacity 0.3s }
        .creators-card-disc-pills { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px; transform: translateY(8px); opacity: 0; transition: all 0.3s }
        .creators-card-title { font-size: 14px; font-weight: 600; color: #111827; line-height: 1.4; margin-bottom: 6px; transition: color 0.15s }
        .creators-card-cta { display: flex; align-items: center; gap: 4px; color: #4F46E5; font-size: 12px; font-weight: 600; transition: gap 0.15s }
        .creators-sort-btn { flex: 1; padding: 8px 16px; font-size: 14px; font-weight: 500; background: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background-color 0.15s; color: #4B5563 }
        .creators-sort-btn:hover { background: #F9FAFB }
        .creators-sort-btn.active { background: #4F46E5; color: #fff }
        .creators-filter-select { padding: 8px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid #E5E7EB; background: #fff; color: #374151; outline: none; transition: all 0.15s }
        .creators-filter-select.active { border-color: #A5B4FC; background: #EEF2FF; color: #4338CA }
        .creators-geo-btn { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; border: 1px solid #E5E7EB; background: #fff; font-size: 14px; font-weight: 500; cursor: pointer; color: #374151; transition: all 0.15s }
        .creators-geo-btn:hover { border-color: #A5B4FC; color: #4338CA; background: #EEF2FF }
        .creators-geo-btn.active { border-color: #A5B4FC; color: #4338CA; background: #EEF2FF }
        .creators-geo-btn.active:hover { border-color: #FECACA; color: #DC2626; background: #FEF2F2 }
        .creators-tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 600 }
        .creators-tag button { display: flex; align-items: center; background: none; border: none; cursor: pointer; padding: 0; color: inherit }
        .creators-search-input { width: 100%; padding: 14px 40px 14px 44px; border-radius: 16px; border: 1px solid #E5E7EB; background: #fff; color: #111827; font-size: 14px; outline: none; box-shadow: 0 1px 3px rgba(0,0,0,0.05); box-sizing: border-box; transition: all 0.15s }
        .creators-search-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) }
        .creators-load-more { padding: 12px 32px; border-radius: 12px; border: 2px solid #4F46E5; color: #4F46E5; font-weight: 600; font-size: 14px; background: none; cursor: pointer; transition: all 0.2s }
        .creators-load-more:hover { background: #4F46E5; color: #fff }
      `}</style>

      {/* Hero */}
      <div style={{ backgroundColor: '#06060f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.10, backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: '-128px', right: '-128px', width: '384px', height: '384px', borderRadius: '9999px', backgroundColor: 'rgba(124,58,237,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: 0, width: '320px', height: '320px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px 64px', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Sparkles size={13} color="#A78BFA" />
              <span style={{ color: '#818CF8', fontSize: '12px', fontWeight: 600 }}>Communauté</span>
            </div>
          </motion.div>

          <div style={{ overflow: 'hidden', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              <WordReveal delay={0.05}>Créateurs & Artisans</WordReveal>
            </h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', marginBottom: '40px' }}>
            Des talents partout en France — trouvez le créateur idéal pour votre événement
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { value: creators.length, label: 'créateurs' },
              { value: uniqueCities.length, label: 'villes' },
              { value: uniqueDisciplines.length, label: 'disciplines' },
              ...(verifiedCount > 0 ? [{ value: verifiedCount, label: 'vérifiés' }] : []),
            ].map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{value}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px 96px' }}>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }} ref={searchContainerRef}>
          <Search size={17} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Nom, discipline, ville…"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true) }}
            onFocus={() => { if (searchTerm.length >= 2) setShowSuggestions(true) }}
            onKeyDown={(e) => {
              if (!showSuggestions || !suggestions.length) return
              if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestion(i => Math.min(i + 1, suggestions.length - 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestion(i => Math.max(i - 1, -1)) }
              else if (e.key === 'Enter' && activeSuggestion >= 0) { e.preventDefault(); setSearchTerm(suggestions[activeSuggestion].value); setShowSuggestions(false); setActiveSuggestion(-1) }
            }}
            className="creators-search-input"
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setShowSuggestions(false) }} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden' }} role="listbox">
              {(() => {
                let globalIdx = -1
                const labels: Record<string, string> = { creator: 'Créateurs', discipline: 'Disciplines', city: 'Villes' }
                return (['creator', 'discipline', 'city'] as const).map(type => {
                  const group = suggestions.filter(s => s.type === type)
                  if (!group.length) return null
                  return (
                    <div key={type}>
                      <p style={{ padding: '12px 16px 4px', fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{labels[type]}</p>
                      {group.map(s => {
                        globalIdx++
                        const idx = globalIdx
                        const isActive = activeSuggestion === idx
                        return (
                          <button key={s.value} role="option" aria-selected={isActive}
                            onMouseDown={() => { setSearchTerm(s.value); setShowSuggestions(false); setActiveSuggestion(-1) }}
                            style={{ width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: '14px', color: isActive ? '#4338CA' : '#374151', backgroundColor: isActive ? '#EEF2FF' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.1s' }}>
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
        <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px 20px', alignItems: 'flex-end' }}>
            {uniqueCities.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px' }}>Ville</p>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                  className={`creators-filter-select${cityFilter !== 'all' ? ' active' : ''}`}>
                  <option value="all">Toutes les villes</option>
                  {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {uniqueDisciplines.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px' }}>Discipline</p>
                <select value={disciplineFilter} onChange={(e) => setDisciplineFilter(e.target.value)}
                  className={`creators-filter-select${disciplineFilter !== 'all' ? ' active' : ''}`}>
                  <option value="all">Toutes les disciplines</option>
                  {uniqueDisciplines.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px' }}>Trier par</p>
              <div style={{ display: 'flex', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', backgroundColor: '#fff' }}>
                {([['alpha', <ArrowUpAZ key="a" size={13} />, 'A → Z'], ['newest', <Clock key="c" size={13} />, 'Récents'], ['rating', <Star key="r" size={13} />, 'Note'], ['popular', <TrendingUp key="p" size={13} />, 'Popularité']] as const).map(([key, icon, label], i) => (
                  <button key={key} onClick={() => setSortOrder(key)}
                    className={`creators-sort-btn${sortOrder === key ? ' active' : ''}`}
                    style={{ borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none' }}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px' }}>Disponibilité</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div onClick={() => setAvailableOnly(v => !v)} style={{ width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer', backgroundColor: availableOnly ? '#10b981' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: availableOnly ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: availableOnly ? '#065f46' : '#4b5563', fontWeight: availableOnly ? 600 : 400 }}>Disponible pour événements</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <div onClick={() => setOpenToCollab(v => !v)} style={{ width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer', backgroundColor: openToCollab ? '#6366f1' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: openToCollab ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: openToCollab ? '#3730a3' : '#4b5563', fontWeight: openToCollab ? 600 : 400 }}>Ouvert aux collaborations</span>
                </label>
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px' }}>Proximité</p>
              <button onClick={userCoords ? () => { setUserCoords(null); setGeoError(null) } : handleGeolocate} disabled={geoLoading}
                className={`creators-geo-btn${userCoords ? ' active' : ''}`} style={{ opacity: geoLoading ? 0.5 : 1 }}>
                <Navigation size={14} />
                {geoLoading ? 'Localisation…' : userCoords ? 'Autour de moi ✓' : 'Autour de moi'}
              </button>
              {geoError && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px' }}>{geoError}</p>}
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>Actifs :</span>
              {searchTerm && <span className="creators-tag">"{searchTerm}" <button onClick={() => setSearchTerm('')}><X size={11} /></button></span>}
              {cityFilter !== 'all' && <span className="creators-tag">{cityFilter} <button onClick={() => setCityFilter('all')}><X size={11} /></button></span>}
              {disciplineFilter !== 'all' && <span className="creators-tag">{disciplineFilter} <button onClick={() => setDisciplineFilter('all')}><X size={11} /></button></span>}
              {sortOrder !== 'alpha' && <span className="creators-tag">{sortLabels[sortOrder]} <button onClick={() => setSortOrder('alpha')}><X size={11} /></button></span>}
              {availableOnly && <span style={{ ...{}, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: 600 }}>Disponible <button onClick={() => setAvailableOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
              {openToCollab && <span className="creators-tag">Open collab <button onClick={() => setOpenToCollab(false)}><X size={11} /></button></span>}
              <button onClick={resetFilters} style={{ fontSize: '12px', color: '#F87171', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#F87171'}>Tout effacer</button>
              <div style={{ marginLeft: 'auto' }}>
                <button onClick={shareFilters} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '20px', border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#6b7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                  🔗 Partager ces filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Palette size={15} color="#9CA3AF" />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>{filtered.length}</span> créateur{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span style={{ color: '#9CA3AF' }}> · filtré{filtered.length !== 1 ? 's' : ''}</span>}
          </span>
        </div>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div className="creators-grid">
              {visible.map((creator, idx) => (
                <FadeUp key={creator.id} delay={Math.min(idx * 0.04, 0.3)}>
                  <Link href={`/creators/${creator.id}`} className="creators-card">
                    {/* Media header */}
                    <div style={{ position: 'relative', flexShrink: 0, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
                      {creator.portfolio_images?.length >= 2 ? (
                        <div style={{ display: 'flex', height: '192px', gap: '1px' }}>
                          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <Image src={creator.portfolio_images[0]} alt={`Portfolio de ${creator.full_name}`} fill className="creators-card-img" />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', width: '38%' }}>
                            <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                              <Image src={creator.portfolio_images[1]} alt={`Portfolio de ${creator.full_name}`} fill className="creators-card-img" />
                            </div>
                            {creator.portfolio_images[2] ? (
                              <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                                <Image src={creator.portfolio_images[2]} alt={`Portfolio de ${creator.full_name}`} fill className="creators-card-img" />
                                {creator.portfolio_images.length > 3 && (
                                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>+{creator.portfolio_images.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : creator.portfolio_images?.length === 1 ? (
                        <div style={{ position: 'relative', aspectRatio: '1' }}>
                          <Image src={creator.portfolio_images[0]} alt={creator.full_name} fill className="creators-card-img" />
                        </div>
                      ) : creator.avatar_url ? (
                        <div style={{ position: 'relative', aspectRatio: '1' }}>
                          <Image src={creator.avatar_url} alt={creator.full_name} fill className="creators-card-img" />
                        </div>
                      ) : (
                        <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)' }}>
                          <span style={{ fontSize: '48px', fontWeight: 700, color: '#6366F1', opacity: 0.85, userSelect: 'none' }}>
                            {creator.full_name?.slice(0, 2).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}

                      <div className="creators-card-overlay" />

                      {creator.portfolio_images?.length > 0 && creator.avatar_url && (
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '36px', height: '36px', borderRadius: '9999px', border: '2px solid #fff', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                          <Image src={creator.avatar_url} alt={creator.full_name} fill style={{ objectFit: 'cover' }} />
                        </div>
                      )}

                      {creator.disciplines?.length > 0 && (
                        <div className="creators-card-disc-pills"
                          style={{ paddingLeft: creator.portfolio_images?.length > 0 && creator.avatar_url ? '56px' : '12px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {creator.disciplines.slice(0, 3).map((d: string) => (
                              <span key={d} style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                                {d}
                              </span>
                            ))}
                            {creator.disciplines.length > 3 && (
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                                +{creator.disciplines.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        {(creator as any).profile_boosted_until && new Date((creator as any).profile_boosted_until) > new Date() && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#4F46E5', border: '1px solid #6366F1', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                            <Zap size={9} color="#fff" fill="#fff" />
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Boosté</span>
                          </div>
                        )}
                        {creator.siret_verified && creator.insurance_verified && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #C7D2FE' }}>
                            <BadgeCheck size={10} color="#4F46E5" />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#4F46E5' }}>Vérifié</span>
                          </div>
                        )}
                        {creator.created_at && Date.now() - new Date(creator.created_at).getTime() < 30 * 24 * 3600 * 1000 && (
                          <div style={{ display: 'flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(251,191,36,0.9)', border: '1px solid #FCD34D' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Nouveau</span>
                          </div>
                        )}
                        {(creator as { is_active?: boolean }).is_active && (
                          <div style={{ display: 'flex', alignItems: 'center', padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#16A34A' }}>● Actif</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px' }}>
                      <h3 className="creators-card-title">{creator.full_name}</h3>

                      {creator.disciplines?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {creator.disciplines.slice(0, 2).map((d: string) => (
                            <span key={d} style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#F3F4F6', color: '#4B5563' }}>{d}</span>
                          ))}
                          {creator.disciplines.length > 2 && (
                            <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>+{creator.disciplines.length - 2}</span>
                          )}
                        </div>
                      )}

                      {creator.bio && (
                        <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '12px', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{creator.bio}</p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #FAFAFA' }}>
                        <span className="creators-card-cta">
                          Voir le profil <ArrowRight size={12} />
                        </span>
                        {creator.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#9CA3AF', fontSize: '12px' }}>
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

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '64px' }}>
                <div style={{ maxWidth: '200px', margin: '0 auto 16px' }}>
                  <div style={{ height: '4px', backgroundColor: '#F3F4F6', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                    <motion.div style={{ height: '100%', backgroundColor: '#6366F1', borderRadius: '9999px' }}
                      initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{Math.min(visibleCount, filtered.length)} / {filtered.length} créateurs</p>
                </div>
                <button onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)} className="creators-load-more">
                  Voir {Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus
                </button>
              </div>
            )}
            {!hasMore && filtered.length > ITEMS_PER_PAGE && (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#9CA3AF', marginTop: '48px' }}>Tous les {filtered.length} créateurs sont affichés</p>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '96px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '20px' }}>{hasActiveFilters ? '🔍' : '🎨'}</p>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun créateur inscrit pour le moment'}
            </h3>
            <p style={{ color: '#9CA3AF', maxWidth: '384px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              {hasActiveFilters ? "Aucun créateur ne correspond à vos critères." : 'Les premiers artisans arrivent bientôt.'}
            </p>
            {hasActiveFilters
              ? <button onClick={resetFilters} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #C7D2FE', color: '#4F46E5', fontSize: '14px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}>Réinitialiser</button>
              : <Link href="/register" style={{ padding: '12px 28px', borderRadius: '12px', backgroundColor: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>Rejoindre en tant que créateur</Link>
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
