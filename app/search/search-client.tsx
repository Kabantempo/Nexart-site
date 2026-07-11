'use client'

import { Suspense, useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEvents, useCreators } from '@/lib/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Calendar, MapPin, Users, ArrowRight, Filter, X, SlidersHorizontal } from 'lucide-react'

type Tab = 'all' | 'events' | 'creators'

const DISCIPLINES = ['Peinture', 'Sculpture', 'Céramique', 'Bijoux', 'Textile', 'Maroquinerie', 'Illustration', 'Photographie', 'Gravure', 'Bois', 'Verre', 'Broderie', 'Tricot', 'Savons', 'Cosmétiques', 'Alimentation', 'Autre']
const REGIONS = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Provence-Alpes-Côte d\'Azur', 'Hauts-de-France', 'Bretagne', 'Normandie', 'Grand Est', 'Pays de la Loire', 'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Corse']

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { events, loading: eventsLoading } = useEvents()
  const { creators, loading: creatorsLoading } = useCreators()
  const isLoading = eventsLoading || creatorsLoading

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [tab, setTab] = useState<Tab>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filterDiscipline, setFilterDiscipline] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterAvailable, setFilterAvailable] = useState(false)
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const hasActiveFilters = filterDiscipline || filterRegion || filterAvailable || filterDateFrom || filterDateTo

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    const qs = params.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [query, router])

  const q = query.toLowerCase().trim()

  const matchedEvents = useMemo(() => {
    return events.filter((e) => {
      const textMatch = !q ||
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.city?.toLowerCase().includes(q) ||
        e.region?.toLowerCase().includes(q) ||
        e.discipline_tags?.some((d: string) => d.toLowerCase().includes(q))
      const regionMatch = !filterRegion || e.region?.toLowerCase().includes(filterRegion.toLowerCase())
      const disciplineMatch = !filterDiscipline || e.discipline_tags?.some((d: string) => d.toLowerCase().includes(filterDiscipline.toLowerCase()))
      const dateFromMatch = !filterDateFrom || new Date(e.start_date) >= new Date(filterDateFrom)
      const dateToMatch = !filterDateTo || new Date(e.start_date) <= new Date(filterDateTo)
      return textMatch && regionMatch && disciplineMatch && dateFromMatch && dateToMatch
    })
  }, [events, q, filterRegion, filterDiscipline, filterDateFrom, filterDateTo])

  const matchedCreators = useMemo(() => {
    return creators.filter((c) => {
      const textMatch = !q ||
        c.full_name?.toLowerCase().includes(q) ||
        c.bio?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.disciplines?.some((d: string) => d.toLowerCase().includes(q))
      const regionMatch = !filterRegion || c.region?.toLowerCase().includes(filterRegion.toLowerCase())
      const disciplineMatch = !filterDiscipline || c.disciplines?.some((d: string) => d.toLowerCase().includes(filterDiscipline.toLowerCase()))
      const availableMatch = !filterAvailable || c.open_to_collab === true
      return textMatch && regionMatch && disciplineMatch && availableMatch
    })
  }, [creators, q, filterRegion, filterDiscipline, filterAvailable])

  const totalResults = tab === 'all' ? matchedEvents.length + matchedCreators.length
    : tab === 'events' ? matchedEvents.length : matchedCreators.length

  const clearFilters = () => {
    setFilterDiscipline('')
    setFilterRegion('')
    setFilterAvailable(false)
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const tabStyle = (t: Tab) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: tab === t ? '#6366F1' : 'transparent',
    color: tab === t ? '#FFFFFF' : '#6B7280',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 200ms ease',
    fontFamily: 'inherit',
  })

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>Recherche</h1>
          <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '32px' }}>
            {q || hasActiveFilters ? `${totalResults} résultat${totalResults !== 1 ? 's' : ''}${q ? ` pour "${query}"` : ''}` : 'Recherchez des événements ou des créateurs'}
          </p>
        </motion.div>

        {/* Search bar + Filter toggle */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={22} color="#6B7280" style={{ position: 'absolute', left: '16px', top: '14px' }} />
            <input
              type="text"
              placeholder="Rechercher un événement, une ville, une discipline..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              aria-label="Recherche"
              style={{ width: '100%', padding: '14px 16px 14px 48px', borderRadius: '12px', border: '2px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '18px', color: '#1A1A1A', boxSizing: 'border-box', transition: 'all 300ms ease', fontFamily: 'inherit' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.1)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filtres avancés"
            aria-expanded={showFilters}
            style={{
              padding: '14px 20px', borderRadius: '12px', border: '2px solid',
              borderColor: hasActiveFilters ? '#6366F1' : '#E5E7EB',
              backgroundColor: hasActiveFilters ? '#EEF2FF' : '#FFFFFF',
              color: hasActiveFilters ? '#6366F1' : '#1A1A1A',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap'
            }}
          >
            <SlidersHorizontal size={18} />
            Filtres {hasActiveFilters && <span style={{ backgroundColor: '#6366F1', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '12px' }}>{[filterDiscipline, filterRegion, filterAvailable, filterDateFrom, filterDateTo].filter(Boolean).length}</span>}
          </button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Discipline */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>Discipline</label>
                  <select value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)} aria-label="Filtrer par discipline"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', backgroundColor: '#FFFFFF' }}>
                    <option value="">Toutes les disciplines</option>
                    {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {/* Région */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>Région</label>
                  <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} aria-label="Filtrer par région"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', backgroundColor: '#FFFFFF' }}>
                    <option value="">Toutes les régions</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {/* Date from (events only) */}
                {(tab === 'all' || tab === 'events') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>À partir du</label>
                    <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} aria-label="Date de début"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', backgroundColor: '#FFFFFF' }} />
                  </div>
                )}
                {/* Dispo créateurs */}
                {(tab === 'all' || tab === 'creators') && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#1A1A1A' }}>
                      <input type="checkbox" checked={filterAvailable} onChange={e => setFilterAvailable(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366F1', cursor: 'pointer' }} />
                      Disponibles uniquement
                    </label>
                  </div>
                )}
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: '#FF6B6B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0 }}>
                  <X size={14} /> Effacer les filtres
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', padding: '4px', backgroundColor: '#F5F5F7', borderRadius: '10px', width: 'fit-content' }}>
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

        {/* Events */}
        {(tab === 'all' || tab === 'events') && matchedEvents.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            {tab === 'all' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A' }}>Événements ({matchedEvents.length})</h2>
                <Link href="/events" style={{ color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {(tab === 'all' ? matchedEvents.slice(0, 6) : matchedEvents).map((event, idx) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Link href={`/events/${event.id}`}
                    style={{ display: 'block', textDecoration: 'none', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', backgroundColor: '#FFFFFF', transition: 'all 300ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ width: '100%', height: '160px', backgroundColor: '#F5F5F7', position: 'relative' }}>
                      {event.cover_image
                        ? <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={40} color="rgba(255,255,255,0.7)" /></div>
                      }
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>{event.title}</h3>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {event.start_date && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} color="#6366F1" /><span style={{ fontSize: '12px', color: '#6B7280' }}>{new Date(event.start_date).toLocaleDateString('fr-FR')}</span></div>}
                        {event.city && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#6366F1" /><span style={{ fontSize: '12px', color: '#6B7280' }}>{event.city}</span></div>}
                        {event.region && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Filter size={12} color="#6B7280" /><span style={{ fontSize: '12px', color: '#6B7280' }}>{event.region}</span></div>}
                      </div>
                      {event.discipline_tags?.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {event.discipline_tags.slice(0, 3).map((d: string) => (
                            <span key={d} style={{ padding: '2px 8px', backgroundColor: '#EEF2FF', color: '#6366F1', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Creators */}
        {(tab === 'all' || tab === 'creators') && matchedCreators.length > 0 && (
          <div>
            {tab === 'all' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A' }}>Créateurs ({matchedCreators.length})</h2>
                <Link href="/creators" style={{ color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {(tab === 'all' ? matchedCreators.slice(0, 6) : matchedCreators).map((creator, idx) => (
                <motion.div key={creator.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Link href={`/creators/${creator.id}`}
                    style={{ display: 'flex', gap: '12px', padding: '16px', textDecoration: 'none', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', transition: 'all 300ms ease', alignItems: 'center' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(99,102,241,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F5F7', flexShrink: 0 }}>
                      {creator.avatar_url
                        ? <Image src={creator.avatar_url} alt={creator.full_name || 'Créateur'} fill style={{ objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '20px', color: '#FFFFFF', fontWeight: 700 }}>{creator.full_name?.charAt(0) || '?'}</span></div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{creator.full_name}</p>
                        {creator.open_to_collab && <span style={{ padding: '1px 6px', backgroundColor: '#ECFDF5', color: '#10B981', borderRadius: '10px', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>Dispo</span>}
                      </div>
                      {creator.disciplines?.length > 0 && <p style={{ fontSize: '12px', color: '#6366F1', margin: '0 0 2px' }}>{creator.disciplines.slice(0, 2).join(' · ')}</p>}
                      {creator.city && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} color="#6B7280" /><span style={{ fontSize: '12px', color: '#6B7280' }}>{creator.city}{creator.region ? `, ${creator.region}` : ''}</span></div>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!isLoading && (q || hasActiveFilters) && totalResults === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Search size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', color: '#6B7280' }}>Aucun résultat{q ? ` pour "${query}"` : ''}</p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>Essayez avec des mots-clés différents ou ajustez les filtres</p>
            {hasActiveFilters && <button onClick={clearFilters} style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Effacer les filtres</button>}
          </div>
        )}

        {!isLoading && !q && !hasActiveFilters && totalResults === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Search size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', color: '#6B7280' }}>Commencez à taper pour rechercher</p>
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
