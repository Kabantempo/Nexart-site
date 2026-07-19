'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StandPlan, StandStatus } from '@/app/events/[id]/settings/stands/stands-client'

const STATUS_COLORS: Record<StandStatus, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', label: 'Disponible' },
  reserved:  { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', label: 'Réservé' },
  occupied:  { bg: '#EEF2FF', border: '#A5B4FC', text: '#3730A3', label: 'Occupé' },
  blocked:   { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280', label: 'Bloqué' },
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export default function StandPlanViewer({ eventId }: { eventId: string }) {
  const [plan, setPlan] = useState<StandPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await (supabase as any)
        .from('events')
        .select('stand_plan')
        .eq('id', eventId)
        .single()
      if (data?.stand_plan) setPlan(data.stand_plan as StandPlan)
      setLoading(false)
    }
    load()
  }, [eventId])

  if (loading) return (
    <div style={{ height: '120px', backgroundColor: '#F3F4F6', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
  )

  if (!plan || !plan.stands?.length) return null

  const CELL = 48 // px — plus petit que l'éditeur orga

  const available = plan.stands.filter(s => s.status === 'available').length

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>Plan des stands</h3>
        <span style={{ fontSize: '13px', color: '#15803D', fontWeight: '600', backgroundColor: '#F0FDF4', padding: '4px 10px', borderRadius: '20px', border: '1px solid #86EFAC' }}>
          {available} disponible{available !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        {/* Col headers */}
        <div style={{ display: 'flex', marginLeft: `${CELL * 0.4}px`, marginBottom: '3px' }}>
          {Array.from({ length: plan.cols }, (_, i) => (
            <div key={i} style={{ width: CELL, flexShrink: 0, textAlign: 'center', fontSize: '10px', fontWeight: '600', color: '#9CA3AF' }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: plan.rows }, (_, r) => {
          const rowLetter = ALPHABET[r] ?? `R${r}`
          return (
            <div key={r} style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
              <div style={{ width: `${CELL * 0.4}px`, flexShrink: 0, textAlign: 'center', fontSize: '10px', fontWeight: '600', color: '#9CA3AF' }}>
                {rowLetter}
              </div>
              {Array.from({ length: plan.cols }, (_, c) => {
                const id = `${rowLetter}${c + 1}`
                const stand = plan.stands.find(s => s.id === id)
                const status = stand?.status ?? 'available'
                const s = STATUS_COLORS[status]
                return (
                  <div
                    key={c}
                    title={`Stand ${stand?.label ?? id} — ${s.label}${stand?.price ? ` — ${stand.price}€` : ''}`}
                    style={{
                      width: CELL - 3, height: CELL - 3, margin: '1.5px', flexShrink: 0,
                      borderRadius: '6px', border: `1.5px solid ${s.border}`,
                      backgroundColor: s.bg, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: '1px',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontWeight: '700', color: s.text }}>{stand?.label ?? id}</span>
                    {stand?.price && (
                      <span style={{ fontSize: '9px', color: s.text, opacity: 0.7 }}>{stand.price}€</span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
        {Object.entries(STATUS_COLORS).map(([status, s]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#6B7280' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: s.bg, border: `1.5px solid ${s.border}` }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}
