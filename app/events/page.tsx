'use client'

import { useEvents } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, Search, Filter, X } from 'lucide-react'
import { useState, useMemo } from 'react'

const EVENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'permanent', label: 'Permanent' },
  { value: 'seasonal', label: 'Saisonnier' },
  { value: 'popup', label: 'Pop-up' },
  { value: 'salon', label: 'Salon' },
  { value: 'fair', label: 'Foire' },
]

export default function EventsPage() {
  const { events, loading, error } = useEvents()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')

  const regions = useMemo(() => {
    const all = events.map((e) => e.region).filter(Boolean)
    return ['', ...Array.from(new Set(all)).sort()]
  }, [events])

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const matchSearch =
        !searchTerm ||
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.city?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchType = !selectedType || event.event_type === selectedType
      const matchRegion = !selectedRegion || event.region === selectedRegion
      return matchSearch && matchType && matchRegion
    })
  }, [events, searchTerm, selectedType, selectedRegion])

  const hasFilters = searchTerm || selectedType || selectedRegion

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedType('')
    setSelectedRegion('')
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888', fontSize: '16px' }}>Chargement des événements...</p>
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
            Événements & Marchés
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '32px', lineHeight: '1.6' }}>
            {filtered.length} événement{filtered.length !== 1 ? 's' : ''} artisanaux en France
          </p>
        </motion.div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '40px', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={20} color="#888888" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="Rechercher un événement ou une ville..."
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

          {/* Type filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#888888" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: selectedType ? '#F0F0FF' : '#FFFFFF',
                color: selectedType ? '#6366F1' : '#888888',
                fontSize: '15px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 300ms ease',
              }}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Region filter */}
          {regions.length > 1 && (
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
              {regions.filter(Boolean).map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
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

        {/* Events Grid */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filtered.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.4) }}
              >
                <Link
                  href={`/events/${event.id}`}
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
                  {/* Cover Image */}
                  <div style={{ width: '100%', height: '200px', backgroundColor: '#F5F5F7', overflow: 'hidden', position: 'relative' }}>
                    {event.cover_image ? (
                      <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
                        <Calendar size={48} color="#FFFFFF" />
                      </div>
                    )}
                    {/* Type badge */}
                    {event.event_type && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: 'rgba(99, 102, 241, 0.9)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}>
                        {event.event_type}
                      </div>
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
                          <span style={{ fontSize: '13px', color: '#888888' }}>{event.city || event.location}</span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p style={{ fontSize: '14px', color: '#888888', lineHeight: '1.5', marginBottom: '16px' }}>
                        {event.description.substring(0, 90)}{event.description.length > 90 ? '...' : ''}
                      </p>
                    )}

                    {event.stand_price > 0 && (
                      <p style={{ fontSize: '13px', color: '#6366F1', fontWeight: '600', marginBottom: '12px' }}>
                        Stand à partir de {event.stand_price}€
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', fontSize: '14px', fontWeight: '600' }}>
                      Voir plus <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <p style={{ fontSize: '18px', color: '#888888', marginBottom: '8px' }}>Aucun événement trouvé</p>
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
