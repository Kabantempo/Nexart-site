'use client'

import { useCreators } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, ArrowRight, Search, X, ArrowUpAZ, Clock } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const ITEMS_PER_PAGE = 12

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '20px',
      backgroundColor: '#EEF2FF', color: '#4F46E5',
      fontSize: '12px', fontWeight: '600',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#4F46E5', lineHeight: 1 }}
      >
        <X size={11} />
      </button>
    </span>
  )
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
  const progressPct = filtered.length > 0 ? (Math.min(visibleCount, filtered.length) / filtered.length) * 100 : 100

  const resetFilters = () => {
    setCityFilter('all'); setDisciplineFilter('all'); setSortOrder('alpha'); setSearchTerm('')
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
          <div style={{ width: '38%', height: '52px', backgroundColor: '#F3F4F6', borderRadius: '10px', marginBottom: '12px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ width: '32%', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '36px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '50px', backgroundColor: '#F3F4F6', borderRadius: '12px', marginBottom: '16px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '96px', backgroundColor: '#F3F4F6', borderRadius: '16px', marginBottom: '36px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', animation: 'pulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.08}s` }}>
                <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#F3F4F6' }} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '6px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Une erreur est survenue. Réessayez dans quelques instants.</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 80px' }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#1A1A1A', marginBottom: '8px', lineHeight: '1.1' }}>
            Créateurs & Artisans
          </h1>
          <p style={{ fontSize: '17px', color: '#6B7280', marginBottom: '40px', lineHeight: '1.6' }}>
            {creators.length} créateur{creators.length !== 1 ? 's' : ''} talentueux partout en France
          </p>
        </motion.div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Nom, discipline, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '14px 44px 14px 44px',
              borderRadius: '12px', border: '1.5px solid #E5E7EB',
              fontSize: '15px', color: '#1A1A1A', boxSizing: 'border-box',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)', outline: 'none',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366F1'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12), 0 1px 4px rgba(0,0,0,0.05)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '4px' }}
            >
              <X size={16} color="#9CA3AF" />
            </button>
          )}
        </div>

        {/* Filter card */}
        <div style={{ backgroundColor: '#F9FAFB', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', border: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>

            {/* City select */}
            {uniqueCities.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
                  Ville
                </p>
                <div style={{ position: 'relative' }}>
                  <MapPin size={13} color={cityFilter !== 'all' ? '#6366F1' : '#9CA3AF'} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    style={{
                      paddingLeft: '28px', paddingRight: '28px', paddingTop: '9px', paddingBottom: '9px',
                      borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${cityFilter !== 'all' ? '#6366F1' : '#E5E7EB'}`,
                      backgroundColor: cityFilter !== 'all' ? '#EEF2FF' : '#FFFFFF',
                      color: cityFilter !== 'all' ? '#4F46E5' : '#374151',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                      fontWeight: cityFilter !== 'all' ? '600' : '400',
                    }}
                  >
                    <option value="all">Toutes les villes</option>
                    {uniqueCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Discipline select */}
            {uniqueDisciplines.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
                  Discipline
                </p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', pointerEvents: 'none' }}>🎨</span>
                  <select
                    value={disciplineFilter}
                    onChange={(e) => setDisciplineFilter(e.target.value)}
                    style={{
                      paddingLeft: '28px', paddingRight: '28px', paddingTop: '9px', paddingBottom: '9px',
                      borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${disciplineFilter !== 'all' ? '#6366F1' : '#E5E7EB'}`,
                      backgroundColor: disciplineFilter !== 'all' ? '#EEF2FF' : '#FFFFFF',
                      color: disciplineFilter !== 'all' ? '#4F46E5' : '#374151',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                      fontWeight: disciplineFilter !== 'all' ? '600' : '400',
                    }}
                  >
                    <option value="all">Toutes les disciplines</option>
                    {uniqueDisciplines.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Sort toggle */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>
                Trier par
              </p>
              <div style={{ display: 'flex', borderRadius: '8px', border: '1.5px solid #E5E7EB', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                <button
                  onClick={() => setSortOrder('alpha')}
                  style={{
                    padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit',
                    backgroundColor: sortOrder === 'alpha' ? '#6366F1' : 'transparent',
                    color: sortOrder === 'alpha' ? '#FFFFFF' : '#4B5563',
                    transition: 'all 150ms ease', fontWeight: '500',
                  }}
                >
                  <ArrowUpAZ size={13} /> A → Z
                </button>
                <button
                  onClick={() => setSortOrder('newest')}
                  style={{
                    padding: '7px 12px', border: 'none', cursor: 'pointer', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit',
                    backgroundColor: sortOrder === 'newest' ? '#6366F1' : 'transparent',
                    color: sortOrder === 'newest' ? '#FFFFFF' : '#4B5563',
                    transition: 'all 150ms ease', fontWeight: '500',
                    borderLeft: '1px solid #E5E7EB',
                  }}
                >
                  <Clock size={13} /> Récents
                </button>
              </div>
            </div>
          </div>

          {/* Active chips */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EBEBEB', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '500' }}>Actifs :</span>
              {searchTerm && <ActiveChip label={`"${searchTerm}"`} onRemove={() => setSearchTerm('')} />}
              {cityFilter !== 'all' && <ActiveChip label={cityFilter} onRemove={() => setCityFilter('all')} />}
              {disciplineFilter !== 'all' && <ActiveChip label={disciplineFilter} onRemove={() => setDisciplineFilter('all')} />}
              {sortOrder !== 'alpha' && <ActiveChip label="Récents en premier" onRemove={() => setSortOrder('alpha')} />}
              <button
                onClick={resetFilters}
                style={{ fontSize: '12px', color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '0 4px', fontFamily: 'inherit', marginLeft: '2px' }}
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Results header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            <span style={{ fontWeight: '700', color: '#1A1A1A', fontSize: '16px' }}>{filtered.length}</span>
            {' '}créateur{filtered.length !== 1 ? 's' : ''}
            {hasActiveFilters && <span style={{ color: '#9CA3AF' }}> · filtré{filtered.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>

        {/* Grid */}
        {visible.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {visible.map((creator, idx) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                  style={{ height: '100%' }}
                >
                  <Link
                    href={`/creators/${creator.id}`}
                    style={{
                      display: 'flex', flexDirection: 'column',
                      textDecoration: 'none', borderRadius: '16px',
                      border: '1px solid #E5E7EB', overflow: 'hidden',
                      backgroundColor: '#FFFFFF', height: '100%', cursor: 'pointer',
                      transition: 'border-color 250ms ease, box-shadow 250ms ease, transform 250ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#A5B4FC'
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.12)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#F5F5F7', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                      {creator.avatar_url ? (
                        <Image src={creator.avatar_url} alt={creator.full_name} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                        }}>
                          <span style={{ fontSize: '56px', color: 'rgba(255,255,255,0.8)', fontWeight: '700', userSelect: 'none' }}>
                            {creator.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px', lineHeight: '1.3' }}>
                        {creator.full_name}
                      </h3>

                      {/* Disciplines */}
                      {creator.disciplines?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                          {creator.disciplines.slice(0, 2).map((d) => (
                            <span key={d} style={{
                              fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px',
                              backgroundColor: '#EEF2FF', color: '#4F46E5',
                            }}>
                              {d}
                            </span>
                          ))}
                          {creator.disciplines.length > 2 && (
                            <span style={{
                              fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px',
                              backgroundColor: '#F3F4F6', color: '#6B7280',
                            }}>
                              +{creator.disciplines.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {creator.bio && (
                        <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.5', marginBottom: '12px', flex: 1 }}>
                          {creator.bio.substring(0, 80)}…
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6366F1', fontSize: '13px', fontWeight: '700' }}>
                          Voir le profil <ArrowRight size={13} />
                        </div>
                        {creator.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#9CA3AF" />
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{creator.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '56px' }}>
                <div style={{ maxWidth: '220px', margin: '0 auto 14px' }}>
                  <div style={{ height: '3px', backgroundColor: '#E5E7EB', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
                    <motion.div
                      style={{ height: '100%', backgroundColor: '#6366F1', borderRadius: '99px' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {Math.min(visibleCount, filtered.length)} / {filtered.length} créateurs
                  </p>
                </div>
                <button
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                  style={{
                    padding: '12px 36px', borderRadius: '10px', border: '2px solid #6366F1',
                    backgroundColor: 'transparent', color: '#6366F1', fontSize: '14px',
                    fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#6366F1'; e.currentTarget.style.color = '#FFFFFF' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6366F1' }}
                >
                  Voir {Math.min(ITEMS_PER_PAGE, filtered.length - visibleCount)} de plus
                </button>
              </div>
            )}

            {!hasMore && filtered.length > ITEMS_PER_PAGE && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#9CA3AF', marginTop: '40px' }}>
                Tous les {filtered.length} créateurs sont affichés
              </p>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
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
            <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto 28px' }}>
              {hasActiveFilters
                ? "Aucun créateur ne correspond à vos critères. Essayez d'autres filtres."
                : 'Les premiers artisans et créateurs arrivent bientôt. Rejoignez la communauté dès maintenant.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                style={{ padding: '10px 24px', borderRadius: '8px', border: '1.5px solid #6366F1', backgroundColor: 'transparent', color: '#6366F1', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Réinitialiser les filtres
              </button>
            ) : (
              <Link href="/register" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '10px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
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
