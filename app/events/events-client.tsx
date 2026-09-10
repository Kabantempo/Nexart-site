'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Event as NexartEvent } from '@/lib/types'
import { colors } from '@/lib/design-tokens'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

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
  if (status === 'published') return { label: 'Ouvert', color: colors.feedback.success.solid }
  if (status === 'closed') return { label: 'Complet', color: colors.feedback.danger.solid }
  return { label: 'Bientôt', color: colors.feedback.warning.solid }
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
      backgroundColor: 'var(--ev-card-bg)', overflow: 'hidden', scrollSnapAlign: 'start',
    }}>
      <div style={{ width: '100%', height: IMG_H, background: 'linear-gradient(90deg,var(--ev-card-tag-bg) 25%,var(--ev-skeleton-1) 50%,var(--ev-card-tag-bg) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 13, borderRadius: 4, backgroundColor: 'var(--ev-card-tag-bg)', width: '90%', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ height: 13, borderRadius: 4, backgroundColor: 'var(--ev-card-tag-bg)', width: '70%', animation: 'shimmer 1.4s infinite' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <div style={{ height: 20, borderRadius: 4, backgroundColor: 'var(--ev-card-tag-bg)', width: 60 }} />
          <div style={{ height: 20, borderRadius: 4, backgroundColor: 'var(--ev-card-tag-bg)', width: 50 }} />
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
        flexShrink: 0, width: CARD_W, borderRadius: 6,
        backgroundColor: 'var(--ev-card-bg)', overflow: 'hidden',
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
          <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--ev-card-bg2)' }} />
        )}
        {/* status badge */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          backgroundColor: st.color, color: colors.text.white,
          fontSize: 10, fontWeight: 700, borderRadius: 4,
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
          color: 'var(--ev-card-title)', display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.title}
        </p>

        {/* tags — wrap freely */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tags.map(tag => (
              <span key={tag} style={{
                backgroundColor: 'var(--ev-card-tag-bg)', color: 'var(--ev-card-tag-text)',
                fontSize: 10, fontWeight: 600, borderRadius: 4,
                padding: '3px 8px',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--ev-card-date)' }}>
            {formatDate(event.start_date)}{event.city ? ` · ${event.city}` : ''}
          </span>
          <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--ev-card-title)' }}>
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
      <div style={{ overflowX: 'auto', scrollSnapType: 'x mandatory', scrollPaddingLeft: 16, overscrollBehaviorX: 'contain' }} className="hide-scrollbar">
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
        height: 200, backgroundColor: colors.dark.deep,
        background: 'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-tag-bg) 50%,var(--ev-card-bg) 75%)',
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
          height: 200, position: 'relative', backgroundColor: colors.dark.deep,
        }}
      >
        {/* background image */}
        {ev.cover_image ? (
          <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--ev-card-bg2)' }} />
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
            color: colors.text.white, lineHeight: 1.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {ev.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {tags.slice(0, 2).map(t => (
                <span key={t} style={{
                  backgroundColor: 'rgba(99,102,241,0.25)', color: colors.purple.bgPale,
                  fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 8px',
                }}>{t}</span>
              ))}
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: colors.text.white }}>
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
              backgroundColor: i === active ? colors.violet.primary : colors.border.default,
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
  const user = useAuthStore(s => s.user)
  const [events, setEvents] = useState<NexartEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('tous')
  const [sortBy, setSortBy] = useState<string>('date-asc')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [cityFilter, setCityFilter] = useState('all')
  const [gratuitOnly, setGratuitOnly] = useState(false)
  const [bientotOnly, setBientotOnly] = useState(false)
  const [disciplines, setDisciplines] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('creator_profiles').select('disciplines').eq('id', user.id).single()
      .then(({ data }) => { if (data?.disciplines?.length) setDisciplines(data.disciplines) })
  }, [user?.id])

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
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

  const pourVous = disciplines.length > 0
    ? applySort(events.filter(e => {
        const hay = [...(e.theme ?? []), ...(e.discipline_tags ?? [])].map(s => s.toLowerCase())
        return disciplines.some(d => hay.some(h => h.includes(d.toLowerCase()) || d.toLowerCase().includes(h)))
      }).filter(e => new Date(e.start_date) >= now)).slice(0, 10)
    : []

  const uniqueEventCities = [...new Set(events.map(e => e.city).filter(Boolean))].sort() as string[]
  const TYPE_FILTERS = [
    { key: 'tous',      label: 'Tous'      },
    { key: 'salon',     label: 'Salons'    },
    { key: 'popup',     label: 'Pop-ups'   },
    { key: 'fair',      label: 'Foires'    },
    { key: 'seasonal',  label: 'Saisonniers' },
    { key: 'permanent', label: 'Permanent' },
  ]
  const SORT_OPTIONS = [
    { key: 'date-asc',   label: 'Date (plus proche)'   },
    { key: 'date-desc',  label: 'Date (plus lointaine)' },
    { key: 'price-asc',  label: 'Prix croissant'        },
    { key: 'price-desc', label: 'Prix décroissant'      },
    { key: 'recent',     label: 'Ajouté récemment'      },
    { key: 'alpha',      label: 'A → Z'                 },
  ]

  const desktopFiltered = filtered
    .filter(e => cityFilter === 'all' || e.city === cityFilter)
    .filter(e => !gratuitOnly || !e.stand_price || e.stand_price === 0)
    .filter(e => {
      if (!bientotOnly) return true
      const d = new Date(e.start_date)
      const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    })

  const hasDesktopFilters = activeFilter !== 'tous' || cityFilter !== 'all' || gratuitOnly || bientotOnly || !!search
  const resetDesktopFilters = () => { setActiveFilter('tous'); setCityFilter('all'); setGratuitOnly(false); setBientotOnly(false); setSearch('') }

  const handleCardClick = (id: string) => router.push(`/events/${id}`)
  const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  // ── Desktop layout (≥ 1024px) ───────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
        <style>{`
          @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
          .ev-dcard { transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
          .ev-dcard:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(99,102,241,0.12); border-color: ${colors.violet.primary} !important; }
          .ev-dchip { transition: background 120ms, color 120ms; cursor: pointer; }
          .ev-dchip:hover { background: ${colors.violet.primary}18 !important; color: ${colors.violet.primary} !important; }
        `}</style>

        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: 1380, margin: '0 auto', padding: '48px 48px 36px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.violet.primary, margin: '0 0 12px' }}>Agenda</p>
                <h1 style={{ fontSize: 52, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 10px' }}>Événements</h1>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>Marchés, pop-ups et salons partout en France</p>
              </div>
              <div style={{ display: 'flex', gap: 40 }}>
                {[
                  { val: events.length,              label: 'événements'  },
                  { val: uniqueEventCities.length,   label: 'villes'      },
                  { val: events.filter(e => new Date(e.start_date) >= new Date()).length, label: 'à venir' },
                ].map(({ val, label }) => (
                  <div key={label} style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.05em', lineHeight: 1 }}>{val}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 560 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={colors.text.secondary} strokeWidth={2.5} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Ville, nom d'événement…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoComplete="off"
                onFocus={e => { e.currentTarget.style.borderColor = colors.violet.primary }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
                style={{ width: '100%', paddingLeft: 44, paddingRight: search ? 44 : 18, paddingTop: 14, paddingBottom: 14, borderRadius: 6, border: '1.5px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 150ms' }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: colors.text.secondary, display: 'flex' }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', alignItems: 'flex-start', padding: '0 0 100px' }}>

          {/* Sidebar */}
          <aside style={{ width: 248, flexShrink: 0, padding: '36px 0 36px 48px', position: 'sticky', top: 64, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 70px)', overflowY: 'auto' }}>

            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 2px', letterSpacing: '-0.04em', lineHeight: 1 }}>{desktopFiltered.length}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>résultat{desktopFiltered.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Type */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Type</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {TYPE_FILTERS.map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveFilter(key)} className="ev-dchip"
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: activeFilter === key ? 700 : 500, backgroundColor: activeFilter === key ? `${colors.violet.primary}14` : 'transparent', color: activeFilter === key ? colors.violet.primary : 'var(--text-primary)', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '20px 0' }} />

            {/* City */}
            {uniqueEventCities.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Ville</p>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1.5px solid ${cityFilter !== 'all' ? colors.violet.primary : 'var(--border-color)'}`, backgroundColor: cityFilter !== 'all' ? `${colors.violet.primary}08` : 'var(--bg-secondary)', color: cityFilter !== 'all' ? colors.violet.primary : 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="all">Toutes les villes</option>
                  {uniqueEventCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {/* Sort */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 8px' }}>Trier par</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {SORT_OPTIONS.map(({ key, label }) => (
                  <button key={key} onClick={() => setSortBy(key)} className="ev-dchip"
                    style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: sortBy === key ? 700 : 500, backgroundColor: sortBy === key ? `${colors.violet.primary}14` : 'transparent', color: sortBy === key ? colors.violet.primary : 'var(--text-primary)', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '20px 0' }} />

            {/* Toggles */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--text-secondary)', margin: '0 0 12px' }}>Options</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div onClick={() => setGratuitOnly(v => !v)} style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: gratuitOnly ? colors.green.primary : 'var(--border-color)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: gratuitOnly ? 16 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: gratuitOnly ? 600 : 400, color: gratuitOnly ? colors.green.primary : 'var(--text-secondary)' }}>Gratuit</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <div onClick={() => setBientotOnly(v => !v)} style={{ width: 34, height: 20, borderRadius: 10, backgroundColor: bientotOnly ? colors.violet.primary : 'var(--border-color)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: bientotOnly ? 16 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: bientotOnly ? 600 : 400, color: bientotOnly ? colors.violet.primary : 'var(--text-secondary)' }}>Dans les 30 jours</span>
                </label>
              </div>
            </div>

            {hasDesktopFilters && (
              <button onClick={resetDesktopFilters} style={{ fontSize: 12, fontWeight: 600, color: colors.feedback.danger.solid, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                Effacer les filtres
              </button>
            )}
          </aside>

          {/* Main */}
          <main style={{ flex: 1, padding: '32px 48px 0 32px', minWidth: 0 }}>
            {pourVous.length > 0 && !loading && (
              <div style={{ marginBottom: 36 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: colors.violet.primary }}>Pour vous</p>
                  <div style={{ flex: 1, height: 1, backgroundColor: `${colors.violet.primary}20` }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {pourVous.slice(0, 3).map((ev, i) => {
                    const st = statusLabel(ev.status)
                    const tags = getTagsFromEvent(ev)
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: i * 0.06 }}
                        onClick={() => handleCardClick(ev.id)}
                        className="ev-dcard"
                        style={{ borderRadius: 6, backgroundColor: 'var(--ev-card-bg)', border: `1.5px solid ${colors.violet.primary}30`, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                      >
                        <div style={{ position: 'relative', width: '100%', height: 160, flexShrink: 0, backgroundColor: 'var(--ev-card-bg2)' }}>
                          {ev.cover_image && <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} sizes="320px" />}
                          <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: st.color, color: colors.text.white, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{st.label}</span>
                        </div>
                        <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                          <p style={{ margin: 0, color: 'var(--ev-card-title)', fontSize: 14, fontWeight: 700, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', lineHeight: 1.35 }}>{ev.title}</p>
                          {tags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {tags.map(tag => (
                                <span key={tag} style={{ backgroundColor: `${colors.violet.primary}12`, color: colors.violet.primary, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4 }}>{tag}</span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: `1px solid ${colors.violet.primary}18` }}>
                            <span style={{ fontSize: 11, color: 'var(--ev-card-date)' }}>
                              {ev.start_date ? formatDate(ev.start_date) : ''}{ev.city ? ` · ${ev.city}` : ''}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--ev-card-title)' }}>{formatPrice(ev.stand_price)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                <div style={{ height: 1, backgroundColor: 'var(--border-color)', margin: '28px 0 0' }} />
              </div>
            )}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ height: 180, background: 'linear-gradient(90deg,var(--ev-skeleton-1) 25%,var(--ev-chip-bg) 50%,var(--ev-skeleton-1) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ height: 14, borderRadius: 6, backgroundColor: 'var(--ev-chip-bg)', width: '85%' }} />
                      <div style={{ height: 11, borderRadius: 6, backgroundColor: 'var(--ev-chip-bg)', width: '55%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : desktopFiltered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--border-color)" strokeWidth={1.5} style={{ margin: '0 auto 16px', display: 'block' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>Aucun résultat</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>Essayez de modifier vos filtres.</p>
                <button onClick={resetDesktopFilters} style={{ padding: '10px 24px', borderRadius: 6, border: `1.5px solid ${colors.violet.primary}`, backgroundColor: 'transparent', color: colors.violet.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Réinitialiser</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {desktopFiltered.map((ev, i) => {
                  const st = statusLabel(ev.status)
                  const tags = getTagsFromEvent(ev)
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.24) }}
                      onClick={() => handleCardClick(ev.id)}
                      className="ev-dcard"
                      style={{ borderRadius: 6, backgroundColor: 'var(--ev-card-bg)', border: '1px solid var(--border-color)', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: 180, flexShrink: 0, backgroundColor: 'var(--ev-card-bg2)' }}>
                        {ev.cover_image && <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} sizes="320px" />}
                        <span style={{ position: 'absolute', top: 10, left: 10, backgroundColor: st.color, color: colors.text.white, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>{st.label}</span>
                        {(!ev.stand_price || ev.stand_price === 0) && (
                          <span style={{ position: 'absolute', top: 10, right: 10, backgroundColor: colors.green.primary, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>Gratuit</span>
                        )}
                      </div>
                      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        <p style={{ margin: 0, color: 'var(--ev-card-title)', fontSize: 15, fontWeight: 700, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', lineHeight: 1.35 }}>{ev.title}</p>
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {tags.map(tag => (
                              <span key={tag} style={{ backgroundColor: 'var(--ev-card-tag-bg)', color: 'var(--ev-card-tag-text)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4 }}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: 12, color: 'var(--ev-card-date)' }}>
                            {ev.start_date ? formatDate(ev.start_date) : ''}{ev.city ? ` · ${ev.city}` : ''}
                          </span>
                          <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--ev-card-title)' }}>{formatPrice(ev.stand_price)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
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

      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>
        {/* header: title + search + filters */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--ev-border)',
        }}>
          {/* title + count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 6px' }}>
            <h1 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--ev-card-title)', letterSpacing: -0.5 }}>
              Événements
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
              backgroundColor: 'var(--ev-chip-bg)', padding: '3px 9px', borderRadius: 4,
            }}>
              {filtered.length} résultats
            </span>
          </div>
          {/* search bar */}
          <div style={{ padding: '0 12px 8px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: 'var(--bg-secondary)',
              border: '1.5px solid var(--border-color)',
              borderRadius: 6, padding: '10px 14px',
            }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth={2.5} style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Ville, nom d'événement…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', backgroundColor: 'inherit', caretColor: colors.violet.primary }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-secondary)" strokeWidth={2.5}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {/* type filter chips */}
          <div style={{ overflowX: 'auto', scrollPaddingLeft: 12 }} className="hide-scrollbar">
            <div style={{ display: 'flex', gap: 6, paddingLeft: 12, paddingRight: 12, paddingBottom: 8 }}>
              {FILTERS.map(f => {
                const isActive = activeFilter === f.key
                return (
                  <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                    flexShrink: 0, padding: '6px 13px', borderRadius: 4, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    border: isActive ? 'none' : '1px solid var(--ev-border)',
                    background: isActive
                      ? `linear-gradient(135deg, ${colors.violet.primary}, ${colors.violet.hover})`
                      : 'transparent',
                    color: isActive ? '#fff' : 'var(--ev-chip-text)',
                    boxShadow: isActive ? `0 2px 10px ${colors.violet.ring}` : 'none',
                    transition: 'all 0.15s ease',
                  }}>
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>
          {/* sort + filters row */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px 10px', gap: 6 }}>
            <div style={{
              display: 'flex', borderRadius: 4, overflow: 'hidden',
              border: '1px solid var(--ev-border)', flexShrink: 0,
            }}>
              <button onClick={() => setSortBy(sortBy === 'date-asc' ? 'date-desc' : 'date-asc')} style={{
                padding: '5px 11px', border: 'none', borderRight: '1px solid var(--ev-border)',
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                backgroundColor: sortBy.startsWith('date') ? colors.violet.primary : 'transparent',
                color: sortBy.startsWith('date') ? '#fff' : 'var(--ev-chip-text)',
                transition: 'background 0.15s, color 0.15s',
              }}>
                Date {sortBy === 'date-desc' ? '↓' : '↑'}
              </button>
              <button onClick={() => setSortBy(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')} style={{
                padding: '5px 11px', border: 'none',
                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                backgroundColor: sortBy.startsWith('price') ? colors.violet.primary : 'transparent',
                color: sortBy.startsWith('price') ? '#fff' : 'var(--ev-chip-text)',
                transition: 'background 0.15s, color 0.15s',
              }}>
                Prix {sortBy === 'price-desc' ? '↓' : '↑'}
              </button>
            </div>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowAdvanced(v => !v)} style={{
              padding: '5px 11px', borderRadius: 4,
              border: `1.5px solid ${showAdvanced ? colors.violet.primary : 'var(--ev-border)'}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: showAdvanced ? `${colors.violet.primary}18` : 'transparent',
              color: showAdvanced ? colors.violet.primary : 'var(--ev-chip-text)',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s ease',
            }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3 6h18M7 12h10M11 18h2" />
              </svg>
              Filtres
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
                  color: sortBy === s.key ? colors.violet.primary : 'var(--ev-chip-text)',
                  fontSize: 13, fontWeight: sortBy === s.key ? 600 : 400,
                }}>
                  {s.label}
                  {sortBy === s.key && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={colors.violet.primary} strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* hero carousel */}
        <div style={{ paddingTop: 20, backgroundColor: 'var(--bg-primary)' }}>
          <FeaturedCarousel events={upcoming} loading={loading} onCardClick={handleCardClick} />
        </div>

        {/* sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {pourVous.length > 0 && (
            <Section
              title="Pour vous"
              events={pourVous}
              loading={false}
              onCardClick={handleCardClick}
            />
          )}
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
            <p style={{ fontSize: 13, color: colors.text.light }}>
              Essayez un autre mot-clé ou une autre ville
            </p>
          </div>
        )}
      </div>
    </>
  )
}
