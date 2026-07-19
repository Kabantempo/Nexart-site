'use client'

import { useCreators } from '@/lib/hooks'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Search, X, ArrowUpAZ, Clock, Palette, Sparkles, BadgeCheck, Star, TrendingUp, Navigation, Zap } from 'lucide-react'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    <div className="bg-white min-h-screen">
      <div className="h-48 bg-[#06060f] animate-pulse" />
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
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { const q = searchParams.get('q'); if (q) setSearchTerm(q) }, [searchParams])
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, disciplineFilter, sortOrder])

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
  const hasActiveFilters = cityFilter !== 'all' || disciplineFilter !== 'all' || sortOrder !== 'alpha' || !!searchTerm
  const sortLabels: Record<string, string> = { alpha: 'A → Z', newest: 'Récents', rating: 'Note', popular: 'Popularité' }
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100
  const verifiedCount = creators.filter(c => c.siret_verified).length

  const resetFilters = () => { setCityFilter('all'); setDisciplineFilter('all'); setSortOrder('alpha'); setSearchTerm(''); setUserCoords(null); setGeoError(null) }

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

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="bg-[#06060f] relative overflow-hidden">
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
              <WordReveal delay={0.05}>Créateurs & Artisans</WordReveal>
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
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => { setSearchTerm(''); setShowSuggestions(false) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {(['creator', 'discipline', 'city'] as const).map(type => {
                const group = suggestions.filter(s => s.type === type)
                if (!group.length) return null
                const labels: Record<string, string> = { creator: 'Créateurs', discipline: 'Disciplines', city: 'Villes' }
                return (
                  <div key={type}>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{labels[type]}</p>
                    {group.map(s => (
                      <button key={s.value} onMouseDown={() => { setSearchTerm(s.value); setShowSuggestions(false) }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                        {s.value}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-7">
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
              <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-600 font-semibold ml-1">Tout effacer</button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6">
          <Palette size={15} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            <span className="font-bold text-gray-900 text-base">{filtered.length}</span> créateur{filtered.length !== 1 ? 's' : ''}
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
                    className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full"
                  >
                    {/* Media header — portfolio if available, avatar fallback */}
                    <div className="relative shrink-0 overflow-hidden bg-gray-100">
                      {creator.portfolio_images?.length >= 2 ? (
                        /* Mini gallery: 1 large + column of 2 */
                        <div className="flex h-48 gap-px">
                          <div className="relative flex-1 overflow-hidden">
                            <Image src={creator.portfolio_images[0]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          </div>
                          <div className="flex flex-col gap-px w-[38%]">
                            <div className="relative flex-1 overflow-hidden">
                              <Image src={creator.portfolio_images[1]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                            </div>
                            {creator.portfolio_images[2] ? (
                              <div className="relative flex-1 overflow-hidden">
                                <Image src={creator.portfolio_images[2]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
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
                        <div className="aspect-square w-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)' }}>
                          <span className="text-5xl font-bold select-none" style={{ color: '#6366F1', opacity: 0.85 }}>
                            {creator.full_name?.slice(0, 2).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Avatar circle (when showing portfolio) */}
                      {creator.portfolio_images?.length > 0 && creator.avatar_url && (
                        <div className="absolute bottom-3 left-3 w-9 h-9 rounded-full border-2 border-white overflow-hidden shadow-md">
                          <Image src={creator.avatar_url} alt="" fill className="object-cover" />
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
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">{creator.full_name}</h3>

                      {creator.disciplines?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {creator.disciplines.slice(0, 2).map((d: string) => (
                            <span key={d} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{d}</span>
                          ))}
                          {creator.disciplines.length > 2 && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-400">+{creator.disciplines.length - 2}</span>
                          )}
                        </div>
                      )}

                      {creator.bio && (
                        <p className="text-xs text-gray-400 leading-relaxed mb-3 flex-1 line-clamp-2">{creator.bio}</p>
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

            {hasMore && (
              <div className="text-center mt-16">
                <div className="max-w-[200px] mx-auto mb-4">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                  </div>
                  <p className="text-xs text-gray-400">{Math.min(visibleCount, filtered.length)} / {filtered.length} créateurs</p>
                </div>
                <button onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="px-8 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-semibold text-sm hover:bg-indigo-600 hover:text-white transition-all duration-200">
                  Voir {Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus
                </button>
              </div>
            )}
            {!hasMore && filtered.length > ITEMS_PER_PAGE && (
              <p className="text-center text-sm text-gray-400 mt-12">Tous les {filtered.length} créateurs sont affichés</p>
            )}
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
