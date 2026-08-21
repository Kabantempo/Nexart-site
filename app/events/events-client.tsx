'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Event as NexartEvent } from '@/lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatPrice(price?: number | null) {
  if (!price || price === 0) return 'Gratuit'
  return `${price} €`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function statusLabel(status: NexartEvent['status']) {
  if (status === 'published') return { label: 'Ouvert', color: '#22C55E' }
  if (status === 'closed') return { label: 'Complet', color: '#EF4444' }
  return { label: 'Bientôt', color: '#F59E0B' }
}

function getTagsFromEvent(event: NexartEvent): string[] {
  const tags: string[] = []
  // event_type label
  const typeMap: Record<string, string> = {
    popup: 'Pop-up', salon: 'Salon', fair: 'Foire',
    seasonal: 'Saisonnier', permanent: 'Permanent',
  }
  if (event.event_type && typeMap[event.event_type]) tags.push(typeMap[event.event_type])
  // theme/discipline tags
  if (event.theme?.length) tags.push(...event.theme.slice(0, 2))
  else if (event.discipline_tags?.length) tags.push(...event.discipline_tags.slice(0, 2))
  return tags.slice(0, 3)
}

// card dimensions — 1.5 cards visible on 375px mobile
// 375px viewport: 16px padding + 220px card1 + 12px gap + ~127px card2 visible = 375 ✓
const CARD_W = 220
const IMG_H = 160  // ~half the card height

// ─── skeleton card ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      flexShrink: 0, width: CARD_W, borderRadius: 12,
      backgroundColor: '#1A1A2E', overflow: 'hidden', scrollSnapAlign: 'start',
    }}>
      <div style={{ width: '100%', height: IMG_H, background: 'linear-gradient(90deg,#2A2A3E 25%,#3A3A4E 50%,#2A2A3E 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 13, borderRadius: 4, backgroundColor: '#2A2A3E', width: '90%', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 13, borderRadius: 4, backgroundColor: '#2A2A3E', width: '70%', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <div style={{ height: 20, borderRadius: 20, backgroundColor: '#2A2A3E', width: 60 }} />
          <div style={{ height: 20, borderRadius: 20, backgroundColor: '#2A2A3E', width: 50 }} />
        </div>
      </div>
    </div>
  )
}

// ─── event card ──────────────────────────────────────────────────────────────

