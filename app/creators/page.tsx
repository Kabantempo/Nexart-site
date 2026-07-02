'use client'

import { useCreators } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ArrowRight, Search, X, ArrowUpAZ, Clock, Palette } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ITEMS_PER_PAGE = 12

function Skeleton() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="h-10 w-64 bg-gray-100 rounded-xl mb-3 animate-pulse" />
        <div className="h-5 w-48 bg-gray-100 rounded-lg mb-10 animate-pulse" />
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
  const [sortOrder,        setSortOrder]        = useState<'alpha' | 'newest'>('alpha')
  const [visibleCount,     setVisibleCount]     = useState(ITEMS_PER_PAGE)

  useEffect(() => { const q = searchParams.get('q'); if (q) setSearchTerm(q) }, [searchParams])
  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE) }, [searchTerm, cityFilter, disciplineFilter, sortOrder])

  const uniqueCities      = [...new Set(creators.map((c) => c.city).filter(Boolean))].sort() as string[]
  const uniqueDisciplines = [...new Set(creators.flatMap((c) => c.disciplines || []).filter(Boolean))].sort() as string[]

  const filtered = creators
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
      if (sortOrder === 'alpha') return (a.full_name || '').localeCompare(b.full_name || '', 'fr')
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const visible     = filtered.slice(0, visibleCount)
  const hasMore     = visibleCount < filtered.length
  const hasActiveFilters = cityFilter !== 'all' || disciplineFilter !== 'all' || sortOrder !== 'alpha' || !!searchTerm
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100

  const resetFilters = () => { setCityFilter('all'); setDisciplineFilter('all'); setSortOrder('alpha'); setSearchTerm('') }

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
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-600/12 blur-[80px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 relative z-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
            <p className="text-violet-400 text-xs font-bold tracking-widest uppercase mb-3">Communauté</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight leading-tight">
              Créateurs & Artisans
            </h1>
            <p className="text-white/40 text-base">
              {creators.length} créateur{creators.length !== 1 ? 's' : ''} talentueux partout en France
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
            placeholder="Nom, discipline, ville…"
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
          <div className="flex flex-wrap gap-5 items-end">

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

            {uniqueDisciplines.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Discipline</p>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer focus:outline-none transition ${
                    disciplineFilter !== 'all' ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <option value="all">Toutes les disciplines</option>
                  {uniqueDisciplines.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}

            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Trier par</p>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                {([['alpha', <ArrowUpAZ key="a" size={13} />, 'A → Z'], ['newest', <Clock key="c" size={13} />, 'Récents']] as const).map(([key, icon, label], i) => (
                  <button
                    key={key}
                    onClick={() => setSortOrder(key)}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors ${i === 1 ? 'border-l border-gray-200' : ''} ${
                      sortOrder === key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              {disciplineFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  {disciplineFilter} <button onClick={() => setDisciplineFilter('all')}><X size={11} /></button>
                </span>
              )}
              {sortOrder !== 'alpha' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                  Récents en premier <button onClick={() => setSortOrder('alpha')}><X size={11} /></button>
                </span>
              )}
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
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.35), ease: 'easeOut', duration: 0.4 }}
                >
                  <Link
                    href={`/creators/${creator.id}`}
                    className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/8 hover:-translate-y-1 transition-all duration-300 h-full"
                  >
                    {/* Avatar */}
                    <div className="relative aspect-square bg-gray-100 shrink-0 overflow-hidden">
                      {creator.avatar_url ? (
                        <Image src={creator.avatar_url} alt={creator.full_name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500">
                          <span className="text-5xl font-bold text-white/80 select-none">
                            {creator.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">{creator.full_name}</h3>

                      {creator.disciplines?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {creator.disciplines.slice(0, 2).map((d) => (
                            <span key={d} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{d}</span>
                          ))}
                          {creator.disciplines.length > 2 && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">+{creator.disciplines.length - 2}</span>
                          )}
                        </div>
                      )}

                      {creator.bio && (
                        <p className="text-xs text-gray-400 leading-relaxed mb-3 flex-1 line-clamp-2">{creator.bio}</p>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1 text-indigo-600 text-xs font-bold group-hover:gap-2 transition-all">
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
                </motion.div>
              ))}
            </div>

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
                  <p className="text-xs text-gray-400">{Math.min(visibleCount, filtered.length)} / {filtered.length} créateurs</p>
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
              {hasActiveFilters
                ? "Aucun créateur ne correspond à vos critères. Essayez d'autres filtres."
                : 'Les premiers artisans et créateurs arrivent bientôt. Rejoignez la communauté dès maintenant.'}
            </p>
            {hasActiveFilters
              ? <button onClick={resetFilters} className="px-6 py-2.5 rounded-xl border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors">Réinitialiser les filtres</button>
              : <Link href="/register" className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 transition-colors">Rejoindre en tant que créateur</Link>
            }
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CreatorsPage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CreatorsContent />
    </Suspense>
  )
}
