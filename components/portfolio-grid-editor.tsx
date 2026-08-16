'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Check, GripVertical } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NexModal } from '@/components/ui/nex-modal'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { colors } from '@/lib/design-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GridItem = {
  url: string
  colSpan: 1 | 2 | 3
  rowSpan: 1 | 2 | 3
  objectPosition?: string // e.g. "50% 30%"
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

// ─── Focus Picker ─────────────────────────────────────────────────────────────

function FocusPicker({
  url,
  position,
  onChange,
}: {
  url: string
  position: string
  onChange: (pos: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const posToXY = (pos: string) => {
    const [x, y] = pos.split(' ').map(v => parseFloat(v))
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y }
  }

  const updateFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)))
    const y = Math.round(Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)))
    onChange(`${x}% ${y}%`)
  }, [onChange])

  const { x, y } = posToXY(position)

  return (
    <div>
      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', marginTop: '16px' }}>
        Point de focus <span style={{ fontWeight: '400', color: 'var(--text-secondary)' }}>— cliquer ou glisser sur l'image</span>
      </p>
      <div
        ref={containerRef}
        style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden', cursor: 'crosshair', userSelect: 'none' }}
        onMouseDown={(e) => { isDragging.current = true; updateFromEvent(e) }}
        onMouseMove={(e) => { if (isDragging.current) updateFromEvent(e) }}
        onMouseUp={() => { isDragging.current = false }}
        onMouseLeave={() => { isDragging.current = false }}
        onTouchStart={(e) => { isDragging.current = true; updateFromEvent(e) }}
        onTouchMove={(e) => { if (isDragging.current) updateFromEvent(e) }}
        onTouchEnd={() => { isDragging.current = false }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position, display: 'block', pointerEvents: 'none' }}
          draggable={false}
        />
        {/* Crosshair overlay */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* horizontal line */}
          <div style={{ position: 'absolute', top: `${y}%`, left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          {/* vertical line */}
          <div style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, width: '1px', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          {/* dot */}
          <div style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: '20px', height: '20px', borderRadius: '50%',
            backgroundColor: colors.violet.primary,
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }} />
        </div>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', textAlign: 'center' }}>
        Focus : {x}% horizontal · {y}% vertical
      </p>
    </div>
  )
}

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
                backgroundColor: isSelected ? colors.violet.primary : isHover ? colors.purple.bgLight : colors.border.default,
                cursor: 'pointer', transition: 'background-color 100ms ease',
                border: isSelected ? `2px solid ${colors.purple.indigo}` : '2px solid transparent',
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
              backgroundColor: selected.col === s.col && selected.row === s.row ? colors.violet.primary : colors.bg.subtle,
              color: selected.col === s.col && selected.row === s.row ? colors.bg.primary : colors.gray["600"],
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
    <NexModal
      isOpen={true}
      onClose={onClose}
      title="Ajouter une photo"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </button>
          <button onClick={handleSave} disabled={!file || uploading}
            style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: !file || uploading ? colors.purple.bgPale : colors.violet.primary, color: colors.bg.primary, fontSize: '14px', fontWeight: '600', cursor: !file || uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={15} /> {uploading ? 'Envoi…' : 'Ajouter'}
          </button>
        </div>
      }
    >
      {/* Upload + Taille côte à côte */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center', justifyContent: 'center' }}>
        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            flex: '0 0 160px', height: '160px',
            borderRadius: '10px', border: `2px dashed ${colors.border.default}`,
            backgroundColor: 'var(--bg-secondary)', cursor: 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color 150ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.violet.primary }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.border.default }}
        >
          {preview
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <Plus size={28} color={colors.text.muted} />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>Choisir une photo</p>
              </div>
            )
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        {/* Taille */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', marginTop: 0 }}>Taille dans la grille</p>
          <SizePicker selected={{ col, row }} onSelect={(c, r) => { setCol(c); setRow(r) }} />
        </div>
      </div>

      {/* Info taille */}
      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: colors.violet.bg }}>
        <p style={{ fontSize: '13px', color: colors.violet.primary, fontWeight: '600', margin: 0 }}>
          Format sélectionné : {col} colonne{col > 1 ? 's' : ''} × {row} ligne{row > 1 ? 's' : ''} — {SIZES.find(s => s.col === col && s.row === row)?.desc ?? 'Personnalisé'}
        </p>
      </div>
    </NexModal>
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
  onSave: (i: number, col: 1|2|3, row: 1|2|3, objectPosition: string) => void
  onDelete: (i: number) => void
  onClose: () => void
}) {
  const [col, setCol] = useState<1|2|3>(item.colSpan)
  const [row, setRow] = useState<1|2|3>(item.rowSpan)
  const [objectPosition, setObjectPosition] = useState(item.objectPosition ?? '50% 50%')

  return (
    <NexModal
      isOpen={true}
      onClose={onClose}
      title="Modifier la photo"
      size="sm"
      footer={
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => { onDelete(index); onClose() }}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: colors.red.bg, color: colors.feedback.danger.solid, fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={15} /> Supprimer
          </button>
          <button onClick={() => { onSave(index, col, row, objectPosition); onClose() }}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={15} /> Enregistrer
          </button>
        </div>
      }
    >
      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px' }}>Taille dans la grille</p>
      <SizePicker selected={{ col, row }} onSelect={(c, r) => { setCol(c); setRow(r) }} />
      <FocusPicker url={item.url} position={objectPosition} onChange={setObjectPosition} />
    </NexModal>
  )
}

