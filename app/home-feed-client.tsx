'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { MapPin, Calendar, Sparkles } from 'lucide-react'
import { colors } from '@/lib/design-tokens'

type Ev = { kind: 'event';   id: string; title: string; city?: string; start_date?: string; cover_image?: string; discipline_tags?: string[]; event_type?: string }
type Cr = { kind: 'creator'; id: string; full_name?: string; city?: string; disciplines?: string[]; avatar_url?: string; portfolio_images?: string[]; siret_verified?: boolean }
type Item = Ev | Cr

const PAGE = 20

function useFeed(filter: 'all' | 'events' | 'creators', page: number) {
  const [events,   setEvents]   = useState<Ev[]>([])
  const [creators, setCreators] = useState<Cr[]>([])
  const [loading,  setLoading]  = useState(true)
  const [hasMore,  setHasMore]  = useState(true)

  const load = useCallback(async (p: number, f: typeof filter) => {
    setLoading(true)
    const from = p * PAGE
    const half = PAGE / 2
    const [evRes, crRes] = await Promise.all([
      f !== 'creators'
        ? supabase.from('events').select('id,title,city,start_date,cover_image,discipline_tags,event_type').eq('status','published').order('start_date',{ascending:true}).range(from, from+(f==='events'?PAGE-1:half-1))
        : Promise.resolve({ data: [] }),
      f !== 'events'
        ? supabase.from('creator_profiles').select('user_id,city,disciplines,portfolio_images,siret_verified,profiles(full_name,avatar_url)').order('user_id',{ascending:false}).range(from, from+(f==='creators'?PAGE-1:half-1))
        : Promise.resolve({ data: [] }),
    ])
    const evs: Ev[] = ((evRes as any).data||[]).map((e: any) => ({ kind:'event' as const, ...e }))
    const crs: Cr[] = ((crRes as any).data||[]).map((c: any) => ({
      kind: 'creator' as const,
      id: c.user_id,
      city: c.city,
      disciplines: c.disciplines,
      portfolio_images: c.portfolio_images,
      siret_verified: c.siret_verified,
      full_name: c.profiles?.full_name,
      avatar_url: c.profiles?.avatar_url,
    }))
    if (p===0) { setEvents(evs); setCreators(crs) }
    else       { setEvents(prev=>[...prev,...evs]); setCreators(prev=>[...prev,...crs]) }
    setHasMore(evs.length+crs.length >= 6)
    setLoading(false)
  }, [])

  useEffect(() => { setEvents([]); setCreators([]); load(0, filter) }, [filter, load])
  useEffect(() => { if (page>0) load(page, filter) }, [page, filter, load])
  return { events, creators, loading, hasMore }
}

// ── Interleave events + creators ─────────────────────────────────────────────
function buildFeed(events: Ev[], creators: Cr[]): Item[] {
  const result: Item[] = []
  let ci = 0
  for (let i = 0; i < events.length; i++) {
    result.push(events[i])
    if ((i + 1) % 4 === 0 && ci < creators.length) {
      result.push(creators[ci++])
    }
  }
  while (ci < creators.length) result.push(creators[ci++])
  return result
}

// ── Cards ─────────────────────────────────────────────────────────────────────

const cardBase: React.CSSProperties = {
  borderRadius: '16px',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-primary)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  breakInside: 'avoid',
  marginBottom: '14px',
  transition: 'box-shadow 0.2s, transform 0.2s',
  cursor: 'pointer',
}

