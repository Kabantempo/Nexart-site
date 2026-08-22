'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { MapPin, Calendar, Users, Sparkles } from 'lucide-react'

type FeedItem =
  | { kind: 'event';   id: string; title: string; city?: string; start_date?: string; cover_image?: string; discipline_tags?: string[]; event_type?: string }
  | { kind: 'creator'; id: string; full_name?: string; city?: string; disciplines?: string[]; avatar_url?: string; portfolio_images?: string[]; siret_verified?: boolean }

const PAGE = 20

function interleave(events: FeedItem[], creators: FeedItem[]): FeedItem[] {
  const out: FeedItem[] = []
  let ei = 0, ci = 0
  while (ei < events.length || ci < creators.length) {
    if (ei < events.length) out.push(events[ei++])
    if (ei < events.length) out.push(events[ei++])
    if (ci < creators.length) out.push(creators[ci++])
  }
  return out
}

function EventCard({ item, onClick }: { item: Extract<FeedItem, { kind: 'event' }>; onClick: () => void }) {
  const date = item.start_date ? new Date(item.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClick}
      style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'var(--ev-card-bg)', border: '1px solid var(--ev-border)', cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', width: '100%', height: 160, backgroundColor: 'var(--ev-card-bg2)' }}>
        {item.cover_image ? (
          <Image src={item.cover_image} alt={item.title} fill sizes="600px" style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={32} color="#6366F1" opacity={0.4} />
          </div>
        )}
        <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#6366F1', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '3px 9px' }}>
          {item.event_type === 'marche' ? '🛍️ Marché' : item.event_type === 'festival' ? '🎪 Festival' : '📍 Événement'}
        </span>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--ev-card-title)', lineHeight: 1.3 }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {item.city && <span style={{ fontSize: 11, color: 'var(--ev-card-date)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{item.city}</span>}
          {date && <span style={{ fontSize: 11, color: 'var(--ev-card-date)', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10} />{date}</span>}
        </div>
        {(item.discipline_tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
            {(item.discipline_tags || []).slice(0, 3).map((t: string) => (
              <span key={t} style={{ backgroundColor: 'var(--ev-card-tag-bg)', color: 'var(--ev-card-tag-text)', fontSize: 9, fontWeight: 600, borderRadius: 20, padding: '2px 8px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function CreatorCard({ item, onClick }: { item: Extract<FeedItem, { kind: 'creator' }>; onClick: () => void }) {
  const img = item.portfolio_images?.[0] || item.avatar_url
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      onClick={onClick}
      style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'var(--ev-card-bg)', border: '1px solid var(--ev-border)', cursor: 'pointer', display: 'flex', alignItems: 'stretch' }}
    >
      <div style={{ position: 'relative', width: 90, flexShrink: 0, backgroundColor: 'var(--ev-card-bg2)' }}>
        {img ? (
          <Image src={img} alt={item.full_name || ''} fill sizes="90px" style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#6366F1', opacity: 0.6 }}>{item.full_name?.slice(0, 1).toUpperCase() || '?'}</span>
          </div>
        )}
        <span style={{ position: 'absolute', top: 7, left: 7, backgroundColor: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 6px' }}>
          👤 Créateur
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ev-card-title)' }}>{item.full_name}</p>
          {item.siret_verified && <span style={{ fontSize: 9, color: '#6366F1', fontWeight: 700 }}>✓</span>}
        </div>
        {(item.disciplines || []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(item.disciplines || []).slice(0, 2).map((d: string) => (
              <span key={d} style={{ backgroundColor: 'var(--ev-card-tag-bg)', color: 'var(--ev-card-tag-text)', fontSize: 9, fontWeight: 600, borderRadius: 20, padding: '2px 7px' }}>{d}</span>
            ))}
          </div>
        )}
        {item.city && <span style={{ fontSize: 11, color: 'var(--ev-card-date)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{item.city}</span>}
      </div>
    </motion.div>
  )
}

export default function HomeFeedClient() {
  const user = useAuthStore(s => s.user)
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'events' | 'creators'>('all')
  const [items, setItems]   = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (p: number, f: typeof filter) => {
    setLoading(true)
    const from = p * PAGE
    const half = PAGE / 2

    const [evRes, crRes] = await Promise.all([
      f !== 'creators'
        ? supabase.from('events').select('id, title, city, start_date, cover_image, discipline_tags, event_type').eq('status', 'published').order('start_date', { ascending: true }).range(from, from + (f === 'events' ? PAGE - 1 : half - 1))
        : Promise.resolve({ data: [] }),
      f !== 'events'
        ? supabase.from('creator_profiles').select('id, full_name, city, disciplines, avatar_url, portfolio_images, siret_verified').order('created_at', { ascending: false }).range(from, from + (f === 'creators' ? PAGE - 1 : half - 1))
        : Promise.resolve({ data: [] }),
    ])

    const evItems: FeedItem[] = ((evRes as any).data || []).map((e: any) => ({ kind: 'event' as const, ...e }))
    const crItems: FeedItem[] = ((crRes as any).data || []).map((c: any) => ({ kind: 'creator' as const, ...c }))

    const merged = f === 'events' ? evItems : f === 'creators' ? crItems : interleave(evItems, crItems)

    if (p === 0) {
      setItems(merged)
    } else {
      setItems(prev => [...prev, ...merged])
    }
    setHasMore(merged.length >= (f === 'all' ? 10 : PAGE - 2))
    setLoading(false)
  }, [])

  useEffect(() => { setPage(0); load(0, filter) }, [filter, load])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    load(next, filter)
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 58, zIndex: 9, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--ev-border)', padding: '10px 16px 0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color="#6366F1" />
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--ev-sort-active)' }}>Fil d'actu</h1>
            {user?.full_name && <span style={{ fontSize: 13, color: 'var(--ev-card-date)' }}>· Bonjour {user.full_name.split(' ')[0]} 👋</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 10 }}>
            {([['all', 'Tout'], ['events', '🛍️ Marchés'], ['creators', '👤 Créateurs']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', backgroundColor: filter === key ? '#6366F1' : 'var(--ev-chip-bg)', color: filter === key ? '#fff' : 'var(--ev-chip-text)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px' }}>

        {loading && items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 16, height: i % 3 === 2 ? 90 : 200, backgroundColor: 'var(--ev-card-bg)', border: '1px solid var(--ev-border)', animation: 'shimmer 1.5s infinite linear', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--ev-card-bg) 25%, var(--ev-card-bg2) 50%, var(--ev-card-bg) 75%)' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item =>
              item.kind === 'event'
                ? <EventCard key={`e-${item.id}`} item={item} onClick={() => router.push(`/events/${item.id}`)} />
                : <CreatorCard key={`c-${item.id}`} item={item} onClick={() => router.push(`/creators/${item.id}`)} />
            )}
          </div>
        )}

        {/* Load more */}
        {!loading && hasMore && items.length > 0 && (
          <button
            onClick={loadMore}
            style={{ display: 'block', width: '100%', marginTop: 20, padding: '12px', borderRadius: 14, border: '1px solid var(--ev-border)', backgroundColor: 'var(--ev-card-bg)', color: 'var(--ev-sort-active)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Voir plus
          </button>
        )}

        {loading && items.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ev-card-date)', fontSize: 13 }}>Chargement…</div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ev-sort-active)' }}>Rien à afficher pour l'instant</p>
          </div>
        )}
      </div>
    </div>
  )
}
