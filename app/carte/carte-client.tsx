'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Event } from '@/lib/types'
import { MapPin, Calendar, Users, SlidersHorizontal, X, Euro } from 'lucide-react'

const EVENT_TYPES = [
  { key: 'all',       label: 'Tous' },
  { key: 'popup',     label: 'Pop-up' },
  { key: 'salon',     label: 'Salon' },
  { key: 'fair',      label: 'Foire' },
  { key: 'seasonal',  label: 'Saisonnier' },
  { key: 'permanent', label: 'Permanent' },
] as const

type EventWithOccupancy = Event & { accepted_count?: number; remaining_spots?: number }

export default function CarteClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const [events, setEvents] = useState<EventWithOccupancy[]>([])
  const [selected, setSelected] = useState<EventWithOccupancy | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('events')
      .select('*')
      .eq('status', 'published')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .then(async ({ data }) => {
        if (!data?.length) { setLoaded(true); return }

        // Récupérer accepted counts
        const { data: apps } = await supabase.from('applications')
          .select('event_id')
          .in('event_id', data.map(e => e.id))
          .eq('status', 'accepted')

        const countMap: Record<string, number> = {}
        apps?.forEach(a => { countMap[a.event_id] = (countMap[a.event_id] || 0) + 1 })

        const enriched = data.map(e => ({
          ...e,
          accepted_count: countMap[e.id] || 0,
          remaining_spots: Math.max(e.stand_count - (countMap[e.id] || 0), 0),
        }))
        setEvents(enriched)
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return

    let L: typeof import('leaflet')
    import('leaflet').then(mod => {
      L = mod.default
      // Fix default icons (Webpack / Next.js bundle issue)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [46.6, 2.3], zoom: 6, zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = { map, L, markers: [] as unknown[] }
    })

    return () => {
      if (mapInstanceRef.current) {
        const { map } = mapInstanceRef.current as { map: { remove: () => void } }
        map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [loaded])

  // Mettre à jour les marqueurs quand les events ou le filtre changent
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const { map, L, markers } = mapInstanceRef.current as {
      map: import('leaflet').Map
      L: typeof import('leaflet')
      markers: import('leaflet').Marker[]
    }

    // Supprimer anciens marqueurs
    markers.forEach(m => m.remove())
    const newMarkers: import('leaflet').Marker[] = []

    const filtered = typeFilter === 'all' ? events : events.filter(e => e.event_type === typeFilter)

    filtered.forEach(event => {
      if (!event.lat || !event.lng) return

      const remaining = event.remaining_spots ?? 0
      const isFull = event.stand_count > 0 && remaining === 0
      const isAlmostFull = !isFull && event.stand_count > 0 && remaining <= 3

      const markerColor = isFull ? '#9CA3AF' : isAlmostFull ? '#F59E0B' : '#111827'

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: ${markerColor}; border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
        "><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })

      const marker = L.marker([event.lat, event.lng], { icon })
        .addTo(map)
        .on('click', () => setSelected(event))

      newMarkers.push(marker)
    })

    ;(mapInstanceRef.current as { markers: import('leaflet').Marker[] }).markers = newMarkers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, typeFilter, mapInstanceRef.current])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', backgroundColor: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={18} color="#FFFFFF" />
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF' }}>Carte des événements</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '4px' }}>{events.length} événements</span>
        </div>

        {/* Filtres type */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          <SlidersHorizontal size={14} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginTop: '2px' }} />
          {EVENT_TYPES.map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              style={{
                padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600',
                whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: typeFilter === t.key ? '#FFFFFF' : 'rgba(255,255,255,0.1)',
                color: typeFilter === t.key ? '#111827' : 'rgba(255,255,255,0.7)',
                border: 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={{ padding: '8px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: '16px', fontSize: '11px', flexShrink: 0 }}>
        {[
          { color: '#111827', label: 'Places disponibles' },
          { color: '#F59E0B', label: '≤ 3 places restantes' },
          { color: '#9CA3AF', label: 'Complet' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
            <span style={{ color: '#6B7280' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Loader */}
        {!loaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249,250,251,0.8)', zIndex: 1000 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: '#6B7280' }}>Chargement de la carte...</p>
            </div>
          </div>
        )}

        {/* Fiche événement sélectionné */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            width: 'min(380px, 90vw)', backgroundColor: '#FFFFFF', borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', padding: '20px', zIndex: 1000,
          }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <X size={16} color="#9CA3AF" />
            </button>

            {selected.cover_image && (
              <img src={selected.cover_image} alt={selected.title}
                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} />
            )}

            <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 6px' }}>{selected.title}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={11} /> {selected.city}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> {new Date(selected.start_date).toLocaleDateString('fr-FR')}
              </span>
              {selected.stand_count > 0 && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  color: (selected.remaining_spots ?? 0) === 0 ? '#9CA3AF' : (selected.remaining_spots ?? 0) <= 3 ? '#F59E0B' : '#10B981',
                  fontWeight: '600',
                }}>
                  <Users size={11} />
                  {(selected.remaining_spots ?? 0) === 0
                    ? 'Complet'
                    : `${selected.remaining_spots} place${(selected.remaining_spots ?? 0) > 1 ? 's' : ''} restante${(selected.remaining_spots ?? 0) > 1 ? 's' : ''}`}
                </span>
              )}
              {selected.stand_price > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Euro size={11} /> {(selected.stand_price / 100).toFixed(0)}€
                </span>
              )}
            </div>

            <Link href={`/events/${selected.id}`}
              style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
              Voir l&apos;événement →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { background: #F3F4F6; }
      `}</style>
    </div>
  )
}
