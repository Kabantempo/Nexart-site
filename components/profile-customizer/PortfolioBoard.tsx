'use client'
import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { Type, Trash2, Upload, Link, Images, X } from 'lucide-react'
import { colors } from '@/lib/design-tokens'
import { FONT_FAMILIES, type PortfolioBlock, type PageSettings } from '@/lib/page-settings'
import { usePortfolioBlocks } from '@/hooks/usePortfolioBlocks'

const Rnd = dynamic(() => import('react-rnd').then(m => m.Rnd), { ssr: false })

interface Props {
  blocks: PortfolioBlock[]
  accentColor: string
  settings: PageSettings
  creatorName?: string
  avatarUrl?: string
  bio?: string
  disciplines?: string[]
  onSave: (patch: Partial<PageSettings>) => Promise<{ ok: boolean }>
  onUpdate: (patch: Partial<PageSettings>) => void
}

// Ratio portrait — les blocs en % couvrent toute la page (position:absolute sur min-h-screen)
const BOARD_W = 900
const BOARD_H = 700

function pxFromPct(pct: number, total: number) { return (pct / 100) * total }
function pctFromPx(px: number, total: number) { return (px / total) * 100 }

export function PortfolioBoard({ blocks, accentColor, settings, creatorName, avatarUrl, bio, disciplines, onSave, onUpdate }: Props) {
  const { addImage, addText, updateBlock, removeBlock, saveBlocks } = usePortfolioBlocks(blocks, onSave, onUpdate)
  const [selected, setSelected] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [showGallery, setShowGallery] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!showGallery) return
    const load = async () => {
      setGalleryLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setGalleryLoading(false); return }
      const { data } = await supabase
        .from('creator_profiles')
        .select('portfolio_images')
        .eq('user_id', session.user.id)
        .maybeSingle()
      const imgs = data?.portfolio_images
      if (Array.isArray(imgs)) {
        setGalleryImages(imgs.map((i: any) => typeof i === 'string' ? i : i?.url ?? '').filter(Boolean))
      }
      setGalleryLoading(false)
    }
    load()
  }, [showGallery])

  const handleGalleryPick = async (url: string) => {
    const next = addImage(url)
    await saveBlocks(next)
    setShowGallery(false)
  }

  const bg = settings.bg_color ?? '#0D0D0D'
  const accent = settings.accent_color ?? accentColor
  const textColor = settings.bio_color ?? '#F5F3EF'
  const cover = settings.cover_image

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setUploadErr(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setUploadErr('Non connecté'); return }
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/portfolio/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const next = addImage(data.publicUrl)
      await saveBlocks(next)
    } catch (e: any) {
      setUploadErr(`Erreur : ${e?.message ?? 'upload échoué'}. Utilise l'URL à la place.`)
      setShowUrlInput(true)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleUrlAdd = async () => {
    if (!urlValue.trim()) return
    const next = addImage(urlValue.trim())
    await saveBlocks(next)
    setUrlValue('')
    setShowUrlInput(false)
    setUploadErr(null)
  }

  const handleAddText = async () => {
    const next = addText()
    await saveBlocks(next)
    const newId = next[next.length - 1].id
    setSelected(newId)
    setEditingText(newId)
  }

  const handleRemove = async (id: string) => {
    const next = removeBlock(id)
    await saveBlocks(next)
    setSelected(null)
  }

  const handleDragStop = async (block: PortfolioBlock, x: number, y: number) => {
    const patch = { x: pctFromPx(x, BOARD_W), y: pctFromPx(y, BOARD_H) }
    const next = blocks.map(b => b.id === block.id ? { ...b, ...patch } : b)
    updateBlock(block.id, patch)
    await saveBlocks(next)
  }

  const handleResizeStop = async (block: PortfolioBlock, w: number, h: number, x: number, y: number) => {
    const patch = {
      x: pctFromPx(x, BOARD_W), y: pctFromPx(y, BOARD_H),
      width: pctFromPx(w, BOARD_W), height: pctFromPx(h, BOARD_H),
    }
    const next = blocks.map(b => b.id === block.id ? { ...b, ...patch } : b)
    updateBlock(block.id, patch)
    await saveBlocks(next)
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${accent}55`, backgroundColor: `${accent}15`, color: accent, fontSize: '13px', fontWeight: 600, cursor: uploading ? 'wait' : 'pointer' }}>
          <Upload size={14} /> {uploading ? 'Upload…' : '+ Image'}
        </button>
        <button onClick={() => { setShowUrlInput(v => !v); setUploadErr(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${accent}44`, backgroundColor: showUrlInput ? `${accent}20` : `${accent}10`, color: accent, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Link size={14} /> URL
        </button>
        <button onClick={() => { setShowGallery(v => !v); setShowUrlInput(false); setUploadErr(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${accent}44`, backgroundColor: showGallery ? `${accent}20` : `${accent}10`, color: accent, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Images size={14} /> Galerie
        </button>
        <button onClick={handleAddText}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${accent}44`, backgroundColor: `${accent}10`, color: accent, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Type size={14} /> + Texte
        </button>
        {selected && (
          <button onClick={() => handleRemove(selected)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: `1px solid ${colors.feedback.danger.border}`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.text, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}>
            <Trash2 size={14} /> Supprimer
          </button>
        )}
      </div>

      {uploadErr && (
        <p style={{ fontSize: '12px', color: colors.feedback.danger.solid, marginBottom: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: colors.feedback.danger.bg }}>
          {uploadErr}
        </p>
      )}

      {showUrlInput && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input type="url" value={urlValue} onChange={e => setUrlValue(e.target.value)}
            placeholder="https://… URL de l'image" onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, fontSize: '13px', color: colors.text.primary, backgroundColor: 'var(--bg-secondary)', outline: 'none' }} />
          <button onClick={handleUrlAdd}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: accent, color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Ajouter
          </button>
        </div>
      )}

      {showGallery && (
        <div style={{ marginBottom: '12px', borderRadius: '12px', border: `1px solid ${accent}44`, backgroundColor: 'var(--bg-secondary)', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.secondary, margin: 0 }}>Tes photos — clique pour ajouter</p>
            <button onClick={() => setShowGallery(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text.muted, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
          {galleryLoading ? (
            <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>Chargement…</p>
          ) : galleryImages.length === 0 ? (
            <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>Aucune photo dans ta galerie. Ajoute des photos depuis ton profil.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '8px' }}>
              {galleryImages.map((url, i) => (
                <button key={i} onClick={() => handleGalleryPick(url)}
                  style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${accent}33`, cursor: 'pointer', padding: 0, background: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = accent)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${accent}33`)}
                >
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board — zone portfolio identique au rendu public */}
      <div
        style={{ position: 'relative', width: '100%', height: `${BOARD_H}px`, borderRadius: '14px', overflow: 'hidden', border: `2px solid ${accent}66`, boxShadow: `0 0 0 1px ${accent}22`, cursor: 'default', userSelect: 'none' }}
        onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
      >
        {/* ── Fond : même canvas que la zone portfolio publique ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundColor: bg }}>
          {/* Grille discrète pour aider au placement */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}10 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

          {/* Hint quand vide */}
          {blocks.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ border: `1.5px dashed ${accent}55`, borderRadius: '14px', padding: '16px 28px', textAlign: 'center', backgroundColor: `${bg}cc`, backdropFilter: 'blur(4px)' }}>
                <p style={{ color: textColor, fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>Zone portfolio</p>
                <p style={{ color: `${textColor}70`, fontSize: '12px', margin: 0 }}>Clique + Image ou + Texte, glisse partout</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Blocs draggables ── */}
        {blocks.map(block => {
          const x = pxFromPct(block.x, BOARD_W)
          const y = pxFromPct(block.y, BOARD_H)
          const w = pxFromPct(block.width, BOARD_W)
          const h = pxFromPct(block.height, BOARD_H)
          const isSelected = selected === block.id

          return (
            <Rnd
              key={block.id}
              position={{ x, y }}
              size={{ width: w, height: h }}
              bounds="parent"
              onMouseDown={() => setSelected(block.id)}
              onDragStop={(_, d) => { void handleDragStop(block, d.x, d.y) }}
              onResizeStop={(_, __, ref, ___, pos) =>
                handleResizeStop(block, ref.offsetWidth, ref.offsetHeight, pos.x, pos.y)
              }
              style={{
                border: isSelected ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'grab',
                boxShadow: isSelected ? `0 0 0 3px ${accent}44` : '0 2px 16px rgba(0,0,0,0.5)',
              }}
            >
              {block.type === 'image' ? (
                <img src={block.content} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                  onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }} />
              ) : editingText === block.id ? (
                <textarea autoFocus defaultValue={block.content}
                  onBlur={async e => {
                    setEditingText(null)
                    const next = blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } : b)
                    updateBlock(block.id, { content: e.target.value })
                    await saveBlocks(next)
                  }}
                  style={{ width: '100%', height: '100%', border: 'none', outline: 'none', resize: 'none', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontFamily: FONT_FAMILIES[block.font ?? 'default'], fontSize: `${block.fontSize ?? 16}px`, padding: '10px' }} />
              ) : (
                <div onDoubleClick={() => setEditingText(block.id)}
                  style={{ width: '100%', height: '100%', padding: '10px', color: '#fff', fontFamily: FONT_FAMILIES[block.font ?? 'default'], fontSize: `${block.fontSize ?? 16}px`, wordBreak: 'break-word', userSelect: 'none', backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
                  {block.content}
                </div>
              )}
            </Rnd>
          )
        })}
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />

      <p style={{ fontSize: '11px', color: colors.text.muted, marginTop: '8px' }}>
        Glisse · Redimensionne les coins · Double-clic pour éditer un texte
      </p>
    </div>
  )
}
