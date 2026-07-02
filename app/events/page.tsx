'use client'

import { useEvents } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, Search, X, Users, SlidersHorizontal } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
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

const TYPE_COLORS: Record<string, string> = {
  popup: 'bg-violet-100 text-violet-700',
  salon: 'bg-emerald-100 text-emerald-700',
  fair:  'bg-amber-100 text-amber-700',
  seasonal: 'bg-sky-100 text-sky-700',
  permanent: 'bg-indigo-100 text-indigo-700',
}

function Skeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="h-10 w-64 bg-gray-100 rounded-xl mb-3 animate-pulse" />
        <div className="h-5 w-40 bg-gray-100 rounded-lg mb-10 animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-2xl mb-4 animate-pulse" />
        <div className="h-20 bg-gray-100 rounded-2xl mb-8 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="h-48 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded-lg" />
                <div className="h-4 w-3/4 bg-gray-100 rounded-lg" />
                <div className="h-4 w-1/2 bg-gray-100 rounded-lg" />
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

  const [searchTerm,  setSearchTerm]  = useState(searchParams.get('q') || '')
  const [cityFilter,  setCityFilter]  = useState('all')
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [sortOrder,   setSortOrder]   = useState<'asc' | 'desc'>('asc')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => { const q = searchParams.get('q'); if (q) setSearchTerm(q) }, [searchParams])
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, typeFilter, sortOrder])

  const uniqueCities = [...new Set(events.map((e) => e.city).filter(Boolean))].sort() as string[]

  const filtered = events
    .filter((e) =>
      !searchTerm ||
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((e) => cityFilter === 'all' || e.city === cityFilter)
    .filter((e) => typeFilter === 'all' || e.event_type === typeFilter)
    .sort((a, b) => {
      const da = a.start_date ? new Date(a.start_date).getTime() : 0
      const db = b.start_date ? new Date(b.start_date).getTime() : 0
      return sortOrder === 'asc' ? da - db : db - da
    })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const hasActiveFilters = cityFilter !== 'all' || typeFilter !== 'all' || sortOrder !== 'asc' || !!searchTerm
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100

  const resetFilters = () => { setCityFilter('all'); setTypeFilter('all'); setSortOrder('asc'); setSearchTerm('') }

  if (loading) return <Skeleton />

  if (error) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-4xl mb-4">⚠️</p>
      <p className="text-red-500">Une erreur est survenue. Réessayez dans quelques instants.</p>
    </div>
  )

  return (
    <div className="bg-white min-h-screen">

      {/* Dark hero header */}
      <div className="bg-[#06060f] border-b border-white/6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-600/15 blur-[80px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-3">Découvrir</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight leading-tight">
              Événements artisanaux
            </h1>
            <p className="text-white/40 text-base">
              {events.length} événement{events.length !== 1 ? 's' : ''} — marchés, pop-ups, salons, festivals
            </p>
          </motion.div>
        </div>
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
          <div className="flex flex-wrap gap-5 items-start">

            {/* Type pills */}
            <div className="flex-1 min-w-[280px]">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Type d'événement</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(({ key, label }) => {
                  const active = typeFilter === key
                  return (
                    <button
                      key={key}
                      onClick={() => setTypeFilter(key)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                        active
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* City + sort */}
            <div className="flex gap-3 items-end flex-wrap shrink-0">
              {uniqueCities.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ville</p>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer focus:outline-none transition ${
                      cityFilter !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <option value="all">Toutes les villes</option>
                    {uniqueCities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Trier par date</p>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                  {(['asc', 'desc'] as const).map((o, i) => (
                    <button
                      key={o}
                      onClick={() => setSortOrder(o)}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${i === 1 ? 'border-l border-gray-200' : ''} ${
                        sortOrder === o ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {o === 'asc' ? '↑ Récents' : '↓ Anciens'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active chips */}
          {hasActiveFilters && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 flex-wrap items-center">
              <span className="text-xs text-gray-400 font-medium">Actifs :</span>
              {searchTerm && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  "{searchTerm}" <button onClick={() => setSearchTerm('')}><X size={11} /></button>
                </span>
              )}
              {cityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  {cityFilter} <button onClick={() => setCityFilter('all')}><X size={11} /></button>
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  {EVENT_TYPE_LABELS[typeFilter]} <button onClick={() => setTypeFilter('all')}><X size={11} /></button>
                </span>
              )}
              <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-600 font-semibold ml-1">Tout effacer</button>
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

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.35), ease: 'easeOut', duration: 0.4 }}
                >
                  <Link
                    href={`/events/${event.id}`}
                    className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/8 hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    {/* Cover */}
                    <div className="relative h-48 bg-gray-100 shrink-0 overflow-hidden">
                      {event.cover_image ? (
                        <Image src={event.cover_image} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500">
                          <Calendar size={44} className="text-white/60" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {event.event_type && (
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${TYPE_COLORS[event.event_type] ?? 'bg-white/90 text-gray-700'}`}>
                            {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                          </span>
                        )}
                      </div>
                      {event.stand_count > 0 && (
                        <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
                          <Users size={10} /> {event.stand_count}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3 className="font-bold text-gray-900 text-base leading-snug mb-3">{event.title}</h3>
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
                        <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1.5 text-indigo-600 text-sm font-semibold group-hover:gap-2.5 transition-all">
                          Voir l'événement <ArrowRight size={14} />
                        </span>
                        {event.stand_price > 0 && (
                          <span className="text-sm font-bold text-gray-900">{event.stand_price} €</span>
                        )}
                        {event.stand_price === 0 && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Gratuit</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-16">
                <div className="max-w-[200px] mx-auto mb-4">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{Math.min(visibleCount, filtered.length)} / {filtered.length} événements</p>
                </div>
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  className="px-8 py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 font-semibold text-sm hover:bg-indigo-600 hover:text-white transition-all duration-200"
                >
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
              {hasActiveFilters
                ? "Aucun événement ne correspond à vos critères. Essayez d'autres filtres."
                : 'Les premiers événements arrivent bientôt. Inscrivez-vous pour être parmi les premiers notifiés.'}
            </p>
            {hasActiveFilters
              ? <button onClick={resetFilters} className="px-6 py-2.5 rounded-xl border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors">Réinitialiser les filtres</button>
              : <Link href="/register" className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors">Créer un compte gratuit</Link>
            }
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <EventsContent />
    </Suspense>
  )
}
