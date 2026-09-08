'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X } from 'lucide-react'
import { colors } from '@/lib/design-tokens'

interface Props {
  value?: string
  positionY?: number
  onChange: (url: string | undefined) => void
  onPositionChange?: (y: number) => void
  accentColor: string
}

export function CoverImageUploader({ value, positionY = 50, onChange, onPositionChange, accentColor }: Props) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('Fichier image requis'); return }
    if (file.size > 5 * 1024 * 1024) { setErr('Max 5 Mo'); return }
    setErr(null)
    setUploading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non connecté')
      const ext = file.name.split('.').pop()
      const path = `${session.user.id}/covers/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch (e) {
      setErr((e as Error)?.message ?? 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Image de couverture
      </p>
      {value ? (
        <div>
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '100px' }}>
            <img src={value} alt="Couverture" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `center ${positionY}%` }} />
            <button
              onClick={() => onChange(undefined)}
              style={{ position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} color="#fff" />
            </button>
          </div>
          {onPositionChange && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Position verticale</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{positionY}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={positionY}
                onChange={e => onPositionChange(Number(e.target.value))}
                style={{ width: '100%', accentColor, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                <span>Haut</span><span>Bas</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            width: '100%', height: '80px', borderRadius: '12px', border: `2px dashed ${accentColor}44`,
            backgroundColor: `${accentColor}08`, cursor: uploading ? 'wait' : 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '6px', color: accentColor, fontSize: '12px',
          }}
        >
          <Upload size={18} />
          {uploading ? 'Upload en cours…' : 'Ajouter une bannière'}
        </button>
      )}
      {err && <p style={{ fontSize: '11px', color: colors.feedback.danger.solid, marginTop: '6px' }}>{err}</p>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  )
}
