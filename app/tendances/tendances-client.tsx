'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { TrendingUp, MapPin, Calendar, Users, ArrowRight } from 'lucide-react'

type DisciplineCount = { name: string; count: number }
type RegionCount = { name: string; count: number; eventCount: number }
type UpcomingEvent = { id: string; title: string; city: string; start_date: string; cover_image: string | null }

export default function TendancesPage() {
  const [disciplines, setDisciplines] = useState<DisciplineCount[]>([])
  const [regions, setRegions] = useState<RegionCount[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ data: creators }, { data: events }] = await Promise.all([
        supabase.from('creator_profiles').select('disciplines, region'),
        supabase.from('events').select('id, title, city, start_date, cover_image, region').eq('status', 'published').gte('start_date', new Date().toISOString()).order('start_date').limit(6),
      ])

      const discMap: Record<string, number> = {}
      ;(creators ?? []).forEach(c => {
        ;(c.disciplines as string[] ?? []).forEach(d => { discMap[d] = (discMap[d] ?? 0) + 1 })
      })
      setDisciplines(
        Object.entries(discMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([name, count]) => ({ name, count }))
      )

      const regMap: Record<string, { creators: number; events: number }> = {}
      ;(creators ?? []).forEach(c => {
        if (c.region) regMap[c.region] = { creators: (regMap[c.region]?.creators ?? 0) + 1, events: regMap[c.region]?.events ?? 0 }
      })
      ;(events ?? []).forEach(e => {
        const r = (e as unknown as { region?: string }).region || ''
        if (r) regMap[r] = { creators: regMap[r]?.creators ?? 0, events: (regMap[r]?.events ?? 0) + 1 }
      })
      setRegions(
        Object.entries(regMap)
          .sort((a, b) => (b[1].creators + b[1].events * 2) - (a[1].creators + a[1].events * 2))
          .slice(0, 8)
          .map(([name, v]) => ({ name, count: v.creators, eventCount: v.events }))
      )

      setUpcoming((events ?? []) as unknown as UpcomingEvent[])
      setLoading(false)
    }
    load()
  }, [])

  const maxDisc = disciplines[0]?.count ?? 1

  return (
    <div style={{ maxWidth: '896px', margin: '0 auto', padding: '64px 16px' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrendingUp size={18} color="#4F46E5" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Tendances</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Disciplines populaires, régions actives, événements à venir</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '160px', borderRadius: '16px', backgroundColor: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
            <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }`}</style>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Disciplines */}
            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#6366F1" /> Disciplines les plus représentées
              </h2>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid #F3F4F6', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {disciplines.map((d, i) => (
                  <motion.div key={d.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Link href={`/creators?discipline=${encodeURIComponent(d.name)}`}
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}>
                        {d.name}
                      </Link>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{d.count} créateur{d.count > 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ height: '8px', borderRadius: '9999px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '9999px', background: 'linear-gradient(to right, #6366F1, #8B5CF6)', width: `${Math.round((d.count / maxDisc) * 100)}%`, transition: 'width 0.7s ease' }} />
                    </div>
                  </motion.div>
                ))}
                {disciplines.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Aucune donnée disponible.</p>}
              </div>
            </section>

            {/* Régions */}
            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#6366F1" /> Régions les plus actives
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                {regions.map((r, i) => (
                  <motion.div key={r.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ padding: '16px', borderRadius: '16px', border: '1px solid #F3F4F6', backgroundColor: 'var(--bg-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>{r.name}</p>
                    <p style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600, margin: 0 }}>{r.count} créateur{r.count > 1 ? 's' : ''}</p>
                    {r.eventCount > 0 && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{r.eventCount} événement{r.eventCount > 1 ? 's' : ''}</p>}
                  </motion.div>
                ))}
                {regions.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', gridColumn: '1/-1' }}>Aucune donnée disponible.</p>}
              </div>
            </section>

            {/* Événements à venir */}
            <section>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="#6366F1" /> Prochains événements
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {upcoming.map((ev, i) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/events/${ev.id}`} style={{ display: 'flex', gap: '12px', padding: '16px', borderRadius: '16px', border: '1px solid #F3F4F6', backgroundColor: 'var(--bg-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', textDecoration: 'none', transition: 'border-color 0.15s, transform 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#A5B4FC'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#F3F4F6'; e.currentTarget.style.transform = 'none' }}>
                      {ev.cover_image ? (
                        <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                          <Image src={ev.cover_image} alt={ev.title} width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        </div>
                      ) : (
                        <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#EEF2FF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Calendar size={20} color="#A5B4FC" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>{ev.city}</p>
                        <p style={{ fontSize: '12px', color: '#6366F1', fontWeight: 600, margin: 0 }}>
                          {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <ArrowRight size={14} color="#A5B4FC" style={{ flexShrink: 0, marginTop: '4px' }} />
                    </Link>
                  </motion.div>
                ))}
                {upcoming.length === 0 && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', gridColumn: '1/-1' }}>Aucun événement à venir pour le moment.</p>
                )}
              </div>
              {upcoming.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Link href="/events" style={{ fontSize: '14px', fontWeight: 600, color: '#6366F1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#4F46E5')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6366F1')}>
                    Voir tous les événements <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>

          </div>
        )}
      </motion.div>
    </div>
  )
}
