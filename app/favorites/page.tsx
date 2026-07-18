'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useFavorites } from '@/lib/hooks'
import { Heart, Calendar, MapPin, Users, Palette, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { GhostCard } from '@/components/ui/ghost-card'

export default function FavoritesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [authLoading, setAuthLoading] = useState(true)
  const [tab, setTab] = useState<'events' | 'creators'>('events')

  const { favEvents, favCreators, loading, toggleEventFav, toggleCreatorFav } = useFavorites(userId)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else { setUserId(session.user.id); setAuthLoading(false) }
    })
  }, [router])

  if (authLoading || loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#94A3B8', fontSize: '15px' }}>Chargement…</p>
      </div>
    )
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Mes favoris
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
            {favEvents.length + favCreators.length} élément{favEvents.length + favCreators.length !== 1 ? 's' : ''} sauvegardé{favEvents.length + favCreators.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {(['events', 'creators'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', transition: 'all 200ms ease',
                backgroundColor: tab === t ? '#FFFFFF' : 'transparent',
                color: tab === t ? '#0F172A' : '#64748B',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'events' ? `Événements (${favEvents.length})` : `Créateurs (${favCreators.length})`}
            </button>
          ))}
        </div>

        {/* Events tab */}
        {tab === 'events' && (
          favEvents.length === 0 ? (
            <GhostCard
              icon={<Calendar size={32} color="#6366F1" />}
              title="Aucun événement favori"
              description="Explorez les marchés et événements, puis cliquez sur le ❤️ pour les sauvegarder ici."
              cta="Explorer les événements"
              href="/events"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {favEvents.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  style={{
                    borderRadius: '14px', border: '1px solid #E2E8F0',
                    backgroundColor: 'var(--bg-primary)', overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {event.cover_image && (
                    <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
                      <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', lineHeight: '1.3', margin: 0 }}>{event.title}</h3>
                      <button
                        onClick={() => toggleEventFav(event.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                        title="Retirer des favoris"
                      >
                        <Heart size={18} color="#E05A5A" fill="#E05A5A" />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <MapPin size={13} color="#94A3B8" /> {event.city}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Calendar size={13} color="#94A3B8" /> {formatDate(event.start_date)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <Users size={13} color="#94A3B8" /> {event.stand_count} stands · {event.stand_price}€
                      </div>
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '9px 16px', borderRadius: '8px',
                        backgroundColor: '#EEF2FF', color: '#4F46E5',
                        fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                        transition: 'all 200ms ease',
                      }}
                    >
                      Voir l'événement <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* Creators tab */}
        {tab === 'creators' && (
          favCreators.length === 0 ? (
            <GhostCard
              icon={<Palette size={32} color="#6366F1" />}
              title="Aucun créateur favori"
              description="Découvrez les artisans et créateurs, puis cliquez sur le ❤️ pour les retrouver ici."
              cta="Découvrir les créateurs"
              href="/creators"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {favCreators.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  style={{
                    borderRadius: '14px', border: '1px solid #E2E8F0',
                    backgroundColor: 'var(--bg-primary)', padding: '20px', textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 200ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
                    {creator.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.full_name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #EEF2FF' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: '#6366F1' }}>
                        {creator.full_name?.[0] || '?'}
                      </div>
                    )}
                    <button
                      onClick={() => toggleCreatorFav(creator.id)}
                      style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                      title="Retirer des favoris"
                    >
                      <Heart size={12} color="#E05A5A" fill="#E05A5A" />
                    </button>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0F172A', marginBottom: '4px' }}>{creator.full_name}</h3>
                  {creator.city && (
                    <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <MapPin size={12} /> {creator.city}
                    </p>
                  )}
                  <Link
                    href={`/creators/${creator.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '8px',
                      backgroundColor: '#EEF2FF', color: '#4F46E5',
                      fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                    }}
                  >
                    Voir le profil <ArrowRight size={13} />
                  </Link>
                </motion.div>
              ))}
            </div>
          )
        )}

      </motion.div>
    </div>
  )
}

