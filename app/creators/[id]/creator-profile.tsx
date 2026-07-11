'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ReportButton } from '@/components/ui/report-button'
import {
  ArrowLeft, MapPin, Tag, CheckCircle, Globe, Link2, QrCode,
  Heart, MessageCircle, X, Send, BadgeCheck, Star, Handshake,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useFavorites } from '@/lib/hooks'
import { ReviewForm } from '@/components/review-form'
import { useToast } from '@/components/ui/toast-provider'

interface Props { id: string }

interface CreatorData {
  id: string; full_name: string; bio?: string; avatar_url?: string; banner_url?: string
  username?: string; show_real_name?: boolean
  city?: string; region?: string; department?: string; travel_radius?: string
  disciplines?: string[]; portfolio_images?: string[]
  portfolio_grid?: { url: string; colSpan: 1|2|3; rowSpan: 1|2|3 }[]
  website?: string; instagram?: string; etsy?: string
  siret_verified?: boolean; insurance_verified?: boolean; created_at?: string
  open_to_collab?: boolean
}

const RADIUS_LABELS: Record<string, string> = {
  '5': '5 km', '10': '10 km', '25': '25 km', national: 'National',
}

type Review = {
  id: string
  rating: number
  comment?: string | null
  tags?: string[] | null
  created_at: string
  profiles?: { full_name: string; avatar_url?: string | null } | null
}

