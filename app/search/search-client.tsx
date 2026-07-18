'use client'

import { Suspense, useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEvents, useCreators } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Calendar, MapPin, Users, ArrowRight } from 'lucide-react'

type Tab = 'all' | 'events' | 'creators'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { events, loading: eventsLoading } = useEvents()
  const { creators, loading: creatorsLoading } = useCreators()
  const isLoading = eventsLoading || creatorsLoading
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [tab, setTab] = useState<Tab>('all')

  // Keep URL in sync with query
  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [query, router])

  const q = query.toLowerCase()

  const matchedEvents = useMemo(() => {
    if (!q) return events
    return events.filter((e) =>
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.city?.toLowerCase().includes(q) ||
      e.region?.toLowerCase().includes(q) ||
      e.discipline_tags?.some((d: string) => d.toLowerCase().includes(q))
    )
  }, [events, q])

  const matchedCreators = useMemo(() => {
    if (!q) return creators
    return creators.filter((c) =>
      c.full_name?.toLowerCase().includes(q) ||
      c.bio?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.disciplines?.some((d: string) => d.toLowerCase().includes(q))
    )
  }, [creators, q])

  const totalResults = (tab === 'all' ? matchedEvents.length + matchedCreators.length :
    tab === 'events' ? matchedEvents.length : matchedCreators.length)

  const tabStyle = (t: Tab) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: tab === t ? '#6366F1' : 'transparent',
    color: tab === t ? '#FFFFFF' : 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    fontFamily: 'inherit',
  })

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Recherche
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            {q ? `${totalResults} résultat${totalResults !== 1 ? 's' : ''} pour "${query}"` : 'Recherchez des événements ou des créateurs'}
          </p>
        </motion.div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <Search size={22} color="#888888" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input
            type="text"
            placeholder="Rechercher un événement, une ville, une discipline..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '12px',
              border: '2px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              fontSize: '18px',
              color: 'var(--text-primary)',
              boxSizing: 'border-box',
              transition: 'all 300ms ease',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', padding: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', width: 'fit-content' }}>
          <button onClick={() => setTab('all')} style={tabStyle('all')}>Tout ({matchedEvents.length + matchedCreators.length})</button>
          <button onClick={() => setTab('events')} style={tabStyle('events')}>
            <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Événements ({matchedEvents.length})
          </button>
          <button onClick={() => setTab('creators')} style={tabStyle('creators')}>
            <Users size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
            Créateurs ({matchedCreators.length})
          </button>
        </div>

        {/* Events section */}
        {(tab === 'all' || tab === 'events') && matchedEvents.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            {tab === 'all' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Événements ({matchedEvents.length})
                </h2>
                <Link href="/events" style={{ color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {(tab === 'all' ? matchedEvents.slice(0, 6) : matchedEvents).map((event, idx) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Link
                    href={`/events/${event.id}`}
                    style={{ display: 'block', textDecoration: 'none', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', backgroundColor: 'var(--bg-primary)', transition: 'all 300ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ width: '100%', height: '160px', backgroundColor: 'var(--bg-secondary)', position: 'relative' }}>
                      {event.cover_image ? (
                        <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Calendar size={40} color="rgba(255,255,255,0.7)" />
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{event.title}</h3>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {event.start_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} color="#6366F1" />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {new Date(event.start_date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {event.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#6366F1" />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{event.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Creators section */}
        {(tab === 'all' || tab === 'creators') && matchedCreators.length > 0 && (
          <div>
            {tab === 'all' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Créateurs ({matchedCreators.length})
                </h2>
                <Link href="/creators" style={{ color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
              {(tab === 'all' ? matchedCreators.slice(0, 6) : matchedCreators).map((creator, idx) => (
                <motion.div key={creator.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Link
                    href={`/creators/${creator.id}`}
                    style={{ display: 'flex', gap: '12px', padding: '16px', textDecoration: 'none', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', transition: 'all 300ms ease', alignItems: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', position: 'relative', backgroundColor: 'var(--bg-secondary)', flexShrink: 0 }}>
                      {creator.avatar_url ? (
                        <Image src={creator.avatar_url} alt={creator.full_name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '20px', color: '#FFFFFF', fontWeight: '700' }}>{creator.full_name?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>{creator.full_name}</p>
                      {creator.disciplines?.length > 0 && (
                        <p style={{ fontSize: '12px', color: '#6366F1' }}>{creator.disciplines.slice(0, 2).join(' · ')}</p>
                      )}
                      {creator.city && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={12} color="#888888" />
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{creator.city}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && q && totalResults === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Search size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Aucun résultat pour "{query}"</p>
            <p style={{ fontSize: '14px', color: '#AAAAAA', marginTop: '8px' }}>Essayez avec des mots-clés différents</p>
          </div>
        )}

        {!isLoading && !q && totalResults === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Search size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Commencez à taper pour rechercher</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPageClient() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
