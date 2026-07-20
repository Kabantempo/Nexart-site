'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Pin, ArrowRight, Euro, Users, Calendar, MapPin, Tag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCompareStore, type CompareEvent } from '@/lib/compare-store'

export function ComparePanel() {
  const { pinned, unpin, clear } = useCompareStore()

  if (pinned.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9000,
          backgroundColor: '#fff',
          borderTop: '1px solid #E5E7EB',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>
            {/* Label */}
            <div style={{ flexShrink: 0 }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366F1', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Pin size={11} style={{ display: 'inline', marginRight: '4px' }} />
                Comparer
              </p>
              <p style={{ fontSize: '10px', color: '#9CA3AF', margin: 0 }}>{pinned.length}/3</p>
            </div>

            {/* Cards */}
            {pinned.map((ev) => (
              <div key={ev.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', minWidth: '200px', maxWidth: '240px', position: 'relative' }}>
                {ev.cover_image && (
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                    <Image src={ev.cover_image} alt={ev.title} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                    {ev.stand_price != null ? `${ev.stand_price === 0 ? 'Gratuit' : `${ev.stand_price}€`}` : '—'}
                    {ev.city ? ` · ${ev.city}` : ''}
                  </p>
                </div>
                <button onClick={() => unpin(ev.id)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px' }} aria-label="Retirer">
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 3 - pinned.length }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: '120px', height: '56px', borderRadius: '12px', border: '1.5px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '11px', color: '#D1D5DB', textAlign: 'center' }}>+</p>
              </div>
            ))}

            {/* Actions */}
            {pinned.length >= 2 && (
              <Link
                href={`/compare?ids=${pinned.map(e => e.id).join(',')}`}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', backgroundColor: '#6366F1', color: '#fff', fontSize: '13px', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                Comparer <ArrowRight size={13} />
              </Link>
            )}
            <button onClick={clear} style={{ flexShrink: 0, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Tout effacer
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function PinButton({ event }: { event: CompareEvent }) {
  const { pin, unpin, isPinned, pinned } = useCompareStore()
  const pinned_ = isPinned(event.id)
  const full = pinned.length >= 3 && !pinned_

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); pinned_ ? unpin(event.id) : pin(event) }}
      disabled={full}
      title={full ? 'Maximum 3 marchés à comparer' : pinned_ ? 'Retirer de la comparaison' : 'Épingler pour comparer'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '28px', height: '28px', borderRadius: '8px',
        backgroundColor: pinned_ ? '#6366F1' : 'rgba(255,255,255,0.85)',
        color: pinned_ ? '#fff' : '#6B7280',
        border: pinned_ ? 'none' : '1px solid rgba(0,0,0,0.1)',
        cursor: full ? 'not-allowed' : 'pointer',
        opacity: full ? 0.4 : 1,
        backdropFilter: 'blur(4px)',
        transition: 'all 150ms',
        flexShrink: 0,
      }}
      aria-label={pinned_ ? 'Retirer de la comparaison' : 'Épingler pour comparer'}
      aria-pressed={pinned_}
    >
      <Pin size={13} />
    </button>
  )
}
