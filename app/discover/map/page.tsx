'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Search, Calendar, Palette, Users, ArrowRight, Filter } from 'lucide-react'
import { useEvents, useCreators } from '@/lib/hooks'

const REGIONS = [
  'Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie',
  'Hauts-de-France', 'Grand Est', 'Provence-Alpes-Côte d\'Azur', 'Bretagne',
  'Pays de la Loire', 'Normandie', 'Centre-Val de Loire', 'Bourgogne-Franche-Comté',
]

type Tab = 'events' | 'creators'

export default function DiscoverMapPage() {
  const [searchCity, setSearchCity] = useState('')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('events')
  const [focused, setFocused] = useState(false)

  const { events, loading: evLoading } = useEvents()
  const { creators, loading: crLoading } = useCreators()

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCity = searchCity === '' || e.city?.toLowerCase().includes(searchCity.toLowerCase()) || e.location?.toLowerCase().includes(searchCity.toLowerCase())
      const matchRegion = !selectedRegion || e.region === selectedRegion
      return matchCity && matchRegion
    })
  }, [events, searchCity, selectedRegion])

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      const matchCity = searchCity === '' || c.city?.toLowerCase().includes(searchCity.toLowerCase())
      const matchRegion = !selectedRegion || c.region === selectedRegion
      return matchCity && matchRegion
    })
  }, [creators, searchCity, selectedRegion])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  const osmSrc = useMemo(() => {
    const q = searchCity || selectedRegion || 'France'
    return `https://www.openstreetmap.org/export/embed.html?bbox=-5.2,41.3,9.6,51.1&layer=mapnik&marker=46.2,2.2`
  }, [searchCity, selectedRegion])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '24px 24px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                Découvrir par région
              </h1>
              <p style={{ fontSize: '15px', color: '#64748B' }}>
                {evLoading || crLoading ? 'Chargement…' : `${filteredEvents.length} événements · ${filteredCreators.length} créateurs`}
              </p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color={focused ? '#6366F1' : '#94A3B8'} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Rechercher une ville…"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                  width: '100%', padding: '10px 14px 10px 38px',
                  borderRadius: '10px', fontSize: '14px', color: '#0F172A',
                  border: focused ? '1.5px solid #6366F1' : '1.5px solid #E2E8F0',
                  backgroundColor: '#F8FAFC', outline: 'none', fontFamily: 'inherit',
                  boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  transition: 'all 200ms ease',
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #F1F5F9' }}>
            {(['events', 'creators'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  backgroundColor: 'transparent',
                  color: tab === t ? '#6366F1' : '#64748B',
                  borderBottom: `2px solid ${tab === t ? '#6366F1' : 'transparent'}`,
                  marginBottom: '-2px', transition: 'all 200ms ease',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                {t === 'events' ? <Calendar size={15} /> : <Palette size={15} />}
                {t === 'events' ? `Événements (${filteredEvents.length})` : `Créateurs (${filteredCreators.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>

        {/* Sidebar — Régions */}
        <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} color="#6366F1" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Régions</span>
            </div>
            <div style={{ padding: '8px' }}>
              <button
                onClick={() => setSelectedRegion(null)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px',
                  border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                  backgroundColor: !selectedRegion ? '#EEF2FF' : 'transparent',
                  color: !selectedRegion ? '#4F46E5' : '#374151',
                  transition: 'all 150ms ease',
                }}
              >
                Toutes les régions
              </button>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(selectedRegion === r ? null : r)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                    backgroundColor: selectedRegion === r ? '#EEF2FF' : 'transparent',
                    color: selectedRegion === r ? '#4F46E5' : '#64748B',
                    transition: 'all 150ms ease',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Carte embed */}
          <div style={{ marginTop: '16px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <iframe
              src={osmSrc}
              width="100%"
              height="220"
              style={{ display: 'block', border: 'none' }}
              title="Carte France"
            />
          </div>
        </div>

        {/* Résultats */}
        <div>
          {tab === 'events' && (
            evLoading ? (
              <LoadingGrid />
            ) : filteredEvents.length === 0 ? (
              <EmptyState label="événement" href="/events" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filteredEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{
                      backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0',
                      overflow: 'hidden', transition: 'all 200ms ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {event.cover_image && (
                      <div style={{ height: '130px', overflow: 'hidden' }}>
                        <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '14px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '8px', lineHeight: '1.3' }}>{event.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <MapPin size={12} color="#94A3B8" /> {event.city}{event.region ? `, ${event.region}` : ''}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar size={12} color="#94A3B8" /> {formatDate(event.start_date)}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Users size={12} color="#94A3B8" /> {event.stand_count} stands · {event.stand_price}€
                        </span>
                      </div>
                      <Link
                        href={`/events/${event.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          padding: '8px', borderRadius: '8px',
                          backgroundColor: '#EEF2FF', color: '#4F46E5',
                          fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                        }}
                      >
                        Voir l'événement <ArrowRight size={13} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {tab === 'creators' && (
            crLoading ? (
              <LoadingGrid />
            ) : filteredCreators.length === 0 ? (
              <EmptyState label="créateur" href="/creators" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {filteredCreators.map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    style={{
                      backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0',
                      padding: '20px', textAlign: 'center', transition: 'all 200ms ease',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.full_name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', display: 'block', border: '2px solid #EEF2FF' }} />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '20px', fontWeight: '700', color: '#6366F1' }}>
                        {creator.full_name?.[0] || '?'}
                      </div>
                    )}
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{creator.full_name}</h3>
                    {creator.city && (
                      <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <MapPin size={11} /> {creator.city}
                      </p>
                    )}
                    {creator.disciplines?.slice(0, 2).map((d) => (
                      <span key={d} style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '999px', backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11px', fontWeight: '500', margin: '2px' }}>{d}</span>
                    ))}
                    <div style={{ marginTop: '12px' }}>
                      <Link
                        href={`/creators/${creator.id}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '8px', borderRadius: '8px',
                          backgroundColor: '#EEF2FF', color: '#4F46E5',
                          fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                        }}
                      >
                        Voir le profil <ArrowRight size={13} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: '180px', borderRadius: '14px', backgroundColor: '#F1F5F9', animation: 'pulse 2s infinite' }} />
      ))}
    </div>
  )
}

function EmptyState({ label, href }: { label: string; href: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '16px', border: '1px dashed #CBD5E1', backgroundColor: '#FFFFFF' }}>
      <MapPin size={40} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>Aucun {label} trouvé</h3>
      <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px' }}>Essayez une autre ville ou région.</p>
      <Link href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '8px', backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
        Voir tout <ArrowRight size={14} />
      </Link>
    </div>
  )
}