function EventCard({ item, onClick }: { item: Ev; onClick: () => void }) {
  const date = item.start_date ? new Date(item.start_date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : null
  const label = item.event_type === 'marche' ? '🛍️ Marché' : item.event_type === 'festival' ? '🎪 Festival' : '📍 Événement'

  return (
    <div style={cardBase} onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
    >
      {item.cover_image && (
        <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
          <Image src={item.cover_image} alt={item.title} fill sizes="340px" style={{ objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,20,.5) 0%, transparent 60%)' }} />
          <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(99,102,241,.92)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
            {label}
          </span>
        </div>
      )}
      <div style={{ padding: '14px' }}>
        <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {item.city && <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10}/>{item.city}</span>}
          {date      && <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={10}/>{date}</span>}
        </div>
        {(item.discipline_tags||[]).length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
            {(item.discipline_tags||[]).slice(0,3).map((t:string) => (
              <span key={t} style={{ backgroundColor: colors.violet.bg, color: colors.violet.primary, fontSize: 9, fontWeight: 600, borderRadius: 20, padding: '2px 7px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreatorCard({ item, onClick }: { item: Cr; onClick: () => void }) {
  const img = item.portfolio_images?.[0] || item.avatar_url

  return (
    <div style={cardBase} onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(99,102,241,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
    >
      {/* Label */}
      <div style={{ padding: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 5 }}>
        <Sparkles size={11} color={colors.violet.primary} />
        <span style={{ fontSize: 10, fontWeight: 700, color: colors.violet.primary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Créateur à découvrir</span>
      </div>
      {img && (
        <div style={{ height: '110px', overflow: 'hidden', margin: '10px 14px 0', borderRadius: '10px' }}>
          <Image src={img} alt={item.full_name||''} width={500} height={110} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.violet.primary, fontWeight: 700, fontSize: 14, overflow: 'hidden', flexShrink: 0, border: `2px solid ${colors.violet.bg}` }}>
          {item.avatar_url
            ? <Image src={item.avatar_url} alt="" width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            : (item.full_name?.[0] || '?')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.full_name || 'Créateur'}</p>
          {(item.disciplines||[]).length > 0 && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(item.disciplines||[]).slice(0,2).join(' · ')}</p>
          )}
          {item.city && <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={9}/>{item.city}</p>}
        </div>
        {item.siret_verified && <span style={{ fontSize: 9, color: colors.violet.primary, fontWeight: 700, flexShrink: 0 }}>✓ Vérifié</span>}
      </div>
    </div>
  )
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'var(--ev-card-bg)', backgroundImage: 'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', height: tall ? 280 : 200, marginBottom: 14, breakInside: 'avoid' }} />
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomeFeedClient() {
  const user   = useAuthStore(s => s.user)
  const router = useRouter()
  const [filter, setFilter] = useState<'all'|'events'|'creators'>('all')
  const [page,   setPage]   = useState(0)
  const { events, creators, loading, hasMore } = useFeed(filter, page)

  const feed = buildFeed(events, creators)

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .feed-masonry { columns: auto 300px; column-gap: 16px; }
        @media (max-width: 600px) { .feed-masonry { columns: 1; } }
      `}</style>

      {/* Header */}
      <div style={{ position: 'sticky', top: 58, zIndex: 9, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '10px 20px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color={colors.violet.primary} />
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Fil d&apos;actu</h1>
            {user?.full_name && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>· Bonjour {user.full_name.split(' ')[0]} 👋</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, paddingBottom: 10 }}>
            {([['all','Tout'],['events','🛍️ Marchés'],['creators','👤 Créateurs']] as const).map(([key,label]) => (
              <button key={key} onClick={() => { setFilter(key); setPage(0) }}
                style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s', backgroundColor: filter===key ? colors.violet.primary : 'var(--bg-secondary)', color: filter===key ? '#fff' : 'var(--text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 80px' }}>
        {loading && feed.length === 0 ? (
          <div className="feed-masonry">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} tall={i % 3 === 0} />)}
          </div>
        ) : (
          <motion.div className="feed-masonry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {feed.map(item =>
              item.kind === 'event'
                ? <EventCard key={`ev-${item.id}`} item={item} onClick={() => router.push(`/events/${item.id}`)} />
                : <CreatorCard key={`cr-${item.id}`} item={item} onClick={() => router.push(`/creators/${item.id}`)} />
            )}
          </motion.div>
        )}

        {!loading && hasMore && feed.length > 0 && (
          <button onClick={() => setPage(p => p+1)}
            style={{ display: 'block', width: 200, margin: '8px auto 0', padding: '12px', borderRadius: 14, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Voir plus
          </button>
        )}
        {loading && feed.length > 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: 13 }}>Chargement…</div>
        )}
        {!loading && feed.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Rien à afficher</p>
          </div>
        )}
      </div>
    </div>
  )
}
