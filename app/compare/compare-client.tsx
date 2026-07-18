'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, MapPin, Euro, Users, Tag, Star, CheckCircle } from 'lucide-react'
import type { Event } from '@/lib/types'

type EventWithRating = Event & { avg_rating?: number; review_count?: number; discipline_tags?: string[] }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'contents' }}>
      <div style={{ padding: '14px 16px', fontWeight: '600', fontSize: '13px', color: '#6B7280', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FAFAFA' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 16px', fontSize: '14px', color: '#1A1A1A', borderBottom: '1px solid #F3F4F6', borderLeft: '1px solid #F3F4F6' }}>
      {children}
    </div>
  )
}

function CompareContent() {
  const params = useSearchParams()
  const ids = params.get('ids')?.split(',').filter(Boolean) ?? []
  const [events, setEvents] = useState<EventWithRating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ids.length) { setLoading(false); return }
    supabase.from('events').select('*').in('id', ids).then(async ({ data }) => {
      if (!data) { setLoading(false); return }
      const withRatings = await Promise.all(
        data.map(async (ev) => {
          const { data: reviews } = await supabase.from('reviews').select('rating').eq('event_id', ev.id)
          const avg = reviews?.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : undefined
          return { ...ev, avg_rating: avg, review_count: reviews?.length ?? 0 }
        })
      )
      setEvents(withRatings as EventWithRating[])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  if (!ids.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <p style={{ fontSize: '18px', color: '#888', marginBottom: '16px' }}>Aucun événement sélectionné.</p>
        <Link href="/events" style={{ color: '#6366F1', fontWeight: '600', textDecoration: 'none' }}>← Retour aux événements</Link>
      </div>
    )
  }

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const fmtPrice = (p?: number) => p == null ? '—' : p === 0 ? 'Gratuit' : `${p} €`

  const cols = events.length
  const gridCols = `160px repeat(${cols}, 1fr)`

  return (
    <div style={{ backgroundColor: '#fff', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 16px 80px' }}>
        <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6366F1', fontSize: '14px', fontWeight: '600', textDecoration: 'none', marginBottom: '24px' }}>
          <ArrowLeft size={15} /> Retour aux événements
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ fontSize: '32px', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>
          Comparaison
        </motion.h1>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '15px' }}>{cols} marché{cols > 1 ? 's' : ''} sélectionné{cols > 1 ? 's' : ''}</p>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0, borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            {Array.from({ length: cols + 1 }).map((_, i) => (
              <div key={i} style={{ height: '200px', backgroundColor: i === 0 ? '#FAFAFA' : '#fff', borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none' }} className="animate-shimmer" />
            ))}
          </div>
        ) : (
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'grid', gridTemplateColumns: gridCols }}>
              {/* Header row */}
              <div style={{ padding: '20px 16px', backgroundColor: '#FAFAFA', fontWeight: '700', fontSize: '13px', color: '#9CA3AF' }}>Critère</div>
              {events.map(ev => (
                <div key={ev.id} style={{ padding: '20px 16px', borderLeft: '1px solid #E5E7EB', backgroundColor: '#fff' }}>
                  {ev.cover_image && (
                    <div style={{ width: '100%', height: '100px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', position: 'relative' }}>
                      <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}
                  <p style={{ fontWeight: '700', fontSize: '14px', color: '#1A1A1A', margin: '0 0 6px' }}>{ev.title}</p>
                  <Link href={`/events/${ev.id}`} style={{ fontSize: '12px', color: '#6366F1', fontWeight: '600', textDecoration: 'none' }}>Voir le détail →</Link>
                </div>
              ))}

              <Row label="Date">
                {events.map(ev => <Cell key={ev.id}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} color="#6366F1" />{fmtDate(ev.start_date)}</span></Cell>)}
              </Row>

              <Row label="Ville">
                {events.map(ev => <Cell key={ev.id}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} color="#6366F1" />{ev.city ?? '—'}</span></Cell>)}
              </Row>

              <Row label="Prix stand">
                {events.map(ev => {
                  const min = Math.min(...events.filter(e => e.stand_price != null).map(e => e.stand_price!))
                  const isBest = ev.stand_price != null && ev.stand_price === min
                  return (
                    <Cell key={ev.id}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isBest ? '#10B981' : 'inherit', fontWeight: isBest ? '700' : '400' }}>
                        <Euro size={13} color={isBest ? '#10B981' : '#6366F1'} />
                        {fmtPrice(ev.stand_price)}
                        {isBest && <span style={{ fontSize: '10px', backgroundColor: '#DCFCE7', color: '#15803D', padding: '1px 6px', borderRadius: '9999px', fontWeight: '700' }}>Meilleur prix</span>}
                      </span>
                    </Cell>
                  )
                })}
              </Row>

              <Row label="Capacité">
                {events.map(ev => {
                  const max = Math.max(...events.filter(e => e.stand_count != null).map(e => e.stand_count!))
                  const isBest = ev.stand_count != null && ev.stand_count === max
                  return (
                    <Cell key={ev.id}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isBest ? '#6366F1' : 'inherit', fontWeight: isBest ? '700' : '400' }}>
                        <Users size={13} color="#6366F1" />
                        {ev.stand_count != null ? `${ev.stand_count} stands` : '—'}
                      </span>
                    </Cell>
                  )
                })}
              </Row>

              <Row label="Disciplines">
                {events.map(ev => {
                  const tags: string[] = (ev as any).discipline_tags ?? []
                  return (
                    <Cell key={ev.id}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {tags.length > 0 ? tags.slice(0, 4).map(t => (
                          <span key={t} style={{ padding: '2px 8px', borderRadius: '9999px', backgroundColor: '#EEF2FF', color: '#6366F1', fontSize: '11px', fontWeight: '600' }}>{t}</span>
                        )) : <span style={{ color: '#9CA3AF', fontSize: '13px' }}>—</span>}
                        {tags.length > 4 && <span style={{ fontSize: '11px', color: '#9CA3AF' }}>+{tags.length - 4}</span>}
                      </div>
                    </Cell>
                  )
                })}
              </Row>

              <Row label="Note">
                {events.map(ev => (
                  <Cell key={ev.id}>
                    {ev.avg_rating != null ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={13} color="#F59E0B" fill="#F59E0B" />
                        <strong>{ev.avg_rating.toFixed(1)}</strong>
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>({ev.review_count} avis)</span>
                      </span>
                    ) : <span style={{ color: '#9CA3AF' }}>Aucun avis</span>}
                  </Cell>
                ))}
              </Row>

              <Row label="Accès au profil">
                {events.map(ev => (
                  <Cell key={ev.id}>
                    <Link href={`/events/${ev.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#6366F1', fontWeight: '600', fontSize: '13px', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E0E7FF', backgroundColor: '#EEF2FF' }}>
                      <CheckCircle size={12} /> Voir le marché
                    </Link>
                  </Cell>
                ))}
              </Row>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CompareClient() {
  return (
    <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center', color: '#888' }}>Chargement...</div>}>
      <CompareContent />
    </Suspense>
  )
}
