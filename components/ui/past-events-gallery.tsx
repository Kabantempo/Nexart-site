'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PastEvent {
  id: string
  title: string
  city: string | null
  cover_image: string | null
  start_date: string | null
  stand_count: number | null
  status: string
}

interface Props {
  organizerId: string
  className?: string
}

export function PastEventsGallery({ organizerId, className = '' }: Props) {
  const [events, setEvents] = useState<PastEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('events')
      .select('id, title, city, cover_image, start_date, stand_count, status')
      .eq('organizer_id', organizerId)
      .or('status.eq.closed,end_date.lt.' + new Date().toISOString())
      .order('start_date', { ascending: false })
      .limit(12)
      .then(({ data }) => { setEvents(data ?? []); setLoading(false) })
  }, [organizerId])

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{ height: '160px', borderRadius: '14px', backgroundColor: '#F3F4F6' }} className="animate-shimmer" />
        ))}
      </div>
    )
  }

  if (!events.length) {
    return (
      <p style={{ fontSize: '14px', color: '#9CA3AF', padding: '24px 0' }}>
        Aucune édition passée pour le moment.
      </p>
    )
  }

  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
      {events.map((ev, i) => (
        <motion.div
          key={ev.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        >
          <Link href={`/events/${ev.id}`} style={{ display: 'block', borderRadius: '14px', overflow: 'hidden', border: '1px solid #E5E7EB', textDecoration: 'none', backgroundColor: '#fff', transition: 'box-shadow 200ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
          >
            <div style={{ position: 'relative', height: '110px', backgroundColor: '#F3F4F6' }}>
              {ev.cover_image ? (
                <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ height: '100%', background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)' }} />
              )}
              <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '9999px' }}>
                Passé
              </div>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ev.city && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#6B7280' }}>
                    <MapPin size={10} /> {ev.city}
                  </span>
                )}
                {ev.start_date && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#6B7280' }}>
                    <Calendar size={10} /> {new Date(ev.start_date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </span>
                )}
                {ev.stand_count && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#6B7280' }}>
                    <Users size={10} /> {ev.stand_count} stands
                  </span>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
