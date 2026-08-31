'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { MapPin, Clock, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { colors } from '@/lib/design-tokens'
import { NexPagination } from '@/components/ui/nex-pagination'

type Ev    = { kind: 'event';   id: string; title: string; city?: string; start_date?: string; cover_image?: string; discipline_tags?: string[]; event_type?: string; stand_price?: number }
type Cr    = { kind: 'creator'; id: string; full_name?: string; city?: string; disciplines?: string[]; avatar_url?: string; portfolio_images?: string[]; siret_verified?: boolean; app_count?: number; subscription_tier?: string }
type Prod  = { kind: 'product'; id: string; title: string; price?: number; images?: string[]; category?: string; creator_id: string; creator_name?: string; creator_avatar?: string; subscription_tier?: string }
type Photo = { img: string; creator_id: string; creator_name?: string; creator_avatar?: string; discipline?: string; subscription_tier?: string }

const PAGE = 24

// ── Pour vous — events par disciplines du créateur ────────────────────────────
function useForYou(userId: string | undefined) {
  const [byDiscipline, setByDiscipline] = useState<{ label: string; items: Ev[] }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    supabase.from('creator_profiles').select('disciplines').eq('user_id', userId).single()
      .then(({ data }) => {
        const disciplines: string[] = data?.disciplines || []
        if (disciplines.length === 0) { setLoading(false); return }
        const top = disciplines.slice(0, 4)
        Promise.all(
          top.map(disc =>
            supabase.from('events')
              .select('id,title,city,start_date,cover_image,discipline_tags,event_type,stand_price,status')
              .eq('status', 'published')
              .contains('discipline_tags', [disc])
              .order('start_date', { ascending: true })
              .limit(6)
              .then(({ data: evs }) => ({
                label: disc,
                items: ((evs || []) as any[]).map(e => ({ kind: 'event' as const, ...e })) as Ev[],
              }))
          )
        ).then(results => {
          setByDiscipline(results.filter(r => r.items.length > 0))
          setLoading(false)
        })
      })
  }, [userId])

  return { byDiscipline, loading }
}

// ── Featured creator (boosted or premium) ────────────────────────────────────
type FeaturedCr = { id: string; full_name?: string; city?: string; disciplines?: string[]; avatar_url?: string; portfolio_images?: string[]; siret_verified?: boolean; subscription_tier?: string }

function useFeaturedCreator() {
  const [creator, setCreator] = useState<FeaturedCr | null>(null)

  useEffect(() => {
    const now = new Date().toISOString()
    supabase
      .from('profiles')
      .select('id,full_name,avatar_url,subscription_tier,profile_boosted_until,creator_profiles(city,disciplines,portfolio_images,siret_verified)')
      .or(`profile_boosted_until.gt.${now},subscription_tier.in.(premium,pro,org_studio,org_pro)`)
      .order('profile_boosted_until', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (!data) return
        const cp = (data as any).creator_profiles
        if (!cp) return
        setCreator({
          id: data.id,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          subscription_tier: data.subscription_tier,
          city: cp.city,
          disciplines: cp.disciplines,
          portfolio_images: cp.portfolio_images,
          siret_verified: cp.siret_verified,
        })
      })
  }, [])

  return creator
}

// ── Portfolio photos (from creator_profiles.portfolio_images) ─────────────────
function usePortfolioPhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    supabase
      .from('creator_profiles')
      .select('user_id,portfolio_images,disciplines,profiles(full_name,avatar_url,subscription_tier)')
      .not('profiles', 'is', null)
      .order('user_id', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        const flat: Photo[] = []
        for (const c of ((data as any[]) || [])) {
          const imgs: string[] = c.portfolio_images || []
          const avatar: string | undefined = c.profiles?.avatar_url
          // Use portfolio images (max 2) or fall back to avatar
          const sources = imgs.length > 0 ? imgs.slice(0, 2) : (avatar ? [avatar] : [])
          for (const img of sources) {
            flat.push({
              img,
              creator_id: c.user_id,
              creator_name: c.profiles?.full_name,
              creator_avatar: avatar,
              discipline: (c.disciplines || [])[0],
              subscription_tier: c.profiles?.subscription_tier,
            })
          }
        }
        setPhotos(flat)
      })
  }, [])

  return photos
}

