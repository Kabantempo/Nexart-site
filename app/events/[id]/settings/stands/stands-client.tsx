'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast-provider'
import { Save, RotateCcw, Grid3X3, Plus, Minus, Eye, Trash2, Move } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StandStatus = 'available' | 'reserved' | 'occupied' | 'blocked'

export interface Stand {
  id: string        // e.g. "A1", "B3"
  row: string       // "A", "B"…
  col: number       // 1, 2…
  label: string     // custom label override
  status: StandStatus
  width: number     // in meters
  height: number    // in meters
  price?: number    // override event default
  assignee?: string // creator name if occupied/reserved
}

export interface StandPlan {
  rows: number
  cols: number
  cellSize: number  // meters per cell (default 1)
  stands: Stand[]
}

const STATUS_COLORS: Record<StandStatus, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', label: 'Disponible' },
  reserved:  { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', label: 'Réservé' },
  occupied:  { bg: '#EEF2FF', border: '#A5B4FC', text: '#3730A3', label: 'Occupé' },
  blocked:   { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280', label: 'Bloqué' },
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function makeId(row: string, col: number) { return `${row}${col}` }

function generateStands(rows: number, cols: number, existing: Stand[]): Stand[] {
  const existingMap = new Map(existing.map(s => [s.id, s]))
  const stands: Stand[] = []
  for (let r = 0; r < rows; r++) {
    const rowLetter = ALPHABET[r] ?? `R${r}`
    for (let c = 1; c <= cols; c++) {
      const id = makeId(rowLetter, c)
      stands.push(existingMap.get(id) ?? {
        id, row: rowLetter, col: c, label: id,
        status: 'available', width: 1, height: 1,
      })
    }
  }
  return stands
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StandsClient({ eventId }: { eventId: string }) {
  const toast = useToast()

  const [plan, setPlan] = useState<StandPlan>({ rows: 5, cols: 8, cellSize: 1, stands: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Stand | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('events')
        .select('stand_plan, stand_count, stand_price')
        .eq('id', eventId)
        .single()

      if (error) { toast.error('Erreur chargement plan'); setLoading(false); return }

      if (data?.stand_plan) {
        const saved = data.stand_plan as StandPlan
        setPlan({ ...saved, stands: generateStands(saved.rows, saved.cols, saved.stands) })
      } else {
        const cols = Math.max(4, Math.min(16, data?.stand_count ?? 8))
        const rows = Math.ceil((data?.stand_count ?? 8) / cols)
        const stands = generateStands(rows, cols, [])
        setPlan({ rows, cols, cellSize: 1, stands })
      }
      setLoading(false)
    }
    load()
  }, [eventId])

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = async () => {
    setSaving(true)
    const { error } = await (supabase as any)
      .from('events')
      .update({ stand_plan: plan })
      .eq('id', eventId)

    if (error) toast.error('Erreur sauvegarde')
    else { toast.success('Plan sauvegardé !'); setIsDirty(false) }
    setSaving(false)
  }

  // ── Grid mutations ────────────────────────────────────────────────────────

  const updateGrid = useCallback((rows: number, cols: number) => {
    const newStands = generateStands(rows, cols, plan.stands)
    setPlan(p => ({ ...p, rows, cols, stands: newStands }))
    setIsDirty(true)
  }, [plan.stands])

  const updateStand = (updated: Stand) => {
    setPlan(p => ({ ...p, stands: p.stands.map(s => s.id === updated.id ? updated : s) }))
    setSelected(updated)
    setIsDirty(true)
  }

  const resetStand = (id: string) => {
    const [row, ...rest] = id
    const col = parseInt(rest.join(''))
    updateStand({ id, row, col, label: id, status: 'available', width: 1, height: 1 })
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total: plan.stands.length,
    available: plan.stands.filter(s => s.status === 'available').length,
    occupied: plan.stands.filter(s => s.status === 'occupied').length,
    reserved: plan.stands.filter(s => s.status === 'reserved').length,
    blocked: plan.stands.filter(s => s.status === 'blocked').length,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '32px' }}>
      {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse" style={{ height: '80px', backgroundColor: '#F3F4F6', borderRadius: '12px' }} />)}
    </div>
  )

  const CELL = 64 // px per cell

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Plan de stands</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>Cliquez un stand pour le modifier</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isDirty && (
            <button onClick={() => { setPlan(p => ({ ...p })); setIsDirty(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#374151', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              <RotateCcw size={14} /> Annuler
            </button>
          )}
          <button onClick={save} disabled={saving || !isDirty}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: isDirty ? '#6366F1' : '#E5E7EB', color: isDirty ? '#fff' : '#9CA3AF', fontSize: '13px', fontWeight: '600', cursor: isDirty ? 'pointer' : 'not-allowed', transition: 'all 150ms' }}>
            <Save size={14} /> {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(110px, 100%), 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: stats.total, color: '#374151', bg: '#F9FAFB' },
          { label: 'Disponibles', value: stats.available, color: '#15803D', bg: '#F0FDF4' },
          { label: 'Occupés', value: stats.occupied, color: '#3730A3', bg: '#EEF2FF' },
          { label: 'Réservés', value: stats.reserved, color: '#854D0E', bg: '#FEF9C3' },
          { label: 'Bloqués', value: stats.blocked, color: '#6B7280', bg: '#F3F4F6' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: s.bg, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grid size controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', padding: '14px 18px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
        <Grid3X3 size={16} style={{ color: '#6B7280', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Rangées</span>
          <button onClick={() => updateGrid(Math.max(1, plan.rows - 1), plan.cols)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
          <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{plan.rows}</span>
          <button onClick={() => updateGrid(Math.min(26, plan.rows + 1), plan.cols)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>Colonnes</span>
          <button onClick={() => updateGrid(plan.rows, Math.max(1, plan.cols - 1))} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
          <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{plan.cols}</span>
          <button onClick={() => updateGrid(plan.rows, Math.min(30, plan.cols + 1))} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
        </div>
        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{plan.rows * plan.cols} stands</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Grid */}
        <div style={{ flex: '1 1 400px', overflowX: 'auto' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', marginLeft: `${CELL * 0.4}px`, marginBottom: '4px' }}>
            {Array.from({ length: plan.cols }, (_, i) => (
              <div key={i} style={{ width: CELL, flexShrink: 0, textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9CA3AF' }}>
                {i + 1}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: plan.rows }, (_, r) => {
            const rowLetter = ALPHABET[r] ?? `R${r}`
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                {/* Row label */}
                <div style={{ width: `${CELL * 0.4}px`, flexShrink: 0, textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#9CA3AF' }}>
                  {rowLetter}
                </div>
                {/* Cells */}
                {Array.from({ length: plan.cols }, (_, c) => {
                  const id = makeId(rowLetter, c + 1)
                  const stand = plan.stands.find(s => s.id === id)
                  const s = STATUS_COLORS[stand?.status ?? 'available']
                  const isSelected = selected?.id === id
                  return (
                    <button
                      key={c}
                      onClick={() => setSelected(selected?.id === id ? null : (stand ?? null))}
                      title={`Stand ${id}${stand?.assignee ? ` — ${stand.assignee}` : ''}`}
                      style={{
                        width: CELL - 4, height: CELL - 4, margin: '2px', flexShrink: 0,
                        borderRadius: '8px', border: `2px solid ${isSelected ? '#6366F1' : s.border}`,
                        backgroundColor: isSelected ? '#EEF2FF' : s.bg,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: '2px',
                        boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.25)' : undefined,
                        transition: 'all 100ms',
                        padding: '4px',
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#4338CA' : s.text }}>{stand?.label ?? id}</span>
                      {stand?.assignee && <span style={{ fontSize: '9px', color: s.text, opacity: 0.8, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{stand.assignee}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            {Object.entries(STATUS_COLORS).map(([status, s]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: s.bg, border: `1.5px solid ${s.border}` }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        {selected && (
          <div style={{ width: 'min(280px, 100%)', flexShrink: 0, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Stand {selected.id}</h3>
              <button onClick={() => { resetStand(selected.id); setSelected(null) }} title="Réinitialiser"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}>
                <Trash2 size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Label */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>LABEL</label>
                <input value={selected.label} onChange={e => updateStand({ ...selected, label: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>STATUT</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {(Object.keys(STATUS_COLORS) as StandStatus[]).map(st => {
                    const s = STATUS_COLORS[st]
                    const active = selected.status === st
                    return (
                      <button key={st} onClick={() => updateStand({ ...selected, status: st })}
                        style={{ padding: '7px 10px', borderRadius: '8px', border: `1.5px solid ${active ? s.border : '#E5E7EB'}`, backgroundColor: active ? s.bg : '#fff', color: active ? s.text : '#374151', fontSize: '12px', fontWeight: active ? '600' : '400', cursor: 'pointer', transition: 'all 100ms' }}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>CRÉATEUR ASSIGNÉ</label>
                <input value={selected.assignee ?? ''} onChange={e => updateStand({ ...selected, assignee: e.target.value || undefined })}
                  placeholder="Nom du créateur…"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>LARGEUR (m)</label>
                  <input type="number" min={1} max={10} value={selected.width}
                    onChange={e => updateStand({ ...selected, width: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>PROFONDEUR (m)</label>
                  <input type="number" min={1} max={10} value={selected.height}
                    onChange={e => updateStand({ ...selected, height: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Price override */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '6px' }}>PRIX SPÉCIFIQUE (€) <span style={{ fontWeight: 400 }}>— optionnel</span></label>
                <input type="number" min={0} value={selected.price ?? ''} placeholder="Prix événement par défaut"
                  onChange={e => updateStand({ ...selected, price: e.target.value ? Number(e.target.value) : undefined })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
