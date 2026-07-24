'use client'

import { useEvents } from '@/lib/hooks'
import type { Event as NexartEvent } from '@/lib/types'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, Search, X, Users, SlidersHorizontal, Euro, Sparkles } from 'lucide-react'
import { ComparePanel, PinButton } from '@/components/ui/compare-panel'
import { SaveSearchButton } from '@/components/ui/save-search-button'
import { useToast } from '@/components/ui/toast-provider'
import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

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
    <motion.div ref={ref} className={className} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
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
      <style>{`@keyframes ev-pulse { 0%,100%{opacity:1} 50%{opacity:.5} } @keyframes ev-shimmer { 0%,100%{opacity:0.6} 50%{opacity:0.3} }`}</style>
      <div style={{ height: '192px', backgroundColor: '#06060f', animation: 'ev-pulse 1.5s ease-in-out infinite' }} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px 80px' }}>
        <div style={{ height: '48px', borderRadius: '16px', backgroundColor: '#F3F4F6', marginBottom: '16px', animation: 'ev-shimmer 1.5s ease-in-out infinite' }} />
        <div style={{ height: '80px', borderRadius: '16px', backgroundColor: '#F3F4F6', marginBottom: '32px', animation: 'ev-shimmer 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ borderRadius: '16px', border: '1px solid #F3F4F6', overflow: 'hidden', animationDelay: `${i * 80}ms` }}>
              <div style={{ height: '208px', animation: 'ev-shimmer 1.5s ease-in-out infinite', backgroundColor: '#F3F4F6' }} />
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '20px', borderRadius: '8px', animation: 'ev-shimmer 1.5s ease-in-out infinite', backgroundColor: '#F3F4F6' }} />
                <div style={{ height: '16px', width: '75%', borderRadius: '8px', animation: 'ev-shimmer 1.5s ease-in-out infinite', backgroundColor: '#F3F4F6' }} />
                <div style={{ height: '16px', width: '50%', borderRadius: '8px', animation: 'ev-shimmer 1.5s ease-in-out infinite', backgroundColor: '#F3F4F6' }} />
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
  const toast = useToast()
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  const getStoredFilters = () => {
    try {
      if (typeof window === 'undefined') return null
      const raw = localStorage.getItem('nexart_event_filters')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  const stored = getStoredFilters()

  const [searchTerm,    setSearchTerm]    = useState(searchParams.get('q') || stored?.searchTerm || '')
  const [cityFilter,    setCityFilter]    = useState(stored?.cityFilter || 'all')
  const [typeFilter,    setTypeFilter]    = useState(stored?.typeFilter || 'all')
  const [selectedDiscs, setSelectedDiscs] = useState<string[]>(stored?.selectedDiscs || [])
  const [priceMax,      setPriceMax]      = useState<number | ''>(stored?.priceMax ?? '')
  const [freeOnly,      setFreeOnly]      = useState(stored?.freeOnly || false)
  const [sortOrder,     setSortOrder]     = useState<'asc' | 'desc'>(stored?.sortOrder || 'asc')
  const [dateFrom,      setDateFrom]      = useState(stored?.dateFrom || '')
  const [dateTo,        setDateTo]        = useState(stored?.dateTo || '')
  const [visibleCount,  setVisibleCount]  = useState(ITEMS_PER_PAGE)
  const [nearMe,        setNearMe]        = useState(stored?.nearMe || false)
  const [userPos,       setUserPos]       = useState<{ lat: number; lng: number } | null>(null)
  const [geoRadius]                       = useState(stored?.geoRadius || 50)
  const [discDropdownOpen, setDiscDropdownOpen] = useState(false)
  const discDropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const q = searchParams.get('q'); if (q) setSearchTerm(q)
    const disc = searchParams.get('disc'); if (disc) setSelectedDiscs(disc.split(',').filter(Boolean))
    const city = searchParams.get('city'); if (city) setCityFilter(city)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (discDropdownRef.current && !discDropdownRef.current.contains(e.target as Node)) setDiscDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('nexart_event_filters', JSON.stringify({ searchTerm, cityFilter, typeFilter, selectedDiscs, priceMax, freeOnly, sortOrder, dateFrom, dateTo, nearMe, geoRadius }))
    } catch { /* SSR or storage unavailable */ }
  }, [searchTerm, cityFilter, typeFilter, selectedDiscs, priceMax, freeOnly, sortOrder, dateFrom, dateTo, nearMe, geoRadius])
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, typeFilter, selectedDiscs, priceMax, freeOnly, sortOrder, dateFrom, dateTo])

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
    }, () => toast.error('Géolocalisation non disponible'))
  }

  const uniqueCities = [...new Set(events.map((e) => e.city).filter(Boolean))].sort() as string[]
  const uniqueDiscs  = [...new Set(events.flatMap((e) => (e as NexartEvent & { discipline_tags?: string[] }).discipline_tags || []).filter(Boolean))].sort()

  const filtered = events
    .filter((e) => !searchTerm || e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || e.city?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((e) => cityFilter === 'all' || e.city === cityFilter)
    .filter((e) => typeFilter === 'all' || e.event_type === typeFilter)
    .filter((e) => selectedDiscs.length === 0 || (e as NexartEvent & { discipline_tags?: string[] }).discipline_tags?.some(d => selectedDiscs.includes(d)))
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
  const hasActiveFilters = cityFilter !== 'all' || typeFilter !== 'all' || selectedDiscs.length > 0 || sortOrder !== 'asc' || !!searchTerm || freeOnly || priceMax !== '' || nearMe || !!dateFrom || !!dateTo
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100
  const uniqueCitiesCount = new Set(events.map(e => e.city).filter(Boolean)).size

  const resetFilters = () => { setCityFilter('all'); setTypeFilter('all'); setSelectedDiscs([]); setSortOrder('asc'); setSearchTerm(''); setPriceMax(''); setFreeOnly(false); setNearMe(false); setDateFrom(''); setDateTo('') }
  const toggleDisc = (disc: string) => setSelectedDiscs(prev => prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc])

  const shareFilters = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('q', searchTerm)
    if (cityFilter !== 'all') params.set('city', cityFilter)
    if (selectedDiscs.length > 0) params.set('disc', selectedDiscs.join(','))
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const url = `${window.location.pathname}?${params.toString()}`
    router.push(url, { scroll: false })
    navigator.clipboard.writeText(window.location.origin + url).catch(() => {})
    toast.success('Lien copié dans le presse-papier !')
  }

  if (loading) return <Skeleton />

  if (error) return (
    <div style={{ maxWidth: '512px', margin: '0 auto', padding: '128px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</p>
      <p style={{ color: '#EF4444' }}>Une erreur est survenue. Réessayez dans quelques instants.</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`
        @keyframes ev-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .events-grid { display: grid; grid-template-columns: 1fr; gap: 20px }
        @media (min-width: 640px) { .events-grid { grid-template-columns: repeat(2, 1fr); gap: 24px } }
        @media (min-width: 1024px) { .events-grid { grid-template-columns: repeat(3, 1fr) } }
        .events-grid-featured { grid-column: span 1 }
        @media (min-width: 640px) { .events-grid-featured { grid-column: span 2 } }
        @media (min-width: 1024px) { .events-grid-featured { grid-column: span 2 } }
        .events-card { display: flex; overflow: hidden; background: #fff; border: 1px solid #F3F4F6; transition: all 0.3s; height: 100%; text-decoration: none }
        .events-card:hover { border-color: #C7D2FE; box-shadow: 0 20px 40px rgba(0,0,0,0.1); transform: translateY(-4px) }
        .events-card:hover .events-card-img { transform: scale(1.05) }
        .events-card:hover .events-card-title { color: #4338CA }
        .events-card:hover .events-card-cta { opacity: 1; gap: 12px }
        .events-card-img { transition: transform 0.7s; object-fit: cover }
        .events-card-title { font-weight: 700; color: #111827; line-height: 1.4; transition: color 0.2s }
        .events-card-cta { display: flex; align-items: center; gap: 6px; color: #4F46E5; font-size: 14px; font-weight: 600; opacity: 0; gap: 6px; transition: all 0.2s }
        .events-card-normal { flex-direction: column; border-radius: 16px }
        .events-card-featured { border-radius: 24px }
        .ev-feat-img-wrap { width: 160px; height: 100%; flex-shrink: 0; border-radius: 16px; overflow: hidden }
        .ev-feat-body-mobile { flex: 1; flex-direction: column; display: flex }
        .ev-feat-overlay-text { display: none }
        .ev-feat-footer { display: none }
        @media (min-width: 640px) {
          .events-card-featured { flex-direction: column }
          .ev-feat-img-wrap { width: 100%; height: 288px; border-radius: 0 }
          .ev-feat-body-mobile { display: none }
          .ev-feat-overlay-text { display: block }
          .ev-feat-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-top: 1px solid #FAFAFA }
        }
        .ev-filter-input { padding: 8px 12px; border-radius: 12px; border: 1px solid #E5E7EB; font-size: 14px; font-weight: 500; cursor: pointer; background: #fff; color: #374151; outline: none; transition: all 0.15s }
        .ev-filter-input:focus { border-color: #A5B4FC }
        .ev-filter-input.active { border-color: #A5B4FC; background: #EEF2FF; color: #4338CA }
        .ev-sort-btn { flex: 1; padding: 8px 16px; font-size: 14px; font-weight: 500; background: #fff; border: none; cursor: pointer; transition: background 0.15s; color: #4B5563 }
        .ev-sort-btn:hover { background: #F9FAFB }
        .ev-sort-btn.active { background: #4F46E5; color: #fff }
        .ev-tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 600 }
        .ev-tag-pill button { display: flex; align-items: center; background: none; border: none; cursor: pointer; padding: 0; color: inherit }
        .ev-search-input { width: 100%; padding: 14px 40px 14px 44px; border-radius: 16px; border: 1px solid #E5E7EB; background: #fff; color: #111827; font-size: 14px; outline: none; box-shadow: 0 1px 3px rgba(0,0,0,0.05); box-sizing: border-box; transition: all 0.15s }
        .ev-search-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) }
        .ev-load-more { padding: 12px 32px; border-radius: 12px; border: 2px solid #4F46E5; color: #4F46E5; font-weight: 600; font-size: 14px; background: none; cursor: pointer; transition: all 0.2s }
        .ev-load-more:hover { background: #4F46E5; color: #fff }
        .ev-type-btn { padding: 6px 16px; border-radius: 9999px; font-size: 14px; font-weight: 500; border: 1px solid; cursor: pointer; transition: all 0.15s }
        .ev-type-btn.inactive { background: #fff; border-color: #E5E7EB; color: #4B5563 }
        .ev-type-btn.inactive:hover { border-color: #D1D5DB }
        .ev-type-btn.active { background: #4F46E5; border-color: #4F46E5; color: #fff; box-shadow: 0 1px 4px rgba(99,102,241,0.2) }
        .ev-map-link { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 12px; background: #EEF2FF; border: 1px solid #E0E7FF; text-decoration: none; transition: all 0.15s; width: fit-content; margin-bottom: 8px }
        .ev-map-link:hover { background: #E0E7FF; border-color: #C7D2FE }
        .ev-map-link:hover .ev-map-arrow { transform: translateX(2px) }
        .ev-map-arrow { transition: transform 0.15s }
      `}</style>

      {/* Hero */}
      <div style={{ backgroundColor: '#06060f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.10, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div style={{ position: 'absolute', top: '-128px', left: '-128px', width: '384px', height: '384px', borderRadius: '9999px', backgroundColor: 'rgba(99,102,241,0.2)', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: 0, width: '320px', height: '320px', borderRadius: '9999px', backgroundColor: 'rgba(124,58,237,0.15)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px 64px', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Sparkles size={13} color="#818CF8" />
              <span style={{ color: '#818CF8', fontSize: '12px', fontWeight: 600 }}>Découvrir</span>
            </div>
          </motion.div>

          <div style={{ overflow: 'hidden', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              <WordReveal delay={0.05}>Événements artisanaux</WordReveal>
            </h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', marginBottom: '40px' }}>
            Marchés, pop-ups, salons et festivals — candidatez en quelques clics
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { value: events.length, label: 'événements' },
              { value: uniqueCitiesCount, label: 'villes' },
              { value: events.filter(e => e.stand_price === 0).length, label: 'gratuits' },
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
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={17} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Rechercher un événement, une ville…" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="ev-search-input" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
          {/* Row 1: Type */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '12px' }}>{"Type d'événement"}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EVENT_TYPES.map(({ key, label }) => {
                const active = typeFilter === key
                return (
                  <button key={key} onClick={() => setTypeFilter(key)} className={`ev-type-btn ${active ? 'active' : 'inactive'}`}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 2: Ville + Date + Tri */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6', alignItems: 'flex-start' }}>
            {uniqueCities.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>Ville</p>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
                  className={`ev-filter-input${cityFilter !== 'all' ? ' active' : ''}`}>
                  <option value="all">Toutes les villes</option>
                  {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>À partir du</p>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className={`ev-filter-input${dateFrom ? ' active' : ''}`} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>{"Jusqu'au"}</p>
              <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
                className={`ev-filter-input${dateTo ? ' active' : ''}`} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>Trier</p>
              <div style={{ display: 'flex', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', backgroundColor: '#fff' }}>
                {(['asc', 'desc'] as const).map((o, i) => (
                  <button key={o} onClick={() => setSortOrder(o)}
                    className={`ev-sort-btn${sortOrder === o ? ' active' : ''}`}
                    style={{ borderLeft: i === 1 ? '1px solid #E5E7EB' : 'none' }}>
                    {o === 'asc' ? '↑ Prochains' : '↓ Plus loin'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Disciplines + Tarif + Gratuit + NearMe */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6', alignItems: 'flex-end' }}>
            {uniqueDiscs.length > 0 && (
              <div ref={discDropdownRef} style={{ position: 'relative' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>Disciplines</p>
                <button onClick={() => setDiscDropdownOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '12px', border: `1px solid ${selectedDiscs.length > 0 ? '#A5B4FC' : '#E5E7EB'}`, backgroundColor: selectedDiscs.length > 0 ? '#EEF2FF' : '#fff', color: selectedDiscs.length > 0 ? '#4338CA' : '#374151', fontSize: '14px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {selectedDiscs.length > 0 ? `Disciplines (${selectedDiscs.length})` : 'Toutes disciplines'}
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>▾</span>
                </button>
                {discDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100, backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '14px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '8px', minWidth: '220px', maxHeight: '280px', overflowY: 'auto' }}>
                    {selectedDiscs.length > 0 && (
                      <button onClick={() => setSelectedDiscs([])}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: '11px', color: '#EF4444', fontWeight: 600, marginBottom: '4px', cursor: 'pointer', background: 'none', border: 'none' }}>
                        Tout effacer
                      </button>
                    )}
                    {uniqueDiscs.map(d => {
                      const checked = selectedDiscs.includes(d)
                      return (
                        <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: checked ? '#EEF2FF' : 'transparent', transition: 'background 0.1s' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleDisc(d)} style={{ accentColor: '#6366f1', width: '14px', height: '14px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '13px', color: checked ? '#4338CA' : '#374151', fontWeight: checked ? 600 : 400 }}>{d}</span>
                        </label>
                      )
                    })}
                  </motion.div>
                )}
              </div>
            )}
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '8px' }}>Prix stand max (€)</p>
              <input type="number" min={0} placeholder="ex: 50" value={priceMax}
                onChange={e => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                style={{ width: '112px', padding: '8px 12px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none', transition: 'border-color 0.15s' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} style={{ width: '16px', height: '16px', borderRadius: '4px', accentColor: '#6366F1' }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Gratuit uniquement</span>
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
              <button onClick={handleNearMe}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', border: `1px solid ${nearMe ? '#4F46E5' : '#E5E7EB'}`, backgroundColor: nearMe ? '#4F46E5' : '#fff', color: nearMe ? '#fff' : '#4B5563', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                <MapPin size={14} /> Autour de moi ({geoRadius} km)
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>Actifs :</span>
              {searchTerm && <span className="ev-tag-pill">"{searchTerm}" <button onClick={() => setSearchTerm('')}><X size={11} /></button></span>}
              {cityFilter !== 'all' && <span className="ev-tag-pill">{cityFilter} <button onClick={() => setCityFilter('all')}><X size={11} /></button></span>}
              {typeFilter !== 'all' && <span className="ev-tag-pill">{EVENT_TYPE_LABELS[typeFilter]} <button onClick={() => setTypeFilter('all')}><X size={11} /></button></span>}
              {selectedDiscs.map(d => <span key={d} className="ev-tag-pill">{d} <button onClick={() => toggleDisc(d)}><X size={11} /></button></span>)}
              {dateFrom && <span className="ev-tag-pill">À partir du {new Date(dateFrom).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} <button onClick={() => setDateFrom('')}><X size={11} /></button></span>}
              {dateTo && <span className="ev-tag-pill">{"Jusqu'au"} {new Date(dateTo).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} <button onClick={() => setDateTo('')}><X size={11} /></button></span>}
              {freeOnly && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: '#D1FAE5', color: '#065F46', fontSize: '12px', fontWeight: 600 }}>Gratuit <button onClick={() => setFreeOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={11} /></button></span>}
              {priceMax !== '' && <span className="ev-tag-pill">≤ {priceMax}€ <button onClick={() => setPriceMax('')}><X size={11} /></button></span>}
              {nearMe && <span className="ev-tag-pill"><MapPin size={10} /> Autour de moi <button onClick={() => setNearMe(false)}><X size={11} /></button></span>}
              <button onClick={resetFilters} style={{ fontSize: '12px', color: '#F87171', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#DC2626'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#F87171'}>Tout effacer</button>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={shareFilters}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 11px', borderRadius: '20px', border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#6b7280', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#A5B4FC'; (e.currentTarget as HTMLButtonElement).style.color = '#4338CA' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}>
                  🔗 Partager ces filtres
                </button>
                <SaveSearchButton disciplines={selectedDiscs} city={cityFilter !== 'all' ? cityFilter : undefined} query={searchTerm || undefined} />
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <SlidersHorizontal size={15} color="#9CA3AF" />
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            <span style={{ fontWeight: 700, color: '#111827', fontSize: '16px' }}>{filtered.length}</span> résultat{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span style={{ color: '#9CA3AF' }}> · filtré{filtered.length !== 1 ? 's' : ''}</span>}
          </span>
        </div>

        {/* Lien carte */}
        <Link href="/carte" className="ev-map-link">
          <MapPin size={15} color="#6366F1" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#4338CA' }}>Voir les événements sur la carte</span>
          <ArrowRight size={14} color="#818CF8" className="ev-map-arrow" />
        </Link>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div className="events-grid">
              {visible.map((event, idx) => {
                const posInGroup = idx % 7
                const isFeatured = posInGroup === 0 || posInGroup === 4
                const rem = (event as NexartEvent & { remaining_spots?: number }).remaining_spots
                const tags = (event as NexartEvent & { discipline_tags?: string[] }).discipline_tags || []

                return (
                  <FadeUp key={event.id} delay={Math.min(idx * 0.04, 0.3)}
                    className={isFeatured ? 'events-grid-featured' : ''}>
                    <Link href={`/events/${event.id}`}
                      className={`events-card ${isFeatured ? 'events-card-featured' : 'events-card-normal'}`}>
                      {/* Cover */}
                      <div className={isFeatured ? 'ev-feat-img-wrap' : ''}
                        style={isFeatured ? { position: 'relative', backgroundColor: '#F3F4F6', flexShrink: 0, overflow: 'hidden' } : { position: 'relative', height: '208px', backgroundColor: '#F3F4F6', flexShrink: 0, overflow: 'hidden' }}>
                        {event.cover_image && !failedImages.has(event.id) ? (
                          <Image src={event.cover_image} alt={event.title} fill className="events-card-img"
                            onError={() => setFailedImages(prev => new Set([...prev, event.id]))} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1117' }}>
                            <Calendar size={isFeatured ? 56 : 40} color="rgba(255,255,255,0.2)" />
                          </div>
                        )}

                        <div style={{ position: 'absolute', inset: 0, background: isFeatured ? 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2), transparent)' : 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0.05), transparent)' }} />

                        {/* Top badges */}
                        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {isFeatured && (
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#4F46E5', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>À la une</span>
                            )}
                            {event.event_type && (() => {
                              const badge = TYPE_BADGE[event.event_type]
                              return (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', backdropFilter: 'blur(12px)', backgroundColor: badge?.bg ?? 'rgba(0,0,0,0.5)', color: badge?.text ?? '#fff' }}>
                                  {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                                </span>
                              )
                            })()}
                          </div>
                          {(event.stand_count ?? 0) > 0 && (
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, backgroundColor: rem === 0 ? 'rgba(107,114,128,0.7)' : rem !== undefined && rem <= 3 ? 'rgba(245,158,11,0.8)' : 'rgba(0,0,0,0.5)', color: '#fff' }}>
                              <Users size={10} />
                              {rem === 0 ? 'Complet' : rem !== undefined ? `${rem} place${rem > 1 ? 's' : ''}` : `${event.stand_count} stands`}
                            </span>
                          )}
                        </div>

                        {/* Featured: title + meta on image bottom */}
                        {isFeatured && (
                          <div className="ev-feat-overlay-text" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px' }}>
                            <h3 className="events-card-title" style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
                              {event.title}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                              {event.start_date && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                                  <Calendar size={11} color="#A5B4FC" />
                                  {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              )}
                              {event.location && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                                  <MapPin size={11} color="#A5B4FC" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Price badge */}
                        {event.stand_price != null && (
                          <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                            {event.stand_price === 0
                              ? <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#374151', border: '1px solid #E5E7EB' }}>Gratuit</span>
                              : <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '2px' }}><Euro size={10} />{event.stand_price}</span>
                            }
                          </div>
                        )}
                      </div>

                      {/* Body — mobile for featured, always for normal */}
                      <div className={isFeatured ? 'ev-feat-body-mobile' : ''} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }}>
                        <h3 className="events-card-title" style={{ fontSize: isFeatured ? '18px' : '15px', marginBottom: '12px' }}>{event.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                          {event.start_date && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6B7280' }}>
                              <Calendar size={13} color="#818CF8" style={{ flexShrink: 0 }} />
                              {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          )}
                          {event.location && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6B7280' }}>
                              <MapPin size={13} color="#818CF8" style={{ flexShrink: 0 }} />
                              {event.location}
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '12px', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{event.description}</p>
                        )}
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                            {tags.slice(0, 2).map(t => (
                              <span key={t} style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', fontWeight: 600 }}>{t}</span>
                            ))}
                            {tags.length > 2 && <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '11px', fontWeight: 600 }}>+{tags.length - 2}</span>}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #FAFAFA' }}>
                          <span className="events-card-cta">Voir l&apos;événement <ArrowRight size={14} /></span>
                          <PinButton event={{ id: event.id, title: event.title, start_date: event.start_date, city: event.city ?? undefined, stand_price: event.stand_price, stand_count: event.stand_count, discipline_tags: tags, cover_image: event.cover_image ?? undefined }} />
                        </div>
                      </div>

                      {/* Featured sm+ footer */}
                      {isFeatured && (
                        <div className="ev-feat-footer">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {tags.slice(0, 3).map(t => (
                              <span key={t} style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px', fontWeight: 600 }}>{t}</span>
                            ))}
                            {tags.length > 3 && <span style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '11px', fontWeight: 600 }}>+{tags.length - 3}</span>}
                          </div>
                          <span className="events-card-cta" style={{ flexShrink: 0, marginLeft: '12px' }}>Voir <ArrowRight size={13} /></span>
                        </div>
                      )}
                    </Link>
                  </FadeUp>
                )
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '64px' }}>
                <div style={{ maxWidth: '200px', margin: '0 auto 16px' }}>
                  <div style={{ height: '4px', backgroundColor: '#F3F4F6', borderRadius: '9999px', overflow: 'hidden', marginBottom: '8px' }}>
                    <motion.div style={{ height: '100%', backgroundColor: '#6366F1', borderRadius: '9999px' }}
                      initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{Math.min(visibleCount, filtered.length)} / {filtered.length} événements</p>
                </div>
                <button onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)} className="ev-load-more">
                  Voir {Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus
                </button>
              </div>
            )}
            {!hasMore && filtered.length > ITEMS_PER_PAGE && (
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#9CA3AF', marginTop: '48px' }}>Tous les {filtered.length} résultats sont affichés</p>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '96px 0' }}>
            <p style={{ fontSize: '48px', marginBottom: '20px' }}>{hasActiveFilters ? '🔍' : '📅'}</p>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>{hasActiveFilters ? 'Aucun résultat' : 'Aucun événement pour le moment'}</h3>
            <p style={{ color: '#9CA3AF', maxWidth: '384px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              {hasActiveFilters ? "Aucun événement ne correspond à vos critères." : 'Les premiers événements arrivent bientôt.'}
            </p>
            {hasActiveFilters
              ? <button onClick={resetFilters} style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid #C7D2FE', color: '#4F46E5', fontSize: '14px', fontWeight: 600, background: '#fff', cursor: 'pointer' }}>Réinitialiser</button>
              : <Link href="/register" style={{ padding: '12px 28px', borderRadius: '12px', backgroundColor: '#4F46E5', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>Créer un compte</Link>
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