function EventCard({ event, onClick, index = 0 }: { event: NexartEvent; onClick: () => void; index?: number }) {
  const st = statusLabel(event.status)
  const tags = getTagsFromEvent(event)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      onClick={onClick}
      style={{
        flexShrink: 0, width: CARD_W, borderRadius: 12,
        backgroundColor: '#1A1A2E', overflow: 'hidden',
        scrollSnapAlign: 'start', cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* image */}
      <div style={{ position: 'relative', width: '100%', height: IMG_H, flexShrink: 0 }}>
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            sizes={`${CARD_W}px`}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2D2B55,#1A1A3E)' }} />
        )}
        {/* status badge */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          backgroundColor: st.color, color: '#fff',
          fontSize: 10, fontWeight: 700, borderRadius: 20,
          padding: '3px 9px', letterSpacing: 0.3,
        }}>
          {st.label}
        </span>
      </div>

      {/* content */}
      <div style={{ padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* title */}
        <p style={{
          margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.35,
          color: '#FFFFFF', display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.title}
        </p>

        {/* tags — wrap freely */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                backgroundColor: '#2A2A3E', color: '#C4C4D4',
                fontSize: 10, fontWeight: 600, borderRadius: 20,
                padding: '3px 8px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#6B6B8A' }}>
            {formatDate(event.start_date)}{event.city ? ` · ${event.city}` : ''}
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF' }}>
            {formatPrice(event.stand_price)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── horizontal section ───────────────────────────────────────────────────────

function Section({
  title, events, loading, onCardClick,
}: {
  title: string
  events: NexartEvent[]
  loading: boolean
  onCardClick: (id: string) => void
}) {
  if (!loading && events.length === 0) return null

  return (
    <motion.section
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
      style={{ marginBottom: 32 }}
    >
      <h2 style={{
        margin: '0 0 12px 16px', fontSize: 16, fontWeight: 800,
        color: 'var(--ev-sort-active)', letterSpacing: -0.3,
      }}>
        {title}
      </h2>

      {/* outer div handles overflow-x only */}
      <div style={{ overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: 16 }} className="hide-scrollbar">
        {/* inner div is the flex row — padding-left/right work here because it's not the overflow container */}
        <div style={{
          display: 'flex', flexDirection: 'row', gap: 12,
          paddingLeft: 16, paddingRight: 16, paddingBottom: 8,
        }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : events.map((ev, i) => (
                <EventCard key={ev.id} event={ev} index={i} onClick={() => onCardClick(ev.id)} />
              ))
          }
        </div>
      </div>
    </motion.section>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

// ─── featured carousel ───────────────────────────────────────────────────────

function FeaturedCarousel({ events, loading, onCardClick }: {
  events: NexartEvent[]
  loading: boolean
  onCardClick: (id: string) => void
}) {
  const [active, setActive] = useState(0)
  const items = loading ? null : events.slice(0, 5)

  useEffect(() => {
    if (!items?.length) return
    const t = setInterval(() => setActive(i => (i + 1) % items.length), 4000)
    return () => clearInterval(t)
  }, [items?.length])

  if (loading) {
    return (
      <div style={{
        margin: '0 16px 28px', borderRadius: 0, overflow: 'hidden',
        height: 200, backgroundColor: '#1A1A2E',
        background: 'linear-gradient(90deg,#1A1A2E 25%,#2A2A3E 50%,#1A1A2E 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
      }} />
    )
  }

  if (!items?.length) return null

  const ev = items[active]
  const tags = getTagsFromEvent(ev)

  return (
    <div style={{ margin: '0 0 28px', position: 'relative' }}>
      <motion.div
        key={ev.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        onClick={() => onCardClick(ev.id)}
        style={{
          borderRadius: 0, overflow: 'hidden', cursor: 'pointer',
          height: 200, position: 'relative', backgroundColor: '#1A1A2E',
        }}
      >
        {/* background image */}
        {ev.cover_image ? (
          <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#2D2B55,#1A1A3E)' }} />
        )}
        {/* dark overlay gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,20,0.92) 0%, rgba(10,10,20,0.3) 60%, transparent 100%)',
        }} />

        {/* content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 16px 14px' }}>
          <p style={{
            margin: '0 0 6px', fontSize: 17, fontWeight: 800,
            color: '#fff', lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {ev.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {tags.slice(0, 2).map(t => (
                <span key={t} style={{
                  backgroundColor: 'rgba(99,102,241,0.25)', color: '#A5B4FC',
                  fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px',
                }}>{t}</span>
              ))}
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
              {formatPrice(ev.stand_price)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              width: i === active ? 18 : 6, height: 6,
              borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0,
              backgroundColor: i === active ? '#6366F1' : '#D1D5DB',
              transition: 'width 0.3s, background-color 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function EventsClient() {
  const router = useRouter()
  const [events, setEvents] = useState<NexartEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('tous')
  const [sortBy, setSortBy] = useState<string>('date-asc')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 80) { setHeaderVisible(true); lastY = y; return }
      setHeaderVisible(y < lastY)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/events?limit=100')
      .then(r => r.json())
      .then(d => {
        setEvents(d.events ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const FILTERS = [
    { key: 'tous', label: 'Tous' },
    { key: 'salon', label: 'Salons' },
    { key: 'popup', label: 'Pop-ups' },
    { key: 'fair', label: 'Foires' },
    { key: 'permanent', label: 'Permanent' },
    { key: 'gratuit', label: 'Gratuit' },
    { key: 'bientot', label: 'Bientôt' },
  ]

  const bySearch = search
    ? events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.city?.toLowerCase().includes(search.toLowerCase())
      )
    : events

  const filtered = activeFilter === 'tous'
    ? bySearch
    : activeFilter === 'gratuit'
    ? bySearch.filter(e => !e.stand_price || e.stand_price === 0)
    : activeFilter === 'bientot'
    ? bySearch.filter(e => {
        const d = new Date(e.start_date)
        const now2 = new Date()
        const diff = (d.getTime() - now2.getTime()) / (1000 * 60 * 60 * 24)
        return diff >= 0 && diff <= 30
      })
    : ['bijoux','ceramique','mode','illustration','alimentaire','textile','photo'].includes(activeFilter)
    ? bySearch.filter(e => {
        const hay = [...(e.theme ?? []), ...(e.discipline_tags ?? [])].join(' ').toLowerCase()
        const map: Record<string,string[]> = {
          bijoux: ['bijou','joaillerie','bijoux'],
          ceramique: ['céramique','ceramique','poterie'],
          mode: ['mode','vêtement','textile','couture'],
          illustration: ['illustration','dessin','peinture','art'],
          alimentaire: ['aliment','nourriture','gastronomie','épicerie','food'],
          textile: ['textile','tissu','broderie','tricot'],
          photo: ['photo','photographie'],
        }
        return (map[activeFilter] ?? [activeFilter]).some(k => hay.includes(k))
      })
    : bySearch.filter(e => e.event_type === activeFilter)

  const now = new Date()

  const applySort = (arr: typeof filtered) => {
    const a = [...arr]
    switch (sortBy) {
      case 'date-asc':  return a.sort((x, y) => new Date(x.start_date).getTime() - new Date(y.start_date).getTime())
      case 'date-desc': return a.sort((x, y) => new Date(y.start_date).getTime() - new Date(x.start_date).getTime())
      case 'price-asc': return a.sort((x, y) => (x.stand_price ?? 0) - (y.stand_price ?? 0))
      case 'price-desc':return a.sort((x, y) => (y.stand_price ?? 0) - (x.stand_price ?? 0))
      case 'recent':    return a.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())
      case 'alpha':     return a.sort((x, y) => x.title.localeCompare(y.title))
      default:          return a
    }
  }

  const upcoming = applySort(filtered.filter(e => new Date(e.start_date) >= now))
  const nearby = applySort(filtered).slice(0, 10)

  const artKeywords = ['peinture', 'dessin', 'sculpture', 'bijoux', 'céramique', 'art', 'expo', 'galerie']
  const expositions = applySort(filtered.filter(e => {
    const haystack = [...(e.theme ?? []), ...(e.discipline_tags ?? []), e.event_type].join(' ').toLowerCase()
    return artKeywords.some(k => haystack.includes(k))
  }))

  const marches = applySort(filtered.filter(e => ['popup', 'fair', 'salon'].includes(e.event_type)))

  const handleCardClick = (id: string) => router.push(`/events/${id}`)

  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  // ── Desktop layout (≥ 1024px) ───────────────────────────────────────────────
  if (isDesktop) {
    return (
      <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ev-sort-active)', marginBottom: 4, letterSpacing: -0.5 }}>
          Événements
        </h1>
        <p style={{ color: '#6B7280', marginBottom: 24 }}>Marchés, pop-ups et salons près de chez vous</p>

        {/* search + filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--ev-chip-bg)', borderRadius: 12, padding: '10px 16px', flex: 1, minWidth: 260 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Ville, nom d'événement…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoComplete="off"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', colorScheme: 'dark light' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                backgroundColor: activeFilter === f.key ? '#6366F1' : 'var(--ev-chip-bg)',
                color: activeFilter === f.key ? '#fff' : 'var(--ev-chip-text)',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ borderRadius: 16, backgroundColor: 'var(--ev-chip-bg)', height: 280,
                background: 'linear-gradient(90deg,var(--ev-skeleton-1) 25%,var(--ev-chip-bg) 50%,var(--ev-skeleton-1) 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 80 }}>Aucun événement trouvé.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filtered.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => handleCardClick(ev.id)}
                style={{ borderRadius: 16, backgroundColor: '#1A1A2E', overflow: 'hidden', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'relative', width: '100%', height: 180, flexShrink: 0, backgroundColor: '#252540' }}>
                  {ev.cover_image && (
                    <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} sizes="320px" />
                  )}
                  {(() => { const st = statusLabel(ev.status); return (
                    <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: st.color,
                      color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>{st.label}</span>
                  )})()}
                </div>
                <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700,
                    display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
                    overflow: 'hidden' }}>{ev.title}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {getTagsFromEvent(ev).slice(0, 3).map(tag => (
                      <span key={tag} style={{ backgroundColor: '#2A2A3E', color: '#C4C4D4',
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: '#6B6B8A' }}>
                      {ev.start_date ? formatDate(ev.start_date) : ''}{ev.city ? ` · ${ev.city}` : ''}
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{formatPrice(ev.stand_price)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 30px var(--ev-chip-bg) inset !important;
          -webkit-text-fill-color: var(--text-primary) !important;
        }
      `}</style>

      <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: 80 }}>
        {/* fixed header: title + search + filters — hides on scroll down */}
        <div style={{
          position: 'fixed', top: headerVisible ? 58 : -200, left: 0, right: 0, zIndex: 10,
          backgroundColor: '#fff',
          borderBottom: '1px solid var(--ev-border)',
          transition: 'top 0.25s ease',
        }}>
          {/* title row */}
          <div style={{ padding: '12px 16px 8px' }}>
            <h1 style={{ margin: '0 0 1px', fontSize: 22, fontWeight: 800, color: 'var(--ev-sort-active)', letterSpacing: -0.5 }}>
              Événements
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Marchés, pop-ups et salons près de chez vous</p>
          </div>
          {/* search */}
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: 'var(--ev-chip-bg)', borderRadius: 12, padding: '9px 14px', colorScheme: 'dark light',
            }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2.5}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Ville, nom d'événement…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', colorScheme: 'dark light' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth={2.5}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {/* type filters row */}
          <div style={{ overflowX: 'auto', scrollPaddingLeft: 16 }} className="hide-scrollbar">
            <div style={{ display: 'flex', gap: 8, paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                  flexShrink: 0, padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  backgroundColor: activeFilter === f.key ? '#6366F1' : 'var(--ev-chip-bg)',
                  color: activeFilter === f.key ? '#fff' : 'var(--ev-chip-text)',
                  transition: 'background 0.15s, color 0.15s',
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {/* sort row — direct */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 10px', gap: 6 }}>
            <button onClick={() => setSortBy(sortBy === 'date-asc' ? 'date-desc' : 'date-asc')} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              backgroundColor: sortBy.startsWith('date') ? 'var(--ev-sort-active)' : 'var(--ev-chip-bg)',
              color: sortBy.startsWith('date') ? '#fff' : '#6B7280',
            }}>
              Date {sortBy === 'date-desc' ? '↓' : '↑'}
            </button>
            <button onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              backgroundColor: sortBy.startsWith('price') ? 'var(--ev-sort-active)' : 'var(--ev-chip-bg)',
              color: sortBy.startsWith('price') ? '#fff' : '#6B7280',
            }}>
              Prix {sortBy === 'price-desc' ? '↓' : '↑'}
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowAdvanced(v => !v)} style={{
              padding: '5px 12px', borderRadius: 8, border: '1px solid var(--ev-border)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, background: showAdvanced ? 'var(--ev-chip-bg)' : '#fff', color: 'var(--ev-chip-text)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              Avancé
            </button>
          </div>
          {showAdvanced && (
            <div style={{ margin: '0 16px 10px', padding: '4px 0', borderTop: '1px solid var(--ev-border)' }}>
              {[
                { key: 'date-asc',   label: 'Date (plus proche)' },
                { key: 'date-desc',  label: 'Date (plus lointaine)' },
                { key: 'price-asc',  label: 'Prix croissant' },
                { key: 'price-desc', label: 'Prix décroissant' },
                { key: 'recent',     label: 'Ajouté récemment' },
                { key: 'alpha',      label: 'Alphabétique (A → Z)' },
              ].map(s => (
                <button key={s.key} onClick={() => { setSortBy(s.key); setShowAdvanced(false) }} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                  padding: '9px 4px', border: 'none', cursor: 'pointer', background: 'none',
                  color: sortBy === s.key ? '#6366F1' : 'var(--ev-chip-text)',
                  fontSize: 13, fontWeight: sortBy === s.key ? 600 : 400,
                }}>
                  {s.label}
                  {sortBy === s.key && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6366F1" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* spacer matching fixed header height */}
        <div style={{ height: 175 }} />

        {/* hero carousel */}
        <div style={{ paddingTop: 20, backgroundColor: '#fff' }}>
          <FeaturedCarousel events={upcoming} loading={loading} onCardClick={handleCardClick} />
        </div>

        {/* sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <Section
            title="À ne pas manquer"
            events={upcoming.slice(0, 12)}
            loading={loading}
            onCardClick={handleCardClick}
          />
          <Section
            title="Près de chez vous"
            events={nearby}
            loading={loading}
            onCardClick={handleCardClick}
          />
          <Section
            title="Expositions"
            events={expositions.slice(0, 10)}
            loading={loading}
            onCardClick={handleCardClick}
          />
          <Section
            title="Marchés créateurs"
            events={marches.slice(0, 10)}
            loading={loading}
            onCardClick={handleCardClick}
          />
        </motion.div>

        {/* empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 32px' }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ev-sort-active)', margin: '0 0 6px' }}>
              Aucun événement trouvé
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>
              Essayez un autre mot-clé ou une autre ville
            </p>
          </div>
        )}
      </div>
    </>
  )
}
