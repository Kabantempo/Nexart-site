'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowLeft, Tag } from 'lucide-react'
import { REGIONS } from '@/lib/regions'

interface RegionEvent {
  id: string
  title: string
  city?: string
  region?: string
  start_date?: string
  end_date?: string
  cover_image?: string
  discipline_tags?: string[]
}

interface Props {
  slug: string
  region: { name: string; lat: number; lng: number; code: string; villes: string[] }
  initialEvents: RegionEvent[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RegionPageClient({ slug, region, initialEvents }: Props) {
  const otherRegions = Object.entries(REGIONS)
    .filter(([s]) => s !== slug)
    .slice(0, 8)

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero */}
      <div style={{ backgroundColor: '#F5F5F7', borderBottom: '1px solid #E5E7EB', padding: '48px 16px 40px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Link
            href="/events"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '14px', marginBottom: '24px', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> Tous les événements
          </Link>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <MapPin size={20} color="#6366F1" />
              <span style={{ fontSize: '13px', color: '#6366F1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                France — {region.code}
              </span>
            </div>
            <h1 style={{ fontSize: '42px', fontWeight: 700, color: '#1A1A1A', marginBottom: '12px', lineHeight: 1.15 }}>
              Marchés artisanaux<br />en {region.name}
            </h1>
            <p style={{ fontSize: '17px', color: '#888888', maxWidth: '560px', lineHeight: 1.6 }}>
              {initialEvents.length > 0
                ? `${initialEvents.length} événement${initialEvents.length > 1 ? 's' : ''} trouvé${initialEvents.length > 1 ? 's' : ''} — marchés, pop-ups et salons de créateurs en ${region.name}.`
                : `Découvrez les prochains marchés artisanaux, pop-ups et salons de créateurs en ${region.name}.`}
            </p>
          </motion.div>

          {/* Villes populaires */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '24px' }}>
            {region.villes.map((v) => (
              <span
                key={v}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#EEF2FF',
                  color: '#6366F1',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Events grid */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px' }}>
        {initialEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '64px 0', color: '#888888' }}
          >
            <MapPin size={40} style={{ margin: '0 auto 16px', color: '#D1D5DB' }} />
            <p style={{ fontSize: '17px', marginBottom: '8px' }}>Aucun événement à venir en {region.name} pour le moment.</p>
            <p style={{ fontSize: '14px' }}>
              <Link href="/events" style={{ color: '#6366F1' }}>Voir tous les événements →</Link>
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {initialEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    transition: 'box-shadow 0.2s',
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
                  >
                    {event.cover_image ? (
                      <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#F5F5F7' }}>
                        <Image src={event.cover_image} alt={event.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 33vw" />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '180px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={32} color="#6366F1" />
                      </div>
                    )}
                    <div style={{ padding: '16px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px', lineHeight: 1.3 }}>
                        {event.title}
                      </h2>
                      {event.city && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888888', fontSize: '13px', marginBottom: '6px' }}>
                          <MapPin size={12} /> {event.city}
                        </div>
                      )}
                      {event.start_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888888', fontSize: '13px', marginBottom: '10px' }}>
                          <Calendar size={12} /> {formatDate(event.start_date)}
                        </div>
                      )}
                      {event.discipline_tags && event.discipline_tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {event.discipline_tags.slice(0, 3).map((tag: string) => (
                            <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 8px', backgroundColor: '#F5F5F7', borderRadius: '12px', fontSize: '11px', color: '#6366F1' }}>
                              <Tag size={9} /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Autres régions */}
      <div style={{ borderTop: '1px solid #E5E7EB', backgroundColor: '#F5F5F7', padding: '48px 16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>
            Autres régions
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {otherRegions.map(([s, r]) => (
              <Link
                key={s}
                href={`/events/region/${s}`}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#1A1A1A',
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#6366F1' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#E5E7EB' }}
              >
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