// ─── Sortable Grid Item ───────────────────────────────────────────────────────

function SortableGridItem({
  item,
  sortableId,
  onEdit,
}: {
  item: GridItem
  sortableId: string
  onEdit: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  })

  const style: React.CSSProperties = {
    gridColumn: `span ${item.colSpan}`,
    gridRow: `span ${item.rowSpan}`,
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    border: isDragging ? `2px solid ${colors.violet.primary}` : '2px solid transparent',
    transition: `border-color 150ms ease, ${transition ?? ''}`,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.borderColor = colors.violet.primary
          const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLDivElement
          if (overlay) overlay.style.opacity = '1'
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'
        const overlay = e.currentTarget.querySelector('.hover-overlay') as HTMLDivElement
        if (overlay) overlay.style.opacity = '0'
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt="" onClick={onEdit} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: item.objectPosition ?? '50% 50%', display: 'block' }} />
      {/* Hover overlay */}
      <div className="hover-overlay" style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(99,102,241,0.4)',
        opacity: 0, transition: 'opacity 150ms ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '4px',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: colors.bg.primary }}>{item.colSpan}×{item.rowSpan}</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>Cliquer pour modifier</span>
      </div>
      {/* Taille badge */}
      <div style={{
        position: 'absolute', top: '6px', right: '6px',
        padding: '2px 7px', borderRadius: '10px',
        backgroundColor: 'rgba(0,0,0,0.55)',
        fontSize: '11px', fontWeight: '700', color: colors.bg.primary,
      }}>
        {item.colSpan}×{item.rowSpan}
      </div>
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute', bottom: '5px', left: '5px',
          width: '24px', height: '24px', borderRadius: '6px',
          backgroundColor: 'rgba(0,0,0,0.65)', cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'none',
        }}
        title="Glisser pour réordonner"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={13} color={colors.bg.primary} />
      </div>
    </div>
  )
}

// ─── Main Grid Editor ─────────────────────────────────────────────────────────

export function PortfolioGridEditor({
  items,
  userId,
  onChange,
  onReorder,
  maxPhotos = 30,
}: {
  items: GridItem[]
  userId: string
  onChange: (items: GridItem[]) => void
  onReorder?: (items: GridItem[]) => void
  maxPhotos?: number
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleAdd = (item: GridItem) => {
    const next = [...items, item]
    onChange(next)
    setShowAdd(false)
  }

  const handleResize = (i: number, col: 1|2|3, row: 1|2|3, objectPosition: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, colSpan: col, rowSpan: row, objectPosition } : it)
    onChange(next)
  }

  const handleDelete = (i: number) => {
    const next = items.filter((_, idx) => idx !== i)
    onChange(next)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortableIds.indexOf(active.id as string)
    const newIndex = sortableIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    const newItems = arrayMove(items, oldIndex, newIndex)
    onChange(newItems)
    onReorder?.(newItems)
  }

  const MAX = maxPhotos
  const sortableIds = items.map((item, i) => `item-${i}-${item.url}`)

  return (
    <>
      {/* Légende */}
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        {items.length}/{MAX} photos · Cliquez sur une photo pour la modifier · Glissez pour réordonner
        {items.length >= MAX && MAX <= 10 && (
          <span style={{ display: 'block', marginTop: '4px', color: colors.status.pending.dot, fontWeight: '600' }}>
            Limite atteinte — passez au plan Boost pour 30 photos ou Pro pour un portfolio illimité
          </span>
        )}
      </p>

      {/* Grille avec drag & drop */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: 'clamp(90px, 18vw, 180px)',
            gridAutoFlow: 'dense',
            gap: '6px',
          }}>
            {items.map((item, i) => (
              <SortableGridItem
                key={sortableIds[i]}
                item={item}
                sortableId={sortableIds[i]}
                onEdit={() => setEditIdx(i)}
              />
            ))}

            {/* Bouton ajouter */}
            {items.length < MAX && (
              <div
                onClick={() => setShowAdd(true)}
                style={{
                  gridColumn: 'span 1', gridRow: 'span 1',
                  borderRadius: '8px', border: '2px dashed var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '6px', transition: 'border-color 150ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.violet.primary }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = colors.border.default }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} color={colors.violet.primary} />
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ajouter</span>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

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
