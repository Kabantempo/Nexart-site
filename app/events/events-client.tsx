'use client'

import { useEvents } from '@/lib/hooks'
import type { Event as NexartEvent } from '@/lib/types'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, Search, X, Users, SlidersHorizontal, Euro, Sparkles } from 'lucide-react'
import { ComparePanel, PinButton } from '@/components/ui/compare-panel'
import { SaveSearchButton } from '@/components/ui/save-search-button'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

const ITEMS_PER_PAGE = 12

const EVENT_TYPES = [
  { key: 'all',       label: 'Tous' },
  { key: 'popup',     label: 'Pop-up' },
  { key: 'salon',     label: 'Salon' },
  { key: 'fair',      label: 'Foire' },
  { key: 'seasonal',  label: 'Saisonnier' },
  { key: 'permanent', label: 'Permanent' },
] as const

const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent', seasonal: 'Saisonnier',
  popup: 'Pop-up', salon: 'Salon', fair: 'Foire',
}

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  popup:     { bg: 'rgba(0,0,0,0.55)', text: '#fff' },
  salon:     { bg: 'rgba(0,0,0,0.55)', text: '#fff' },
  fair:      { bg: 'rgba(0,0,0,0.55)', text: '#fff' },
  seasonal:  { bg: 'rgba(0,0,0,0.55)', text: '#fff' },
  permanent: { bg: 'rgba(0,0,0,0.55)', text: '#fff' },
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

function Skeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="h-48 bg-[#06060f] animate-pulse" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        <div className="h-12 animate-shimmer rounded-2xl mb-4" />
        <div className="h-20 animate-shimmer rounded-2xl mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="h-52 animate-shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-5 animate-shimmer rounded-lg" />
                <div className="h-4 w-3/4 animate-shimmer rounded-lg" />
                <div className="h-4 w-1/2 animate-shimmer rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EventsContent() {
  const { events, loading, error } = useEvents()
  const searchParams = useSearchParams()

  const [searchTerm,   setSearchTerm]   = useState(searchParams.get('q') || '')
  const [cityFilter,   setCityFilter]   = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [discFilter,   setDiscFilter]   = useState('all')
  const [priceMax,     setPriceMax]     = useState<number | ''>('')
  const [freeOnly,     setFreeOnly]     = useState(false)
  const [sortOrder,    setSortOrder]    = useState<'asc' | 'desc'>('asc')
  const [dateFrom,     setDateFrom]     = useState('')
  const [dateTo,       setDateTo]       = useState('')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
  const [nearMe, setNearMe] = useState(false)
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [geoRadius] = useState(50) // km

  useEffect(() => { const q = searchParams.get('q'); if (q) setSearchTerm(q) }, [searchParams])
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, typeFilter, discFilter, priceMax, freeOnly, sortOrder, dateFrom, dateTo])

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const handleNearMe = () => {
    if (nearMe) { setNearMe(false); return }
    navigator.geolocation.getCurrentPosition(pos => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setNearMe(true)
    }, () => alert('Géolocalisation non disponible'))
  }

  const uniqueCities = [...new Set(events.map((e) => e.city).filter(Boolean))].sort() as string[]
  const uniqueDiscs = [...new Set(events.flatMap((e) => (e as NexartEvent & { discipline_tags?: string[] }).discipline_tags || []).filter(Boolean))].sort()

  const filtered = events
    .filter((e) =>
      !searchTerm ||
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((e) => cityFilter === 'all' || e.city === cityFilter)
    .filter((e) => typeFilter === 'all' || e.event_type === typeFilter)
    .filter((e) => discFilter === 'all' || ((e as NexartEvent & { discipline_tags?: string[] }).discipline_tags || []).includes(discFilter))
    .filter((e) => !freeOnly || e.stand_price === 0)
    .filter((e) => priceMax === '' || (e.stand_price != null && e.stand_price <= priceMax))
    .filter((e) => !dateFrom || !e.start_date || new Date(e.start_date) >= new Date(dateFrom))
    .filter((e) => !dateTo || !e.start_date || new Date(e.start_date) <= new Date(dateTo))
    .filter((e) => !nearMe || !userPos || (e.lat && e.lng && haversine(userPos.lat, userPos.lng, e.lat, e.lng) <= geoRadius))
    .sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0
      const db = b.start_date ? new Date(b.start_date).getTime() : 0
      return sortOrder === 'asc' ? da - db : db - da
    })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const hasActiveFilters = cityFilter !== 'all' || typeFilter !== 'all' || discFilter !== 'all' || sortOrder !== 'asc' || !!searchTerm || freeOnly || priceMax !== '' || nearMe || !!dateFrom || !!dateTo
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100
  const uniqueCitiesCount = new Set(events.map(e => e.city).filter(Boolean)).size

  const resetFilters = () => { setCityFilter('all'); setTypeFilter('all'); setDiscFilter('all'); setSortOrder('asc'); setSearchTerm(''); setPriceMax(''); setFreeOnly(false); setNearMe(false); setDateFrom(''); setDateTo('') }

  if (loading) return <Skeleton />

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-red-500">Une erreur est survenue. Réessayez dans quelques instants.</p>
    </div>
  )

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="bg-[#06060f] relative overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.10]" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-violet-600/15 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-5">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-indigo-400 text-xs font-semibold">Découvrir</span>
            </div>
          </motion.div>

          <div className="overflow-hidden mb-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              <WordReveal delay={0.05}>Événements artisanaux</WordReveal>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            className="text-white/40 text-base mb-10"
          >
            Marchés, pop-ups, salons et festivals — candidatez en quelques clics
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            {[
              { value: events.length, label: 'événements' },
              { value: uniqueCitiesCount, label: 'villes' },
              { value: events.filter(e => e.stand_price === 0).length, label: 'gratuits' },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                <span className="text-white font-bold text-sm">{value}</span>
                <span className="text-white/40 text-xs">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* Search */}
        <div className="relative mb-4">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher un événement, une ville…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition shadow-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-7">
          {/* Row 1: Type */}
          <div className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 mb-3">Type d'événement</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(({ key, label }) => {
                const active = typeFilter === key
                return (
                  <button key={key} onClick={() => setTypeFilter(key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                      active ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Ville + Date + Tri */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start pt-4 border-t border-gray-100">
            {uniqueCities.length > 0 && (
              <div className="w-full sm:w-auto">
                <p className="text-[11px] font-bold text-gray-400 mb-2">Ville</p>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                  className={`w-full sm:w-auto px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer focus:outline-none transition ${
                    cityFilter !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                  <option value="all">Toutes les villes</option>
                  {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            <div className="w-full sm:w-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-2">À partir du</p>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:border-indigo-300 transition cursor-pointer ${dateFrom ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'}`} />
            </div>

            <div className="w-full sm:w-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-2">Jusqu'au</p>
              <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium focus:outline-none focus:border-indigo-300 transition cursor-pointer ${dateTo ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'}`} />
            </div>

            <div className="w-full sm:w-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-2">Trier</p>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                {(['asc', 'desc'] as const).map((o, i) => (
                  <button key={o} onClick={() => setSortOrder(o)}
                    className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition-colors ${i === 1 ? 'border-l border-gray-200' : ''} ${
                      sortOrder === o ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    {o === 'asc' ? '↑ Prochains' : '↓ Plus loin'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Discipline + Tarif + Gratuit + NearMe */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start mt-4 pt-4 border-t border-gray-100">
            {uniqueDiscs.length > 0 && (
              <div className="w-full sm:w-auto">
                <p className="text-[11px] font-bold text-gray-400 mb-2">Discipline</p>
                <select value={discFilter} onChange={e => setDiscFilter(e.target.value)}
                  className={`w-full sm:w-auto px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer focus:outline-none transition ${discFilter !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'}`}>
                  <option value="all">Toutes disciplines</option>
                  {uniqueDiscs.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div className="w-full sm:w-auto">
              <p className="text-[11px] font-bold text-gray-400 mb-2">Prix stand max (€)</p>
              <input type="number" min={0} placeholder="ex: 50" value={priceMax}
                onChange={e => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full sm:w-28 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-300" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Gratuit uniquement</span>
              </label>
            </div>
            <div className="flex items-end pb-1">
              <button onClick={handleNearMe}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${nearMe ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}>
                <MapPin size={14} /> Autour de moi ({geoRadius} km)
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap items-center">
              <span className="text-xs text-gray-400 font-medium">Actifs :</span>
              {searchTerm && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">"{searchTerm}" <button onClick={() => setSearchTerm('')}><X size={11} /></button></span>}
              {cityFilter !== 'all' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{cityFilter} <button onClick={() => setCityFilter('all')}><X size={11} /></button></span>}
              {typeFilter !== 'all' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{EVENT_TYPE_LABELS[typeFilter]} <button onClick={() => setTypeFilter('all')}><X size={11} /></button></span>}
              {discFilter !== 'all' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">{discFilter} <button onClick={() => setDiscFilter('all')}><X size={11} /></button></span>}
              {dateFrom && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">À partir du {new Date(dateFrom).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} <button onClick={() => setDateFrom('')}><X size={11} /></button></span>}
              {dateTo && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">Jusqu'au {new Date(dateTo).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} <button onClick={() => setDateTo('')}><X size={11} /></button></span>}
              {freeOnly && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">Gratuit <button onClick={() => setFreeOnly(false)}><X size={11} /></button></span>}
              {priceMax !== '' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">≤ {priceMax}€ <button onClick={() => setPriceMax('')}><X size={11} /></button></span>}
              {nearMe && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold"><MapPin size={10} /> Autour de moi <button onClick={() => setNearMe(false)}><X size={11} /></button></span>}
              <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-600 font-semibold ml-1">Tout effacer</button>
              <div className="ml-auto">
                <SaveSearchButton
                  disciplines={discFilter !== 'all' ? [discFilter] : []}
                  city={cityFilter !== 'all' ? cityFilter : undefined}
                  query={searchTerm || undefined}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal size={15} className="text-gray-400" />
          <span className="text-sm text-gray-500">
            <span className="font-bold text-gray-900 text-base">{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span className="text-gray-400"> · filtré{filtered.length !== 1 ? 's' : ''}</span>}
          </span>
        </div>

        {/* Lien carte */}
        <Link href="/carte" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all duration-150 group w-fit mb-2">
          <MapPin size={15} className="text-indigo-500 shrink-0" />
          <span className="text-sm font-600 text-indigo-700">Voir les événements sur la carte</span>
          <ArrowRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {visible.map((event, idx) => {
                // Magazine pattern: positions 0 and 4 in each group of 7 are featured (span-2)
                const posInGroup = idx % 7
                const isFeatured = posInGroup === 0 || posInGroup === 4
                // Alternate: 1st featured aligns left (default), 5th featured aligns right
                const featuredRight = posInGroup === 4
                const rem = (event as NexartEvent & { remaining_spots?: number }).remaining_spots
                const tags = (event as NexartEvent & { discipline_tags?: string[] }).discipline_tags || []

                return (
                <FadeUp key={event.id} delay={Math.min(idx * 0.04, 0.3)}
                  className={isFeatured ? 'sm:col-span-2 lg:col-span-2' : ''}
                  style={featuredRight ? { gridColumnStart: 'auto' } as React.CSSProperties : undefined}>
                  <Link href={`/events/${event.id}`}
                    className={`group flex overflow-hidden bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full ${
                      isFeatured ? 'rounded-3xl flex-row sm:flex-col' : 'flex-col rounded-2xl'
                    }`}
                  >
                    {/* Cover */}
                    <div className={`relative bg-gray-100 shrink-0 overflow-hidden ${
                      isFeatured
                        ? 'w-40 sm:w-full h-full sm:h-72 rounded-2xl sm:rounded-none'
                        : 'h-52'
                    }`}>
                      {event.cover_image ? (
                        <Image src={event.cover_image} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0f1117]">
                          <Calendar size={isFeatured ? 56 : 40} className="text-white/20" />
                        </div>
                      )}

                      {/* Gradient */}
                      <div className={`absolute inset-0 ${isFeatured ? 'bg-gradient-to-t from-black/70 via-black/20 to-transparent' : 'bg-gradient-to-t from-black/50 via-black/5 to-transparent'}`} />

                      {/* Top badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isFeatured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wide">À la une</span>
                          )}
                          {event.event_type && (() => {
                            const badge = TYPE_BADGE[event.event_type]
                            return (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md"
                                style={{ backgroundColor: badge?.bg ?? 'rgba(0,0,0,0.5)', color: badge?.text ?? '#fff' }}>
                                {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                              </span>
                            )
                          })()}
                        </div>
                        {(event.stand_count ?? 0) > 0 && (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shrink-0 ${
                            rem === 0 ? 'bg-gray-500/70 text-white'
                            : rem !== undefined && rem <= 3 ? 'bg-amber-500/80 text-white'
                            : 'bg-black/50 text-white'
                          }`}>
                            <Users size={10} />
                            {rem === 0 ? 'Complet' : rem !== undefined ? `${rem} place${rem > 1 ? 's' : ''}` : `${event.stand_count} stands`}
                          </span>
                        )}
                      </div>

                      {/* Featured: title + meta overlaid on image bottom */}
                      {isFeatured && (
                        <div className="absolute bottom-0 left-0 right-0 p-5 hidden sm:block">
                          <h3 className="font-bold text-white text-xl leading-tight mb-2 group-hover:text-indigo-200 transition-colors line-clamp-2">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-3 flex-wrap">
                            {event.start_date && (
                              <span className="flex items-center gap-1.5 text-white/70 text-xs">
                                <Calendar size={11} className="text-indigo-300" />
                                {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1.5 text-white/70 text-xs">
                                <MapPin size={11} className="text-indigo-300" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price badge */}
                      {event.stand_price != null && (
                        <div className={`absolute ${isFeatured ? 'top-3 right-3 hidden sm:block' : 'bottom-3 right-3'}`}>
                          {event.stand_price === 0
                            ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-800 backdrop-blur-sm border border-gray-200">Gratuit</span>
                            : <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/60 text-white backdrop-blur-sm flex items-center gap-0.5"><Euro size={10} />{event.stand_price}</span>
                          }
                        </div>
                      )}
                    </div>

                    {/* Body — hidden on sm for featured (title is on image), always shown on mobile */}
                    <div className={`flex flex-col flex-1 p-5 ${isFeatured ? 'sm:hidden' : ''}`}>
                      <h3 className={`font-bold text-gray-900 leading-snug mb-3 group-hover:text-indigo-700 transition-colors ${isFeatured ? 'text-lg' : 'text-base'}`}>{event.title}</h3>
                      <div className="space-y-1.5 mb-3">
                        {event.start_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size={13} className="text-indigo-400 shrink-0" />
                            {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin size={13} className="text-indigo-400 shrink-0" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-400 leading-relaxed mb-3 flex-1 line-clamp-2">{event.description}</p>
                      )}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {tags.slice(0, 2).map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">{t}</span>
                          ))}
                          {tags.length > 2 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">+{tags.length - 2}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:gap-3 transition-all duration-200">
                          Voir l'événement <ArrowRight size={14} />
                        </span>
                        <PinButton event={{ id: event.id, title: event.title, start_date: event.start_date, city: event.city, stand_price: event.stand_price, stand_count: event.stand_count, discipline_tags: tags, cover_image: event.cover_image }} />
                      </div>
                    </div>

                    {/* Featured sm+ footer: tags + CTA below image */}
                    {isFeatured && (
                      <div className="hidden sm:flex items-center justify-between px-5 py-3 border-t border-gray-50">
                        <div className="flex flex-wrap gap-1.5">
                          {tags.slice(0, 3).map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-semibold">{t}</span>
                          ))}
                          {tags.length > 3 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold">+{tags.length - 3}</span>}
                        </div>
                        <span className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all duration-200 shrink-0 ml-3">
                          Voir <ArrowRight size={13} />
                        </span>
                      </div>
                    )}
                  </Link>
                </FadeUp>
              )})}
            </div>

            {hasMore && (
              <div className="text-center mt-16">
                <div className="max-w-[200px] mx-auto mb-4">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                  </div>
                  <p className="text-xs text-gray-400">{Math.min(visibleCount, filtered.length)} / {filtered.length} événements</p>
                </div>
                <button onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="px-8 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-semibold text-sm hover:bg-indigo-600 hover:text-white transition-all duration-200">
                  Voir {Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus
                </button>
              </div>
            )}
            {!hasMore && filtered.length > ITEMS_PER_PAGE && (
              <p className="text-center text-sm text-gray-400 mt-12">Tous les {filtered.length} résultats sont affichés</p>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <p className="text-5xl mb-5">{hasActiveFilters ? '🔍' : '📅'}</p>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{hasActiveFilters ? 'Aucun résultat' : 'Aucun événement pour le moment'}</h3>
            <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
              {hasActiveFilters ? "Aucun événement ne correspond à vos critères." : 'Les premiers événements arrivent bientôt.'}
            </p>
            {hasActiveFilters
              ? <button onClick={resetFilters} className="px-6 py-2.5 rounded-xl border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors">Réinitialiser</button>
              : <Link href="/register" className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors">Créer un compte</Link>
            }
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function EventsClient() {
  return (
    <>
      <Suspense fallback={<Skeleton />}>
        <EventsContent />
      </Suspense>
      <ComparePanel />
    </>
  )
}
