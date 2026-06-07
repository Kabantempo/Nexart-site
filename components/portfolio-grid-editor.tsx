'use client'

import { useState, useRef } from 'react'
import { Plus, X, Trash2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GridItem = {
  url: string
  colSpan: 1 | 2 | 3
  rowSpan: 1 | 2 | 3
}

const SIZES: { label: string; col: 1 | 2 | 3; row: 1 | 2 | 3; desc: string }[] = [
  { label: '1×1', col: 1, row: 1, desc: 'Carré' },
  { label: '2×1', col: 2, row: 1, desc: 'Paysage' },
  { label: '1×2', col: 1, row: 2, desc: 'Portrait' },
  { label: '2×2', col: 2, row: 2, desc: 'Grand carré' },
  { label: '3×1', col: 3, row: 1, desc: 'Bannière' },
  { label: '1×3', col: 1, row: 3, desc: 'Colonne' },
  { label: '3×2', col: 3, row: 2, desc: 'Grand paysage' },
  { label: '2×3', col: 2, row: 3, desc: 'Grand portrait' },
  { label: '3×3', col: 3, row: 3, desc: 'Plein écran' },
]

// ─── Size Picker ──────────────────────────────────────────────────────────────

function SizePicker({
  selected,
  onSelect,
}: {
  selected: { col: 1|2|3; row: 1|2|3 }
  onSelect: (col: 1|2|3, row: 1|2|3) => void
}) {
  const [hover, setHover] = useState<{ col: number; row: number } | null>(null)

  return (
    <div>
      {/* Grille visuelle interactive 3×3 */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px', marginBottom: '10px',
        width: '120px',
      }}>
        {[1, 2, 3].map(r => [1, 2, 3].map(c => {
          const isSelected = c <= selected.col && r <= selected.row
          const isHover = hover && c <= hover.col && r <= hover.row
          return (
            <div
              key={`${r}-${c}`}
              onClick={() => onSelect(c as 1|2|3, r as 1|2|3)}
              onMouseEnter={() => setHover({ col: c, row: r })}
              onMouseLeave={() => setHover(null)}
              style={{
                width: '32px', height: '32px', borderRadius: '4px',
                backgroundColor: isSelected ? '#6366F1' : isHover ? '#C7D2FE' : '#E5E7EB',
                cursor: 'pointer', transition: 'background-color 100ms ease',
                border: isSelected ? '2px solid #4F46E5' : '2px solid transparent',
              }}
            />
          )
        }))}
      </div>
      {/* Presets rapides */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {SIZES.map(s => (
          <button
            key={s.label}
            onClick={() => onSelect(s.col, s.row)}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none',
              backgroundColor: selected.col === s.col && selected.row === s.row ? '#6366F1' : '#F3F4F6',
              color: selected.col === s.col && selected.row === s.row ? '#FFF' : '#4B5563',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────

function AddModal({
  userId,
  onAdd,
  onClose,
}: {
  userId: string
  onAdd: (item: GridItem) => void
  onClose: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [col, setCol] = useState<1|2|3>(1)
  const [row, setRow] = useState<1|2|3>(1)
  const [uploading, setUploading] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/portfolio-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('portfolios').upload(path, file, { upsert: false })
    if (!error) {
      const { data } = supabase.storage.from('portfolios').getPublicUrl(path)
      onAdd({ url: data.publicUrl, colSpan: col, rowSpan: row })
    }
    setUploading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Ajouter une photo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} color="#888" /></button>
        </div>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', aspectRatio: `${col}/${row}`, maxHeight: '260px',
            borderRadius: '10px', border: '2px dashed #E5E7EB',
            backgroundColor: '#FAFAFA', cursor: 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px', transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB' }}
        >
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Plus size={32} color="#9CA3AF" />
                <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '8px 0 0' }}>Cliquez pour choisir une photo</p>
              </div>
            )
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        {/* Taille */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>Taille dans la grille</p>
          <SizePicker selected={{ col, row }} onSelect={(c, r) => { setCol(c); setRow(r) }} />
        </div>

        {/* Info taille */}
        <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#EEF2FF', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#6366F1', fontWeight: '600', margin: 0 }}>
            Format sélectionné : {col} colonne{col > 1 ? 's' : ''} × {row} ligne{row > 1 ? 's' : ''} — {SIZES.find(s => s.col === col && s.row === row)?.desc ?? 'Personnalisé'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#1A1A1A', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={!file || uploading}
            style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: !file || uploading ? '#A5B4FC' : '#6366F1', color: '#FFF', fontSize: '14px', fontWeight: '600', cursor: !file || uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={15} /> {uploading ? 'Envoi…' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Resize Modal ─────────────────────────────────────────────────────────────

function ResizeModal({
  item,
  index,
  onSave,
  onDelete,
  onClose,
}: {
  item: GridItem
  index: number
  onSave: (i: number, col: 1|2|3, row: 1|2|3) => void
  onDelete: (i: number) => void
  onClose: () => void
}) {
  const [col, setCol] = useState<1|2|3>(item.colSpan)
  const [row, setRow] = useState<1|2|3>(item.rowSpan)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Modifier la photo</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="#888" /></button>
        </div>

        {/* Preview */}
        <div style={{ width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>Taille dans la grille</p>
        <SizePicker selected={{ col, row }} onSelect={(c, r) => { setCol(c); setRow(r) }} />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => { onDelete(index); onClose() }}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={15} /> Supprimer
          </button>
          <button onClick={() => { onSave(index, col, row); onClose() }}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Grid Editor ─────────────────────────────────────────────────────────

export function PortfolioGridEditor({
  items,
  userId,
  onChange,
}: {
  items: GridItem[]
  userId: string
  onChange: (items: GridItem[]) => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)

  const handleAdd = (item: GridItem) => {
    const next = [...items, item]
    onChange(next)
    setShowAdd(false)
  }

  const handleResize = (i: number, col: 1|2|3, row: 1|2|3) => {
    const next = items.map((it, idx) => idx === i ? { ...it, colSpan: col, rowSpan: row } : it)
    onChange(next)
  }

  const handleDelete = (i: number) => {
    const next = items.filter((_, idx) => idx !== i)
    onChange(next)
  }

  const MAX = 9

  return (
    <>
      {/* Légende */}
      <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '16px' }}>
        {items.length}/{MAX} photos · Cliquez sur une photo pour la redimensionner ou la supprimer
      </p>

      {/* Grille */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridAutoRows: '140px',
        gap: '6px',
      }}>
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => setEditIdx(i)}
            style={{
              gridColumn: `span ${item.colSpan}`,
              gridRow: `span ${item.rowSpan}`,
              borderRadius: '8px', overflow: 'hidden',
              cursor: 'pointer', position: 'relative',
              border: '2px solid transparent',
              transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1'
              const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLDivElement
              if (overlay) overlay.style.opacity = '1'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
              const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLDivElement
              if (overlay) overlay.style.opacity = '0'
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Hover overlay */}
            <div className="hover-overlay" style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(99,102,241,0.4)',
              opacity: 0, transition: 'opacity 150ms ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: '4px',
            }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFF' }}>{item.colSpan}×{item.rowSpan}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>Cliquer pour modifier</span>
            </div>
            {/* Taille badge */}
            <div style={{
              position: 'absolute', top: '6px', right: '6px',
              padding: '2px 7px', borderRadius: '10px',
              backgroundColor: 'rgba(0,0,0,0.55)',
              fontSize: '11px', fontWeight: '700', color: '#FFF',
            }}>
              {item.colSpan}×{item.rowSpan}
            </div>
          </div>
        ))}

        {/* Bouton ajouter */}
        {items.length < MAX && (
          <div
            onClick={() => setShowAdd(true)}
            style={{
              gridColumn: 'span 1', gridRow: 'span 1',
              borderRadius: '8px', border: '2px dashed #E5E7EB',
              backgroundColor: '#FAFAFA', cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '6px', transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#6366F1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={20} color="#6366F1" />
            </div>
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>Ajouter</span>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddModal userId={userId} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {editIdx !== null && (
        <ResizeModal
          item={items[editIdx]}
          index={editIdx}
          onSave={handleResize}
          onDelete={handleDelete}
          onClose={() => setEditIdx(null)}
        />
      )}
    </>
  )
}
