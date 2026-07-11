'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Users, Globe, Instagram, BadgeCheck, ArrowLeft } from 'lucide-react'

interface OrgProfile {
  id: string
  full_name: string
  role: string
  organizer_profiles: { organization_name: string | null; website: string | null; instagram: string | null; siret_verified: boolean }[]
}

interface Event {
  id: string
  title: string
  city: string
  region: string
  start_date: string
  end_date: string
  cover_image: string | null
  status: string
  stand_count: number
}

export default function OrganisateurProfileClient({ id }: { id: string }) {
  const [profile, setProfile] = useState<OrgProfile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, upcoming: 0 })

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: e }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role, organizer_profiles(organization_name, website, instagram, siret_verified)').eq('id', id).single(),
        supabase.from('events').select('id, title, city, region, start_date, end_date, cover_image, status, stand_count').eq('organizer_id', id).eq('status', 'published').order('start_date', { ascending: false }),
      ])
      if (p) setProfile(p as any)
      if (e) {
        setEvents(e as any)
        const now = new Date()
        setStats({
          total: e.length,
          upcoming: e.filter((ev: Event) => new Date(ev.start_date) > now).length,
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
      <div style={{ height: '200px', borderRadius: '12px', backgroundColor: '#F3F4F6', animation: 'pulse 2s infinite' }} />
    </div>
  )

  if (!profile) return null

  const org = profile.organizer_profiles?.[0]
  const orgName = org?.organization_name || profile.full_name

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px 32px' }}>
        <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Retour aux événements
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '16px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 700, color: '#6366F1', flexShrink: 0 }}>
              {orgName[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{orgName}</h1>
                {org?.siret_verified && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', backgroundColor: '#ECFDF5', color: '#10B981', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                    <BadgeCheck size={14} /> Vérifié
                  </span>
                )}
              </div>
              <p style={{ color: '#6B7280', fontSize: '15px', margin: 0 }}>Organisateur d'événements artisanaux</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { icon: Calendar, label: 'Événements publiés', value: stats.total },
              { icon: Users, label: 'À venir', value: stats.upcoming },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '14px' }}>
                <s.icon size={16} style={{ color: '#6366F1' }} />
                <span><strong style={{ color: '#1A1A1A' }}>{s.value}</strong> {s.label}</span>
              </div>
            ))}
            {org?.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '14px' }}>
                <Globe size={16} /> Site web
              </a>
            )}
            {org?.instagram && (
              <a href={`https://instagram.com/${org.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#E1306C', fontSize: '14px' }}>
                <Instagram size={16} /> @{org.instagram.replace('@', '')}
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* Events */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 60px', borderTop: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', margin: '32px 0 24px' }}>
          Événements organisés
        </h2>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', color: '#6B7280', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
            <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>Aucun événement publié pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {events.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/events/${event.id}`} style={{ display: 'block', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', textDecoration: 'none', transition: 'box-shadow 200ms', backgroundColor: '#FFFFFF' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '160px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={32} color="#6366F1" style={{ opacity: 0.4 }} />
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 8px' }}>{event.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px', marginBottom: '6px' }}>
                      <MapPin size={13} /> {event.city}{event.region ? `, ${event.region}` : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '13px' }}>
                      <Calendar size={13} />
                      {new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {event.stand_count > 0 && (
                      <p style={{ fontSize: '12px', color: '#6366F1', marginTop: '8px', fontWeight: 500 }}>{event.stand_count} stands disponibles</p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
