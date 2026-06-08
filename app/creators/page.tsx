'use client'

import { useCreators } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ITEMS_PER_PAGE = 12

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

function CreatorsContent() {
  const { creators, loading, error } = useCreators()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [cityFilter, setCityFilter] = useState('all')
  const [disciplineFilter, setDisciplineFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'alpha' | 'newest'>('alpha')
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearchTerm(q)
  }, [searchParams])

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE)
  }, [searchTerm, cityFilter, disciplineFilter, sortOrder])

  const uniqueCities = [...new Set(creators.map((c) => c.city).filter(Boolean))].sort() as string[]
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

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const hasActiveFilters = cityFilter !== 'all' || disciplineFilter !== 'all' || sortOrder !== 'alpha' || !!searchTerm

  const resetFilters = () => {
    setCityFilter('all')
    setDisciplineFilter('all')
    setSortOrder('alpha')
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
          <div style={{ width: '38%', height: '52px', backgroundColor: '#F3F4F6', borderRadius: '10px', marginBottom: '16px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ width: '52%', height: '22px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '32px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '48px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '12px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '40px', width: '140px', backgroundColor: '#F3F4F6', borderRadius: '8px', animation: 'pulse 1.6s ease-in-out infinite' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', animation: 'pulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#F3F4F6' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '6px', marginBottom: '10px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '75%' }} />
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
            Créateurs & Artisans
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '32px', lineHeight: '1.6' }}>
            {creators.length} créateur{creators.length !== 1 ? 's' : ''} talentueu{creators.length !== 1 ? 'x' : 'x'} à travers la France
          </p>
        </motion.div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={20} color="#888888" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input
            type="text"
            placeholder="Rechercher un créateur, une discipline, une ville..."
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

          {uniqueDisciplines.length > 0 && (
            <select value={disciplineFilter} onChange={(e) => setDisciplineFilter(e.target.value)} style={SELECT_STYLE}>
              <option value="all">Toutes les disciplines</option>
              {uniqueDisciplines.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'alpha' | 'newest')} style={SELECT_STYLE}>
            <option value="alpha">Alphabétique</option>
            <option value="newest">Plus récents</option>
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
            : `${Math.min(visibleCount, filtered.length)} / ${filtered.length} créateur${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {visible.map((creator, idx) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={`/creators/${creator.id}`}
                    style={{
                      display: 'block', textDecoration: 'none', borderRadius: '12px',
                      border: '1px solid #E5E7EB', overflow: 'hidden',
                      backgroundColor: '#FFFFFF', transition: 'all 300ms ease',
                      height: '100%', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(99,102,241,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    {/* Avatar */}
                    <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#F5F5F7', overflow: 'hidden', position: 'relative' }}>
                      {creator.avatar_url ? (
                        <Image src={creator.avatar_url} alt={creator.full_name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
                          <Users size={48} color="#FFFFFF" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' }}>
                        {creator.full_name}
                      </h3>

                      {/* Disciplines */}
                      {creator.disciplines?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {creator.disciplines.slice(0, 2).map((d) => (
                            <span key={d} style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                              {d}
                            </span>
                          ))}
                          {creator.disciplines.length > 2 && (
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                              +{creator.disciplines.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {creator.bio && (
                        <p style={{ fontSize: '13px', color: '#888888', lineHeight: '1.5', marginBottom: '10px' }}>
                          {creator.bio.substring(0, 80)}…
                        </p>
                      )}

                      {creator.city && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                          <MapPin size={13} color="#6366F1" />
                          <span style={{ fontSize: '12px', color: '#888888' }}>{creator.city}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '13px', fontWeight: '600' }}>
                        Voir le profil <ArrowRight size={14} />
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
              {hasActiveFilters ? '🔍' : '🎨'}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun créateur inscrit pour le moment'}
            </h3>
            <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 28px' }}>
              {hasActiveFilters
                ? "Aucun créateur ne correspond à vos critères. Essayez d'autres filtres."
                : 'Les premiers artisans et créateurs arrivent bientôt. Rejoignez la communauté dès maintenant.'}
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
                Rejoindre en tant que créateur
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function CreatorsPage() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888888' }}>Chargement...</p>
      </div>
    }>
      <CreatorsContent />
    </Suspense>
  )
}