function useFeed(filter: 'all' | 'events' | 'creators', page: number) {
  const [events,   setEvents]   = useState<Ev[]>([])
  const [creators, setCreators] = useState<Cr[]>([])
  const [products, setProducts] = useState<Prod[]>([])
  const [loading,  setLoading]  = useState(true)
  const [hasMore,  setHasMore]  = useState(true)

  const load = useCallback(async (p: number, f: typeof filter) => {
    setLoading(true)
    const from = p * PAGE
    const [evRes, crRes, prRes] = await Promise.all([
      f !== 'creators'
        ? supabase.from('events').select('id,title,city,start_date,cover_image,discipline_tags,event_type,stand_price,status').eq('status','published').order('start_date',{ascending:true}).range(from, from + PAGE - 1)
        : Promise.resolve({ data: [] }),
      f !== 'events'
        ? supabase.from('creator_profiles').select('user_id,city,disciplines,portfolio_images,siret_verified,profiles(full_name,avatar_url,subscription_tier)').order('user_id',{ascending:false}).range(0, 9)
        : Promise.resolve({ data: [] }),
      p === 0
        ? supabase.from('products').select('id,title,price,images,category,creator_id,profiles!creator_id(full_name,avatar_url,subscription_tier)').eq('is_available', true).order('created_at',{ascending:false}).limit(12)
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
      subscription_tier: c.profiles?.subscription_tier,
    }))
    const prods: Prod[] = ((prRes as any).data||[]).map((pr: any) => ({
      kind: 'product' as const,
      id: pr.id,
      title: pr.title,
      price: pr.price,
      images: pr.images,
      category: pr.category,
      creator_id: pr.creator_id,
      creator_name: pr.profiles?.full_name,
      creator_avatar: pr.profiles?.avatar_url,
      subscription_tier: pr.profiles?.subscription_tier,
    }))
    if (p === 0) { setEvents(evs); setCreators(crs); setProducts(prods) }
    else         { setEvents(prev => [...prev, ...evs]) }
    setHasMore(evs.length >= PAGE)
    setLoading(false)
  }, [])

  useEffect(() => { setEvents([]); setCreators([]); setProducts([]); load(0, filter) }, [filter, load])
  useEffect(() => { if (page > 0) load(page, filter) }, [page, filter, load])
  return { events, creators, products, loading, hasMore }
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function groupByDate(events: Ev[]): { label: string; items: Ev[] }[] {
  const map = new Map<string, Ev[]>()
  for (const ev of events) {
    const key = ev.start_date
      ? new Date(ev.start_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Date à confirmer'
    const arr = map.get(key) || []
    arr.push(ev)
    map.set(key, arr)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  marche: 'Marché',
  festival: 'Festival',
  vide_grenier: 'Vide-grenier',
  foire: 'Foire',
  salon: 'Salon',
}

// ── Featured Card (top, full-width) ──────────────────────────────────────────
function FeaturedCard({ item, onClick }: { item: Ev; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const d = item.start_date ? new Date(item.start_date) : null
  const day = d?.toLocaleDateString('fr-FR', { day: '2-digit' })
  const mon = d?.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
  const time = d?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', marginBottom: 28, height: 260, transition: 'box-shadow 0.2s', boxShadow: hovered ? '0 12px 40px rgba(99,102,241,0.18)' : '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {item.cover_image
        ? <Image src={item.cover_image} alt={item.title} fill sizes="1100px" style={{ objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.03)' : 'scale(1)' }} />
        : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors.violet.primary}, ${colors.purple.violet})` }} />
      }
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
      {/* Featured pill */}
      <span style={{ position: 'absolute', top: 16, left: 16, backgroundColor: colors.violet.primary, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '4px 10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        ★ À la une
      </span>
      {/* Info bottom-left */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        {item.event_type && EVENT_TYPE_LABELS[item.event_type] && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{EVENT_TYPE_LABELS[item.event_type]}</span>
        )}
        <p style={{ margin: '4px 0 8px', fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, maxWidth: 480, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{item.title}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {item.city && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}><MapPin size={11} />{item.city}</span>}
          {time    && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}><Clock size={11} />{time}</span>}
          {d       && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            {d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          </span>}
        </div>
      </div>
      {/* Date badge */}
      {d && (
        <div className="date-badge" style={{ position: 'absolute', top: 16, right: 16, borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 44 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{day}</div>
          <div style={{ fontSize: 9,  fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{mon}</div>
        </div>
      )}
    </div>
  )
}

// ── Featured Creator Card ─────────────────────────────────────────────────────
function FeaturedCreatorCard({ item, onClick }: { item: FeaturedCr; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const imgs = item.portfolio_images || []
  const bgImg = imgs[0] || item.avatar_url
  const initials = item.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', marginBottom: 28, height: 220, transition: 'box-shadow 0.2s', boxShadow: hovered ? '0 12px 40px rgba(99,102,241,0.22)' : '0 2px 8px rgba(0,0,0,0.08)', display: 'flex' }}
    >
      {/* Background — mosaic or single image */}
      {imgs.length >= 2 ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '55% 45%', gap: 2 }}>
          {imgs.slice(0, 2).map((img, i) => (
            <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
              <Image src={img} alt="" fill sizes="600px" style={{ objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
            </div>
          ))}
        </div>
      ) : bgImg ? (
        <Image src={bgImg} alt={item.full_name || ''} fill sizes="1100px" style={{ objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.03)' : 'scale(1)' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${colors.violet.primary}, ${colors.purple.violet})` }} />
      )}
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%)' }} />

      {/* Featured pill */}
      <span style={{ position: 'absolute', top: 16, left: 16, background: 'linear-gradient(135deg, #6366F1, #818CF8)', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '4px 10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        ★ Créateur à la une
      </span>

      {/* Info */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, right: '42%' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.5)', flexShrink: 0, backgroundColor: colors.violet.bg }}>
            {item.avatar_url
              ? <Image src={item.avatar_url} alt={item.full_name || ''} width={44} height={44} style={{ objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>{initials}</div>
            }
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>{item.full_name || 'Créateur'}</p>
              {item.siret_verified && <CheckCircle2 size={14} color="#fff" fill={colors.violet.primary} />}
              {isPremium(item.subscription_tier) && <PremiumBadge size={14} />}
            </div>
            {item.city && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}><MapPin size={10} />{item.city}</span>}
          </div>
        </div>
        {/* Disciplines */}
        {(item.disciplines || []).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(item.disciplines || []).slice(0, 3).map(d => (
              <span key={d} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(99,102,241,0.55)', borderRadius: 20, padding: '2px 8px', backdropFilter: 'blur(4px)' }}>{d}</span>
            ))}
          </div>
        )}
      </div>

      {/* Mosaic extra images top-right */}
      {imgs.length >= 3 && (
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 4 }}>
          {imgs.slice(2, 5).map((img, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Image src={img} alt="" width={36} height={36} style={{ objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ item, onClick }: { item: Ev; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const d = item.start_date ? new Date(item.start_date) : null
  const day = d?.toLocaleDateString('fr-FR', { day: '2-digit' })
  const mon = d?.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
  const time = d?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const typeLabel = item.event_type ? EVENT_TYPE_LABELS[item.event_type] : null

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s', transform: hovered ? 'translateY(-3px)' : 'none', boxShadow: hovered ? '0 8px 28px rgba(99,102,241,0.13)' : '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
        {item.cover_image
          ? <Image src={item.cover_image} alt={item.title} fill sizes="(max-width:600px) 100vw, 360px" style={{ objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors.violet.bg}, ${colors.violet.bgHover})` }} />
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

        {/* Type label bottom-left on image */}
        {typeLabel && (
          <span style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: 'rgba(255,255,255,0.9)', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {typeLabel}
          </span>
        )}

        {/* Date badge bottom-right on image */}
        {d && (
          <div className="date-badge" style={{ position: 'absolute', bottom: 8, right: 10, borderRadius: 6, padding: '3px 7px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{day}</div>
            <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mon}</div>
          </div>
        )}

        {/* Price */}
        {item.stand_price != null && item.stand_price > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
            {item.stand_price}€
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          {item.city && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--text-secondary)' }}><MapPin size={9} />{item.city}</span>}
          {time      && <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: 'var(--text-secondary)' }}><Clock size={9} />{time}</span>}
        </div>
        {(item.discipline_tags || []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(item.discipline_tags || []).slice(0, 3).map((t: string) => (
              <span key={t} style={{ fontSize: 9, fontWeight: 600, color: colors.violet.text, backgroundColor: colors.violet.bg, borderRadius: 20, padding: '2px 7px' }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Premium badge ─────────────────────────────────────────────────────────────
const PREMIUM_TIERS = ['premium', 'pro', 'org_pro', 'org_studio']
function isPremium(tier?: string) { return !!tier && PREMIUM_TIERS.includes(tier) }

function PremiumBadge({ size = 12 }: { size?: number }) {
  return (
    <span title="Abonnement Premium" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size + 4, height: size + 4, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #818CF8)', flexShrink: 0 }}>
      <svg width={size - 2} height={size - 2} viewBox="0 0 12 12" fill="none">
        <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="#fff" />
      </svg>
    </span>
  )
}

// ── Creator bubble (Shotgun "Artists" style) ──────────────────────────────────
function CreatorBubble({ item, onClick }: { item: Cr & { subscription_tier?: string }; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const initials = item.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const img = item.avatar_url || item.portfolio_images?.[0]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flexShrink: 0, width: 100, textAlign: 'center', cursor: 'pointer' }}
    >
      {/* Circular avatar */}
      <div style={{ position: 'relative', width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 8px', backgroundColor: colors.violet.bg, border: `2px solid ${hovered ? colors.violet.primary : 'transparent'}`, transition: 'border-color 0.18s, transform 0.18s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}>
        {img
          ? <Image src={img} alt={item.full_name || ''} fill sizes="72px" style={{ objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: colors.violet.text }}>{initials}</div>
        }
        {item.siret_verified && (
          <div style={{ position: 'absolute', bottom: 2, right: 2, backgroundColor: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={12} color={colors.violet.primary} fill={colors.violet.primary} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, margin: '0 0 2px' }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.full_name || 'Créateur'}
        </p>
        {isPremium(item.subscription_tier) && <PremiumBadge size={11} />}
      </div>
      {(item.disciplines || []).length > 0 && (
        <p style={{ margin: 0, fontSize: 9, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.disciplines![0]}
        </p>
      )}
    </div>
  )
}

// ── Portfolio Card ────────────────────────────────────────────────────────────
function PortfolioCard({ item, onClick }: { item: Prod; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const img = item.images?.[0]
  const initials = item.creator_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ flexShrink: 0, width: 200, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', transition: 'box-shadow 0.18s, transform 0.18s', boxShadow: hovered ? '0 8px 24px rgba(99,102,241,0.14)' : '0 1px 4px rgba(0,0,0,0.06)', transform: hovered ? 'translateY(-2px)' : 'none' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: 200, height: 200, overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
        {img
          ? <Image src={img} alt={item.title} fill sizes="200px" style={{ objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${colors.violet.bg}, ${colors.violet.bgHover})` }}>
              <span style={{ fontSize: 36, color: colors.violet.text, fontWeight: 800 }}>{initials}</span>
            </div>
        }
        {item.price != null && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
            {item.price}€
          </span>
        )}
      </div>
      {/* Info */}
      <div style={{ padding: '8px 10px 10px' }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </p>
        {/* Creator row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', backgroundColor: colors.violet.bg, flexShrink: 0 }}>
            {item.creator_avatar
              ? <Image src={item.creator_avatar} alt={item.creator_name || ''} width={18} height={18} style={{ objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: colors.violet.text }}>{initials[0]}</div>
            }
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.creator_name || 'Créateur'}
            </span>
            {isPremium(item.subscription_tier) && <PremiumBadge size={10} />}
          </div>
          {item.category && (
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, color: colors.violet.text, backgroundColor: colors.violet.bg, borderRadius: 20, padding: '1px 6px', flexShrink: 0 }}>
              {item.category}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Portfolio Photo Card (artwork from creator_profiles.portfolio_images) ──────
function PortfolioPhotoCard({ photo, onClick }: { photo: Photo & { subscription_tier?: string }; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const initials = photo.creator_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--bg-secondary)', marginBottom: 8, transition: 'transform 0.18s, box-shadow 0.18s', transform: hovered ? 'translateY(-2px)' : 'none', boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Image src={photo.img} alt={photo.creator_name || 'Créateur'} fill sizes="(max-width:600px) 33vw, 160px" style={{ objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', backgroundColor: colors.violet.bg, flexShrink: 0 }}>
          {photo.creator_avatar
            ? <Image src={photo.creator_avatar} alt={photo.creator_name || ''} width={20} height={20} style={{ objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: colors.violet.text }}>{initials[0]}</div>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {photo.creator_name || 'Créateur'}
            </p>
            {isPremium(photo.subscription_tier) && <PremiumBadge size={11} />}
          </div>
          {photo.discipline && (
            <p style={{ margin: 0, fontSize: 9, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {photo.discipline}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <div style={{ aspectRatio: '16/10', backgroundImage: 'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }} />
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ height: 13, backgroundImage: 'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 10, width: '55%', backgroundImage: 'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', borderRadius: 6 }} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomeFeedClient() {
  const user   = useAuthStore(s => s.user)
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'events' | 'creators'>('all')
  const [page, setPage] = useState(0)
  const { events, creators, products, loading, hasMore } = useFeed(filter, page)
  const { byDiscipline } = useForYou(user?.id)
  const portfolioPhotos = usePortfolioPhotos()
  const featuredCreator = useFeaturedCreator()

  const featured = filter !== 'creators' ? events[0] : null
  const rest = filter !== 'creators' ? events.slice(1) : events
  const groups = groupByDate(rest)

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .feed-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 860px) { .feed-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 520px) { .feed-grid { grid-template-columns: 1fr; } }
        .creator-scroll { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .creator-scroll::-webkit-scrollbar { display: none; }
        .portfolio-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .portfolio-scroll::-webkit-scrollbar { display: none; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        @media (max-width: 520px) { .gallery-grid { grid-template-columns: repeat(3, 1fr); } }
        .date-badge { background: rgba(255,255,255,0.95); }
        @media (prefers-color-scheme: dark) { .date-badge { background: rgba(22,22,28,0.92); outline: 1px solid rgba(255,255,255,0.12); } }
        [data-theme="dark"] .date-badge { background: rgba(22,22,28,0.92); outline: 1px solid rgba(255,255,255,0.12); }
        [data-theme="light"] .date-badge { background: rgba(255,255,255,0.95); outline: none; }
      `}</style>

      {/* Sticky filter bar */}
      <div style={{ position: 'sticky', top: 58, zIndex: 9, backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', padding: '10px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Sparkles size={15} color={colors.violet.primary} />
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
              Fil d&apos;actu
              {user?.full_name && <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--text-secondary)', marginLeft: 6 }}>· Bonjour {user.full_name.split(' ')[0]} 👋</span>}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['all','Tout'],['events','Marchés'],['creators','Créateurs']] as const).map(([key, label]) => (
              <button key={key} onClick={() => { setFilter(key); setPage(0) }}
                style={{ padding: '5px 13px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s', backgroundColor: filter === key ? colors.violet.primary : 'var(--bg-secondary)', color: filter === key ? '#fff' : 'var(--text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Skeleton */}
        {loading && events.length === 0 && (
          <>
            <div style={{ borderRadius: 14, aspectRatio: '16/5', backgroundImage: 'linear-gradient(90deg,var(--ev-card-bg) 25%,var(--ev-card-bg2) 50%,var(--ev-card-bg) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear', marginBottom: 28 }} />
            <div className="feed-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        )}

        {/* Featured event */}
        {!loading && featured && filter !== 'creators' && (
          <FeaturedCard item={featured} onClick={() => router.push(`/events/${featured.id}`)} />
        )}

        {/* Featured creator */}
        {featuredCreator && filter !== 'events' && (
          <FeaturedCreatorCard item={featuredCreator} onClick={() => router.push(`/creators/${featuredCreator.id}`)} />
        )}

        {/* Creators section (horizontal scroll) */}
        {filter !== 'events' && !loading && creators.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Créateurs à découvrir
              </h2>
              <button onClick={() => router.push('/creators')}
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: colors.violet.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Voir tous <ChevronRight size={14} />
              </button>
            </div>
            <div className="creator-scroll">
              {creators.map(cr => (
                <CreatorBubble key={cr.id} item={cr} onClick={() => router.push(`/creators/${cr.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Pour vous — events par discipline du créateur */}
        {byDiscipline.length > 0 && filter !== 'creators' && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Sparkles size={15} color={colors.violet.primary} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pour vous
              </h2>
            </div>
            {byDiscipline.map(({ label, items }) => (
              <div key={label} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.violet.text, backgroundColor: colors.violet.bg, borderRadius: 20, padding: '3px 10px' }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{items.length} marché{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="portfolio-scroll">
                  {items.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => router.push(`/events/${ev.id}`)}
                      style={{ flexShrink: 0, width: 200, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: `1px solid var(--border-color)`, backgroundColor: 'var(--bg-primary)', transition: 'box-shadow 0.18s' }}
                    >
                      <div style={{ position: 'relative', width: 200, height: 130, overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                        {ev.cover_image
                          ? <Image src={ev.cover_image} alt={ev.title} fill sizes="200px" style={{ objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors.violet.bg}, ${colors.violet.bgHover})` }} />
                        }
                        {ev.start_date && (
                          <div className="date-badge" style={{ position: 'absolute', bottom: 6, right: 6, borderRadius: 5, padding: '2px 6px', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                              {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: '2-digit' })}
                            </div>
                            <div style={{ fontSize: 7, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                              {new Date(ev.start_date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '8px 10px 10px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title}
                        </p>
                        {ev.city && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-secondary)' }}>
                            <MapPin size={9} />{ev.city}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Portfolio section */}
        {filter !== 'events' && !loading && products.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Créations récentes
              </h2>
              <button onClick={() => router.push('/creators')}
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: colors.violet.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Voir les créateurs <ChevronRight size={14} />
              </button>
            </div>
            <div className="portfolio-scroll">
              {products.map(pr => (
                <PortfolioCard key={pr.id} item={pr} onClick={() => router.push(`/creators/${pr.creator_id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Portfolio photos section */}
        {filter !== 'events' && portfolioPhotos.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Galerie des créateurs
              </h2>
              <button onClick={() => router.push('/creators')}
                style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: colors.violet.primary, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Voir les créateurs <ChevronRight size={14} />
              </button>
            </div>
            <div className="gallery-grid">
              {portfolioPhotos.map((photo, i) => (
                <PortfolioPhotoCard key={`${photo.creator_id}-${i}`} photo={photo} onClick={() => router.push(`/creators/${photo.creator_id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Events grouped by date */}
        {filter !== 'creators' && !loading && groups.length === 0 && events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Aucun événement à venir</p>
          </div>
        )}

        {filter !== 'creators' && groups.map(({ label, items }) => (
          <section key={label} style={{ marginBottom: 32 }}>
            {/* Date header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </h2>
              <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border-color)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {items.length} événement{items.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="feed-grid">
              {items.map(ev => (
                <EventCard key={ev.id} item={ev} onClick={() => router.push(`/events/${ev.id}`)} />
              ))}
            </div>
          </section>
        ))}

        {/* Creators grid (filter = creators only) */}
        {filter === 'creators' && !loading && creators.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'flex-start' }}>
            {creators.map(cr => (
              <CreatorBubble key={cr.id} item={cr} onClick={() => router.push(`/creators/${cr.id}`)} />
            ))}
          </div>
        )}

        {/* Load more */}
        {filter !== 'creators' && events.length > 0 && (
          <NexPagination
            variant="load-more"
            hasMore={hasMore}
            loading={loading}
            loaded={events.length}
            onLoadMore={() => setPage(p => p + 1)}
            label="marchés"
          />
        )}
      </div>
    </div>
  )
}