export function CreatorProfileClient({ id }: Props) {
  const [creator, setCreator] = useState<CreatorData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showMsg, setShowMsg] = useState(false)
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [sharedEventId, setSharedEventId] = useState<string | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [marchesCount, setMarchesCount] = useState<number | null>(null)
  const [boutiqueCount, setBoutiqueCount] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [itinerary, setItinerary] = useState<{ id: string; label: string; city?: string; start_date: string; end_date: string }[]>([])
  const user = useAuthStore((s) => s.user)
  const { favCreatorIds, toggleCreatorFav } = useFavorites(user?.id)

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: cp }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, bio, avatar_url, banner_url, role, created_at, username, show_real_name').eq('id', id).maybeSingle(),
        supabase.from('creator_profiles').select('disciplines, city, region, department, travel_radius, portfolio_images, portfolio_grid, website, instagram, etsy, siret_verified, insurance_verified, open_to_collab').eq('user_id', id).maybeSingle(),
      ])
      if (!p) { setError(true); setLoading(false); return }
      setCreator({ ...p, ...cp })
      setLoading(false)

      // Enregistrer la vue de profil (anonyme ou connectée)
      const { data: { session } } = await supabase.auth.getSession()
      const viewerId = session?.user?.id ?? null
      if (!viewerId || viewerId !== id) {
        supabase.from('profile_views').insert({ profile_id: id, viewer_id: viewerId }).then(() => {})
      }

      // Nombre de marchés participés (candidatures acceptées)
      const { count } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', id)
        .eq('status', 'accepted')
      setMarchesCount(count ?? 0)

      // Créateur actif : candidature acceptée dans les 6 derniers mois
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      const { count: recentCount } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', id)
        .eq('status', 'accepted')
        .gte('updated_at', sixMonthsAgo)
      setIsActive((recentCount ?? 0) > 0)

      // Boutique count
      const { count: prodCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', id)
        .eq('is_available', true)
      setBoutiqueCount(prodCount ?? 0)

      // Carnet de route public
      const today = new Date().toISOString().split('T')[0]
      const { data: itin } = await supabase
        .from('itinerary')
        .select('id, label, city, start_date, end_date')
        .eq('creator_id', id)
        .eq('is_public', true)
        .gte('end_date', today)
        .order('start_date', { ascending: true })
        .limit(3)
      setItinerary(itin || [])

      // Charger les avis séparément
      const { data: rv, error: rvErr } = await supabase
        .from('reviews')
        .select('id, rating, comment, tags, created_at, reviewer:profiles!reviewer_id(full_name, avatar_url)')
        .eq('reviewed_id', id)
        .order('created_at', { ascending: false })

      if (!rvErr && rv?.length) {
        const mapped = rv.map((r: Record<string, unknown>) => ({
          ...r,
          profiles: r.reviewer as Review['profiles'],
        }))
        setReviews(mapped as Review[])
      }
    }
    load()
  }, [id])

  // Vérifier si l'organisateur connecté peut laisser un avis
  useEffect(() => {
    if (!user || user.role !== 'organizer') return
    const checkSharedEvent = async () => {
      const { data: apps } = await supabase
        .from('applications')
        .select('event_id, events!inner(organizer_id)')
        .eq('creator_id', id)
        .eq('status', 'accepted')
        .eq('events.organizer_id', user.id)
        .limit(1)
        .maybeSingle()
      if (!apps) return
      const eventId = apps.event_id as string
      setSharedEventId(eventId)
      // Vérifier si l'avis existe déjà
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('event_id', eventId)
        .eq('reviewer_id', user.id)
        .eq('reviewed_id', id)
        .maybeSingle()
      setAlreadyReviewed(!!existing)
    }
    checkSharedEvent()
  }, [id, user])

  const sendMessage = async () => {
    if (!msgText.trim() || !user) return
    setSending(true)
    let convId: string | null = null
    const { data: existing } = await supabase.from('conversations').select('id').eq('creator_id', id).eq('organizer_id', user.id).maybeSingle()
    if (existing) { convId = existing.id }
    else {
      const { data: created } = await supabase.from('conversations').insert({ creator_id: id, organizer_id: user.id }).select('id').single()
      convId = created?.id ?? null
    }
    if (convId) {
      await supabase.from('messages').insert({ conversation_id: convId, sender_id: user.id, content: msgText.trim() })
      setSent(true); setMsgText('')
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error || !creator) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-red-500 text-base mb-4">Créateur introuvable</p>
      <Link href="/creators" className="text-indigo-600 font-semibold text-sm hover:underline">← Retour aux créateurs</Link>
    </div>
  )

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/creators/${id}` : `https://nexart.fr/creators/${id}`
  const isOwn = user?.id === id
  const displayName = creator.username || creator.full_name
  const showReal = creator.show_real_name !== false

  return (
    <div className="bg-white min-h-screen">

      {/* Message modal */}
      {showMsg && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowMsg(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="relative z-10 bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Envoyer un message</h3>
                <p className="text-sm text-gray-400 mt-0.5">à {creator.full_name}</p>
              </div>
              <button onClick={() => setShowMsg(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            {sent ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-bold text-gray-900 text-base mb-1">Message envoyé !</p>
                <p className="text-gray-500 text-sm mb-6">Retrouvez la conversation dans <Link href="/messages" className="text-indigo-600 font-semibold">vos messages</Link>.</p>
                <button onClick={() => setShowMsg(false)} className="px-7 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Fermer</button>
              </div>
            ) : (
              <>
                <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)}
                  placeholder={`Bonjour ${creator.full_name?.split(' ')[0]}, je souhaite…`} rows={5} autoFocus
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-[inherit] leading-relaxed"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowMsg(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">Annuler</button>
                  <button onClick={sendMessage} disabled={!msgText.trim() || sending}
                    className="flex-[2] py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#6366F1' }}>
                    <Send size={15} /> {sending ? 'Envoi…' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="bg-[#06060f] relative overflow-hidden">
        {/* Banner image */}
        {creator.banner_url && (
          <div className="absolute inset-0 z-0">
            <img src={creator.banner_url} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06060f]/60 to-[#06060f]" />
          </div>
        )}
        {!creator.banner_url && (
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-10 relative z-10">
          {/* Back link */}
          <Link href="/creators" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm font-medium mb-8 transition-colors">
            <ArrowLeft size={15} /> Retour aux créateurs
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl" style={{ position: 'relative', backgroundColor: '#1e1b4b' }}>
                {creator.avatar_url ? (
                  <Image src={creator.avatar_url} alt={creator.full_name} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjVGNUY3Ii8+PC9zdmc+" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#111827]">
                    <span className="text-4xl font-bold text-white/80">{creator.full_name?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              {(creator.siret_verified || creator.insurance_verified) && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#06060f] flex items-center justify-center">
                  <BadgeCheck size={14} className="text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
                {displayName}
                {creator.username && showReal && (
                  <span className="block text-sm font-normal text-white/40 mt-1">{creator.full_name}</span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {creator.city && (
                  <div className="flex items-center gap-1.5 text-white/50 text-sm">
                    <MapPin size={13} className="text-white/40 shrink-0" />
                    {creator.city}{creator.region ? `, ${creator.region}` : ''}
                  </div>
                )}
                {creator.travel_radius && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/60 text-xs font-semibold">
                    {RADIUS_LABELS[creator.travel_radius] || creator.travel_radius}
                  </span>
                )}
              </div>

              {/* Verification badges */}
              <div className="flex flex-wrap gap-2">
                {creator.siret_verified && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-semibold">
                    <CheckCircle size={12} /> SIRET vérifié
                  </span>
                )}
                {creator.insurance_verified && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/70 text-xs font-semibold">
                    <CheckCircle size={12} /> Assurance RC
                  </span>
                )}
                {creator.siret_verified && creator.insurance_verified && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#A5B4FC' }}>
                    ⭐ Créateur vérifié
                  </span>
                )}
                {isActive && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ADE80' }}>
                    ● Créateur actif
                  </span>
                )}
                {creator.created_at && (
                  <span className="flex items-center gap-1 text-white/25 text-xs">
                    Membre depuis {new Date(creator.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-7">
            {!user ? (
              <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: '#6366F1' }}>
                <MessageCircle size={15} /> Contacter
              </Link>
            ) : isOwn ? (
              <Link href="/profile" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/15 transition-colors">
                Éditer mon profil
              </Link>
            ) : (
              <button onClick={() => { setShowMsg(true); setSent(false) }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#6366F1' }}>
                <MessageCircle size={15} /> Envoyer un message
              </button>
            )}

            {user && !isOwn && (
              <button onClick={() => toggleCreatorFav(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  favCreatorIds.has(id)
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}>
                <Heart size={15} fill={favCreatorIds.has(id) ? 'currentColor' : 'none'} />
                {favCreatorIds.has(id) ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            )}

            <button onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm font-semibold transition-all">
              <QrCode size={15} /> QR code
            </button>
            {user && user.id !== id && (
              <div className="flex items-center" style={{ opacity: 0.5 }}>
                <ReportButton targetId={id} targetType="creator" reporterId={user.id} />
              </div>
            )}
          </div>

          {/* QR code inline */}
          {showQR && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-5 inline-flex flex-col items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="p-3 bg-white rounded-xl">
                <QRCodeSVG value={profileUrl} size={120} level="M" />
              </div>
              <p className="text-white/40 text-xs text-center">Scannez pour voir le profil de {creator.full_name}</p>
            </motion.div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">

          {/* Main */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

            {/* Bio */}
            {creator.bio && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">À propos</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{creator.bio}</p>
              </section>
            )}

            {/* Disciplines */}
            {creator.disciplines && creator.disciplines.length > 0 && (
              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
                  <Tag size={17} className="text-gray-400" /> Disciplines
                </h2>
                <div className="flex flex-wrap gap-2">
                  {creator.disciplines.map((d: string) => (
                    <span key={d} className="px-3.5 py-1.5 rounded-md bg-gray-100 text-gray-600 text-sm font-medium">{d}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio */}
            {(() => {
              const grid = creator.portfolio_grid?.length ? creator.portfolio_grid : creator.portfolio_images?.map(url => ({ url, colSpan: 1 as const, rowSpan: 1 as const }))
              if (!grid?.length) return null
              return (
                <section className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Portfolio</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: 'clamp(90px, 18vw, 180px)', gridAutoFlow: 'dense', gap: '6px' }}>
                    {grid.map((item, idx) => (
                      <div key={idx} style={{ gridColumn: `span ${item.colSpan}`, gridRow: `span ${item.rowSpan}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F3F4F6', position: 'relative' }} className="group">
                        <Image src={item.url} alt={`Portfolio ${idx + 1}`} placeholder="blur" blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjVGNUY3Ii8+PC9zdmc+" fill style={{ objectFit: 'cover' }} className="group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Carnet de route */}
            {itinerary.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">🗺️ Carnet de route</h2>
                <div className="flex flex-col gap-2.5">
                  {itinerary.map(entry => (
                    <div key={entry.id} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MapPin size={14} color="#6B7280" />
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#111827', margin: '0 0 2px' }}>{entry.label}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                          {new Date(entry.start_date).toLocaleDateString('fr-FR')} → {new Date(entry.end_date).toLocaleDateString('fr-FR')}
                          {entry.city && ` · ${entry.city}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Boutique preview */}
            {boutiqueCount !== null && boutiqueCount > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Boutique</h2>
                  <Link href={`/boutique/${id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                    Voir tout ({boutiqueCount}) →
                  </Link>
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                    {boutiqueCount} création{boutiqueCount > 1 ? 's' : ''} disponible{boutiqueCount > 1 ? 's' : ''}
                  </p>
                  <Link href={`/boutique/${id}`}
                    style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#111827', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                    Voir la boutique
                  </Link>
                </div>
              </section>
            )}

            {/* Avis */}
            {reviews.length > 0 && (() => {
              const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              return (
                <section className="mb-8">
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-lg font-bold text-gray-900">Avis</h2>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      <Star size={14} className="text-amber-500" fill="#F59E0B" />
                      <span className="text-sm font-bold text-amber-700">{avg.toFixed(1)}</span>
                      <span className="text-xs text-amber-500">({reviews.length} avis)</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    {reviews.map(r => (
                      <div key={r.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-bold text-gray-600">
                              {(r.profiles?.full_name ?? '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{r.profiles?.full_name ?? 'Organisateur'}</p>
                              <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                          {/* Étoiles */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={15} fill={n <= r.rating ? '#F59E0B' : 'none'} color={n <= r.rating ? '#F59E0B' : '#D1D5DB'} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.comment}</p>}
                        {r.tags && r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {r.tags.map(tag => (
                              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Laisser un avis — organisateurs ayant eu une candidature acceptée */}
            {sharedEventId && !isOwn && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Laisser un avis</h2>
                {alreadyReviewed ? (
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', textAlign: 'center' }}>
                    <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Vous avez déjà laissé un avis pour ce créateur.</p>
                  </div>
                ) : (
                  <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
                    <ReviewForm
                      eventId={sharedEventId}
                      reviewerId={user!.id}
                      reviewedId={id}
                      reviewerRole="organizer"
                      onSubmitted={() => { setAlreadyReviewed(true) }}
                    />
                  </div>
                )}
              </section>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:sticky lg:top-20 h-fit">
            <div className="rounded-2xl border border-gray-100 p-6 shadow-sm">

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div style={{ borderRadius: '12px', border: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', margin: 0, lineHeight: 1.2 }}>
                    {marchesCount ?? '—'}
                  </p>
                  <p style={{ fontSize: '10px', color: '#6B7280', fontWeight: '600', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Marchés
                  </p>
                </div>
                <div style={{ borderRadius: '12px', border: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', margin: 0, lineHeight: 1.2 }}>
                    {reviews.length}
                  </p>
                  <p style={{ fontSize: '10px', color: '#6B7280', fontWeight: '600', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Avis
                  </p>
                </div>
                <div style={{ borderRadius: '12px', border: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', margin: 0, lineHeight: 1.2 }}>
                    {boutiqueCount ?? '—'}
                  </p>
                  <p style={{ fontSize: '10px', color: '#6B7280', fontWeight: '600', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Créations
                  </p>
                </div>
              </div>

              {/* Links */}
              {(creator.website || creator.instagram || creator.etsy) && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-gray-400 mb-3">Liens</p>
                  <div className="flex flex-col gap-2.5">
                    {creator.website && (
                      <a href={creator.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors">
                        <Globe size={15} className="shrink-0" />
                        <span className="truncate">{creator.website.replace(/^https?:\/\//, '')}</span>
                      </a>
                    )}
                    {creator.instagram && (
                      <a href={`https://instagram.com/${creator.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors">
                        <Link2 size={15} className="shrink-0" />
                        @{creator.instagram.replace('@', '')}
                      </a>
                    )}
                    {creator.etsy && (
                      <a href={`https://etsy.com/shop/${creator.etsy}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors">
                        <Link2 size={15} className="shrink-0" />
                        Etsy : {creator.etsy}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Demande de devis */}
              {user && !isOwn && <DevisForm creatorId={id} requesterId={user.id} />}

              {/* Proposition de collab — visible seulement si le créateur l'a activé et le visiteur est aussi créateur */}
              {user && !isOwn && creator.open_to_collab && (user.is_creator || user.role === 'creator') && (
                <CollabForm creatorId={id} requesterId={user.id} requesterName={user.full_name ?? 'Créateur'} />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const COLLAB_TYPES = [
  { value: 'stand_partage', label: 'Stand partagé', emoji: '🏪' },
  { value: 'collection_commune', label: 'Collection commune', emoji: '🎨' },
  { value: 'popup_ensemble', label: 'Pop-up ensemble', emoji: '✨' },
  { value: 'autre', label: 'Autre', emoji: '💬' },
]

function CollabForm({ creatorId, requesterId, requesterName }: { creatorId: string; requesterId: string; requesterName: string }) {
  const [open, setOpen] = useState(false)
  const [collabType, setCollabType] = useState('')
  const [pitch, setPitch] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const { success, error } = useToast()

  const handleSend = async () => {
    if (!pitch.trim() || !collabType) return
    setSending(true)
    const typeLabel = COLLAB_TYPES.find(t => t.value === collabType)?.label ?? collabType
    const content = `[Demande de collaboration]\nType : ${typeLabel}\n${pitch}`

    const { data: conv } = await supabase.from('conversations')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('organizer_id', requesterId)
      .maybeSingle()
    const convId = conv?.id || (await supabase.from('conversations').insert({ creator_id: creatorId, organizer_id: requesterId }).select('id').single()).data?.id

    if (convId) {
      await supabase.from('messages').insert({ conversation_id: convId, sender_id: requesterId, content })
      await supabase.from('notifications').insert({
        user_id: creatorId,
        type: 'collab_request',
        title: 'Proposition de collaboration',
        body: `${requesterName} vous propose : ${typeLabel}`,
        link: `/messages/${convId}`,
      })
      setSent(true)
      success('Proposition envoyée !')
    } else {
      error('Erreur lors de l\'envoi')
    }
    setSending(false)
  }

  if (sent) return (
    <div className="mt-3 p-4 rounded-2xl border border-violet-200 bg-violet-50 text-center">
      <Handshake size={18} className="text-violet-600 mx-auto mb-1" />
      <p className="text-sm font-semibold text-violet-700">Proposition de collab envoyée !</p>
    </div>
  )

  return (
    <div className="mt-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-violet-200 bg-violet-50 text-violet-700 text-sm font-bold hover:bg-violet-100 transition-colors">
          <Handshake size={16} /> Proposer une collaboration
        </button>
      ) : (
        <div className="border border-violet-100 rounded-2xl p-5 bg-violet-50/40">
          <div className="flex items-center gap-2 mb-4">
            <Handshake size={16} className="text-violet-600 shrink-0" />
            <p className="text-sm font-bold text-gray-900">Proposition de collaboration</p>
          </div>

          {/* Type de collab */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Type de collaboration</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {COLLAB_TYPES.map(t => (
              <button key={t.value} onClick={() => setCollabType(t.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  collabType === t.value
                    ? 'border-violet-400 bg-violet-100 text-violet-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-violet-200 hover:bg-violet-50'
                }`}>
                <span className="text-base">{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Pitch */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ton idée</p>
          <textarea value={pitch} onChange={e => setPitch(e.target.value)} rows={4}
            placeholder="Décris ton idée, le contexte, ce que tu imagines ensemble…"
            className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-violet-300 bg-white" />

          <div className="flex gap-2 mt-3">
            <button onClick={handleSend} disabled={sending || !pitch.trim() || !collabType}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 transition-colors disabled:opacity-50">
              <Send size={14} /> {sending ? 'Envoi…' : 'Envoyer la proposition'}
            </button>
            <button onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DevisForm({ creatorId, requesterId }: { creatorId: string; requesterId: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const { success, error } = useToast()

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    const { error: err } = await supabase.from('notifications').insert({
      user_id: creatorId,
      type: 'devis_request',
      title: 'Nouvelle demande de devis',
      body: message.substring(0, 200),
      link: `/messages`,
    })
    if (!err) {
      // Also open a conversation
      const { data: conv } = await supabase.from('conversations')
        .select('id')
        .eq('creator_id', creatorId)
        .eq('organizer_id', requesterId)
        .maybeSingle()
      const convId = conv?.id || (await supabase.from('conversations').insert({ creator_id: creatorId, organizer_id: requesterId }).select('id').single()).data?.id
      if (convId) await supabase.from('messages').insert({ conversation_id: convId, sender_id: requesterId, content: `[Demande de devis]\n${message}` })
      setSent(true)
      success('Demande envoyée au créateur')
    } else {
      error('Erreur lors de l\'envoi')
    }
    setSending(false)
  }

  if (sent) return (
    <div className="mt-5 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-center">
      <p className="text-sm font-semibold text-emerald-700">Demande de devis envoyée</p>
    </div>
  )

  return (
    <div className="mt-5">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-bold hover:bg-indigo-100 transition-colors">
          Demander un devis
        </button>
      ) : (
        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
          <p className="text-sm font-bold text-gray-900 mb-3">Demande de devis</p>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder="Décrivez votre événement, les dates, le type de stand…"
            className="w-full p-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-indigo-300 bg-white" />
          <div className="flex gap-2 mt-3">
            <button onClick={handleSend} disabled={sending || !message.trim()}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50">
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
            <button onClick={() => setOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 text-sm hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
