'use client'

import { useEvents } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ITEMS_PER_PAGE = 12

const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  seasonal: 'Saisonnier',
  popup: 'Pop-up',
  salon: 'Salon',
  fair: 'Foire',
}

const SELECT_STYLE: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#FFFFFF',
  fontSize: '14px',
  color: '#1A1A1A',
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: '34px',
  fontFamily: 'inherit',
}

function EventsContent() {
  const { events, loading, error } = useEvents()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [cityFilter, setCityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchTerm(q)
  }, [searchParams])

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [searchTerm, cityFilter, typeFilter, sortOrder])

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

  const resetFilters = () => {
    setCityFilter('all')
    setTypeFilter('all')
    setSortOrder('asc')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
          <div style={{ width: '42%', height: '52px', backgroundColor: '#F3F4F6', borderRadius: '10px', marginBottom: '16px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ width: '55%', height: '22px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '32px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '48px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '12px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '40px', width: '140px', backgroundColor: '#F3F4F6', borderRadius: '8px', animation: 'pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', animation: 'pulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}>
                <div style={{ height: '200px', backgroundColor: '#F3F4F6' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '6px', marginBottom: '12px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '65%', marginBottom: '8px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Une erreur est survenue. Réessayez dans quelques instants.</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 60px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            Événements & Marchés
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '32px', lineHeight: '1.6' }}>
            {events.length} événement{events.length !== 1 ? 's' : ''} artisanal{events.length !== 1 ? 'ux' : ''} en France
          </p>
        </motion.div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={20} color="#888888" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input
            type="text"
            placeholder="Rechercher un événement, une ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '12px 40px 12px 40px',
              borderRadius: '8px', border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A',
              transition: 'all 300ms ease', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '13px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
              <X size={18} color="#888888" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
            <SlidersHorizontal size={15} />
          </div>

          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={SELECT_STYLE}>
            <option value="all">Toutes les villes</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={SELECT_STYLE}>
            <option value="all">Tous les types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} style={SELECT_STYLE}>
            <option value="asc">Date croissante</option>
            <option value="desc">Date décroissante</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '10px 14px', borderRadius: '8px', border: '1px solid #FCA5A5',
                backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '13px',
                fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <X size={13} /> Effacer
            </button>
          )}
        </div>

        {/* Results count */}
        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>
          {filtered.length === 0
            ? 'Aucun résultat'
            : `${Math.min(visibleCount, filtered.length)} / ${filtered.length} événement${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {visible.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={`/events/${event.id}`}
                    style={{
                      display: 'block', textDecoration: 'none', borderRadius: '12px',
                      border: '1px solid #E5E7EB', overflow: 'hidden',
                      backgroundColor: '#FFFFFF', transition: 'all 300ms ease',
                      height: '100%', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(99,102,241,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {/* Cover */}
                    <div style={{ width: '100%', height: '200px', backgroundColor: '#F5F5F7', overflow: 'hidden', position: 'relative' }}>
                      {event.cover_image ? (
                        <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
                          <Calendar size={48} color="#FFFFFF" />
                        </div>
                      )}
                      {event.event_type && (
                        <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.9)', color: '#6366F1' }}>
                          {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                        {event.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                        {event.start_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} color="#6366F1" />
                            <span style={{ fontSize: '13px', color: '#888888' }}>
                              {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} color="#6366F1" />
                            <span style={{ fontSize: '13px', color: '#888888' }}>{event.location}</span>
                          </div>
                        )}
                      </div>
                      {event.description && (
                        <p style={{ fontSize: '13px', color: '#888888', lineHeight: '1.5', marginBottom: '14px' }}>
                          {event.description.substring(0, 90)}…
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '13px', fontWeight: '600' }}>
                        Voir plus <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  style={{
                    padding: '12px 32px', borderRadius: '10px', border: '2px solid #6366F1',
                    backgroundColor: 'transparent', color: '#6366F1', fontSize: '15px',
                    fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6366F1'; e.currentTarget.style.color = '#FFFFFF' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6366F1' }}
                >
                  Voir plus ({filtered.length - visibleCount} restant{filtered.length - visibleCount !== 1 ? 's' : ''})
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', padding: '80px 24px' }}
          >
            <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>
              {hasActiveFilters ? '🔍' : '📅'}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun événement pour le moment'}
            </h3>
            <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 28px' }}>
              {hasActiveFilters
                ? "Aucun événement ne correspond à vos critères. Essayez d'autres filtres."
                : 'Les premiers marchés et salons arrivent bientôt. Inscrivez-vous pour être parmi les premiers notifiés.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <Link href="/register" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                Créer un compte gratuit
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888888' }}>Chargement...</p>
      </div>
    }>
      <EventsContent />
    </Suspense>
  )
}
