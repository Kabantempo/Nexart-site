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

const NAVBAR_H = 58

type EventWithOccupancy = Event & { accepted_count?: number; remaining_spots?: number }

export default function CarteClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<{ map: import('leaflet').Map; L: typeof import('leaflet') } | null>(null)
  const markersRef = useRef<import('leaflet').Marker[]>([])
  const [events, setEvents] = useState<EventWithOccupancy[]>([])
  const [selected, setSelected] = useState<EventWithOccupancy | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    supabase.from('events')
      .select('*')
      .eq('status', 'published')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .then(async ({ data }) => {
        if (!data?.length) { setLoading(false); return }

        const { data: apps } = await supabase.from('applications')
          .select('event_id')
          .in('event_id', data.map(e => e.id))
          .eq('status', 'accepted')

        const countMap: Record<string, number> = {}
        apps?.forEach(a => { countMap[a.event_id] = (countMap[a.event_id] || 0) + 1 })

        setEvents(data.map(e => ({
          ...e,
          accepted_count: countMap[e.id] || 0,
          remaining_spots: Math.max((e.stand_count || 0) - (countMap[e.id] || 0), 0),
        })))
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (loading || !mapRef.current || mapInstanceRef.current) return
    let cancelled = false

    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css' as string),
    ]).then(([mod]) => {
      if (cancelled || !mapRef.current) return
      const L = mod.default

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, { center: [46.6, 2.3], zoom: 6 })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = { map, L }
      setMapReady(true)
    }).catch(() => {})

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove()
        mapInstanceRef.current = null
      }
    }
  }, [loading])

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    const { map, L } = mapInstanceRef.current

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const filtered = typeFilter === 'all' ? events : events.filter(e => e.event_type === typeFilter)

    filtered.forEach(event => {
      if (!event.lat || !event.lng) return

      const remaining = event.remaining_spots ?? 0
      const isFull = (event.stand_count || 0) > 0 && remaining === 0
      const isAlmostFull = !isFull && (event.stand_count || 0) > 0 && remaining <= 3
      const color = isFull ? '#4B5563' : isAlmostFull ? '#F59E0B' : '#6366F1'
      const border = isFull ? '#6B7280' : isAlmostFull ? '#FCD34D' : '#A5B4FC'

      const imgHtml = event.cover_image
        ? `<img src="${event.cover_image}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;position:absolute;inset:0" />`
        : `<svg style="position:absolute;inset:0;margin:auto" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:2.5px solid ${border};box-shadow:0 2px 10px rgba(99,102,241,.4);position:relative;overflow:hidden;cursor:pointer">${imgHtml}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = L.marker([event.lat, event.lng], { icon })
        .addTo(map)
        .on('click', () => setSelected(event))

      markersRef.current.push(marker)
    })
  }, [mapReady, events, typeFilter])

  return (
    <div style={{ position: 'fixed', top: `${NAVBAR_H}px`, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', backgroundColor: '#0F0C29', zIndex: 10 }}>

      {/* Header */}
      <div style={{ padding: '12px 20px', backgroundColor: '#0F0C29', borderBottom: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="#A5B4FC" />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>Carte des événements</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{events.length} événements</span>
        </div>
        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
          <SlidersHorizontal size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: '3px' }} />
          {EVENT_TYPES.map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', border: typeFilter === t.key ? '1px solid rgba(165,180,252,0.5)' : '1px solid rgba(255,255,255,0.08)', backgroundColor: typeFilter === t.key ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: typeFilter === t.key ? '#A5B4FC' : 'rgba(255,255,255,0.5)', transition: 'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div style={{ padding: '6px 16px', backgroundColor: '#0F0C29', borderBottom: '1px solid rgba(99,102,241,0.12)', display: 'flex', gap: '16px', fontSize: '11px', flexShrink: 0 }}>
        {[{ color: '#6366F1', label: 'Places disponibles' }, { color: '#F59E0B', label: '≤ 3 places restantes' }, { color: 'var(--text-secondary)', label: 'Complet' }].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Carte */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {(loading || !mapReady) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,12,41,0.85)', zIndex: 1000 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Chargement de la carte…</p>
            </div>
          </div>
        )}

        {/* Popup événement */}
        {selected && (
          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', width: 'min(360px, 90vw)', backgroundColor: '#1E1B4B', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 1000 }}>
            <button onClick={() => setSelected(null)}
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', padding: '5px', borderRadius: '50%', display: 'flex', zIndex: 1 }}>
              <X size={14} color="rgba(255,255,255,0.7)" />
            </button>

            {selected.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.cover_image} alt={selected.title} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', height: '80px', background: 'linear-gradient(135deg,#1E1B4B,#2D1B69)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={28} color="rgba(165,180,252,0.3)" />
              </div>
            )}

            <div style={{ padding: '14px 16px 16px' }}>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 8px', lineHeight: 1.3 }}>{selected.title}</p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', marginBottom: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)' }}><MapPin size={11} /> {selected.city}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)' }}><Calendar size={11} /> {new Date(selected.start_date).toLocaleDateString('fr-FR')}</span>
                {(selected.stand_count || 0) > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600',
                    color: (selected.remaining_spots ?? 0) === 0 ? '#6B7280' : (selected.remaining_spots ?? 0) <= 3 ? '#F59E0B' : '#818CF8' }}>
                    <Users size={11} />
                    {(selected.remaining_spots ?? 0) === 0
                      ? 'Complet'
                      : `${selected.remaining_spots} place${(selected.remaining_spots ?? 0) > 1 ? 's' : ''} restante${(selected.remaining_spots ?? 0) > 1 ? 's' : ''}`}
                  </span>
                )}
                {(selected.stand_price || 0) > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.5)' }}><Euro size={11} /> {selected.stand_price}€</span>
                )}
              </div>

              <Link href={`/events/${selected.id}`}
                style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#FFFFFF', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>
                Voir l&apos;événement →
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .leaflet-container{background:#0F0C29}
        .leaflet-control-attribution{background:rgba(15,12,41,0.8)!important;color:rgba(255,255,255,0.3)!important}
        .leaflet-control-attribution a{color:rgba(165,180,252,0.5)!important}
        .leaflet-control-zoom a{background:#1E1B4B!important;color:#A5B4FC!important;border-color:rgba(99,102,241,0.3)!important}
        .leaflet-control-zoom a:hover{background:#2D1B69!important}
      `}</style>
    </div>
  )
}
