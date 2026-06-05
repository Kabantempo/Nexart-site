'use client'

import { useCreators } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, ArrowRight, Search, Filter, X } from 'lucide-react'
import { useState, useMemo } from 'react'

const DISCIPLINES = [
  'Tatouage', 'Céramique', 'Gravure', 'Joaillerie', 'Bijoux', 'Illustration',
  'Textile', 'Maroquinerie', 'Sculpture', 'Photographie', 'Peinture', 'Poterie',
  'Broderie', 'Lutherie', 'Verrerie', 'Reliure', 'Cosmétique naturelle',
  'Savonnerie', 'Coutellerie', 'Bougies', 'Macramé', 'Origami', 'Calligraphie', 'Sérigraphie',
]

const TRAVEL_RADIUS = [
  { value: '', label: 'Tout rayon' },
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: 'national', label: 'National' },
]

export default function CreatorsPage() {
  const { creators, loading, error } = useCreators()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDiscipline, setSelectedDiscipline] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedRadius, setSelectedRadius] = useState('')

  const regions = useMemo(() => {
    const all = creators.map((c) => (c as { region?: string }).region).filter(Boolean) as string[]
    return Array.from(new Set(all)).sort()
  }, [creators])

  const filtered = useMemo(() => {
    return creators.filter((creator) => {
      const matchSearch =
        !searchTerm ||
        creator.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.city?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchDiscipline =
        !selectedDiscipline ||
        creator.disciplines?.some((d: string) => d.toLowerCase() === selectedDiscipline.toLowerCase())

      const matchRegion =
        !selectedRegion ||
        (creator as { region?: string }).region === selectedRegion

      const matchRadius =
        !selectedRadius ||
        creator.travel_radius === selectedRadius

      return matchSearch && matchDiscipline && matchRegion && matchRadius
    })
  }, [creators, searchTerm, selectedDiscipline, selectedRegion, selectedRadius])

  const hasFilters = searchTerm || selectedDiscipline || selectedRegion || selectedRadius

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDiscipline('')
    setSelectedRegion('')
    setSelectedRadius('')
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888', fontSize: '16px' }}>Chargement des créateurs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Erreur : {error.message}</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            Créateurs & Artisans
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '32px', lineHeight: '1.6' }}>
            {filtered.length} créateur{filtered.length !== 1 ? 's' : ''} talentueux à travers la France
          </p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '40px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={20} color="#888888" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Rechercher un créateur ou une ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                fontSize: '15px',
                color: '#1A1A1A',
                boxSizing: 'border-box',
                transition: 'all 300ms ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {/* Discipline filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#888888" />
            <select
              value={selectedDiscipline}
              onChange={(e) => setSelectedDiscipline(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: selectedDiscipline ? '#F0F0FF' : '#FFFFFF',
                color: selectedDiscipline ? '#6366F1' : '#888888',
                fontSize: '15px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 300ms ease',
              }}
            >
              <option value="">Toutes disciplines</option>
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Region filter */}
          {regions.length > 0 && (
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: selectedRegion ? '#F0F0FF' : '#FFFFFF',
                color: selectedRegion ? '#6366F1' : '#888888',
                fontSize: '15px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 300ms ease',
              }}
            >
              <option value="">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {/* Radius filter */}
          <select
            value={selectedRadius}
            onChange={(e) => setSelectedRadius(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              backgroundColor: selectedRadius ? '#F0F0FF' : '#FFFFFF',
              color: selectedRadius ? '#6366F1' : '#888888',
              fontSize: '15px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 300ms ease',
            }}
          >
            {TRAVEL_RADIUS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#888888',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 300ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#888888' }}
            >
              <X size={14} />
              Effacer
            </button>
          )}
        </div>

        {/* Creators Grid */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filtered.map((creator, idx) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              >
                <Link
                  href={`/creators/${creator.id}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    transition: 'all 300ms ease',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Avatar */}
                  <div style={{ width: '100%', height: '200px', backgroundColor: '#F5F5F7', overflow: 'hidden', position: 'relative' }}>
                    {creator.avatar_url ? (
                      <Image src={creator.avatar_url} alt={creator.full_name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
                        <span style={{ fontSize: '48px', color: '#FFFFFF', fontWeight: '700' }}>
                          {creator.full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                      {creator.full_name}
                    </h3>

                    {creator.bio && (
                      <p style={{ fontSize: '14px', color: '#888888', lineHeight: '1.5', marginBottom: '12px' }}>
                        {creator.bio.substring(0, 80)}{creator.bio.length > 80 ? '...' : ''}
                      </p>
                    )}

                    {/* Disciplines */}
                    {creator.disciplines?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {creator.disciplines.slice(0, 3).map((d: string) => (
                          <span key={d} style={{ padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#F0F0FF', color: '#6366F1', fontSize: '12px', fontWeight: '500' }}>
                            {d}
                          </span>
                        ))}
                        {creator.disciplines.length > 3 && (
                          <span style={{ padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#F5F5F7', color: '#888888', fontSize: '12px' }}>
                            +{creator.disciplines.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {creator.city && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                        <MapPin size={14} color="#6366F1" />
                        <span style={{ fontSize: '13px', color: '#888888' }}>
                          {creator.city}{(creator as { region?: string }).region ? ` · ${(creator as { region?: string }).region}` : ''}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', fontSize: '14px', fontWeight: '600' }}>
                      Voir le profil <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <Users size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '18px', color: '#888888', marginBottom: '8px' }}>Aucun créateur trouvé</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
