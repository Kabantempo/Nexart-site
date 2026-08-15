'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from './toast-provider'
import { NexModal } from './nex-modal'

interface Props {
  targetId: string
  targetType: 'creator' | 'event' | 'post'
  reporterId?: string
}

const REASONS = [
  'Contenu inapproprié',
  'Informations fausses',
  'Spam ou publicité',
  'Comportement abusif',
  'Autre',
]

export function ReportButton({ targetId, targetType, reporterId }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [customText, setCustomText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { success, error } = useToast()

  if (!reporterId) return null

  const isAutreSelected = reason === 'Autre'
  const canSubmit = reason && (!isAutreSelected || customText.trim().length > 0)
  const finalReason = isAutreSelected && customText.trim() ? `Autre : ${customText.trim()}` : reason

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    const { error: err } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      target_id: targetId,
      target_type: targetType,
      reason: finalReason,
    })
    if (err) {
      error('Erreur lors du signalement')
    } else {
      success('Signalement envoyé — merci')
      setOpen(false)
      setReason('')
      setCustomText('')
    }
    setSubmitting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Signaler ce contenu"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E05A5A' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
      >
        <Flag size={14} /> Signaler
      </button>

      <NexModal
        isOpen={open}
        onClose={() => { setOpen(false); setReason(''); setCustomText('') }}
        title="Signaler ce contenu"
        subtitle="Pourquoi signalez-vous ce contenu ?"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: !canSubmit || submitting ? 'var(--border-color)' : '#E05A5A', color: '#FFF', fontSize: '14px', fontWeight: '700', cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </button>
            <button onClick={() => { setOpen(false); setReason(''); setCustomText('') }}
              style={{ padding: '11px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {REASONS.map(r => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${reason === r ? '#6366F1' : 'var(--border-color)'}`, backgroundColor: reason === r ? '#F0F4FF' : 'var(--bg-secondary)' }}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#6366F1' }} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: reason === r ? '600' : '400' }}>{r}</span>
            </label>
          ))}
          {isAutreSelected && (
            <textarea
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder="Décrivez le problème…"
              maxLength={500}
              rows={3}
              autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #6366F1', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          )}
        </div>
      </NexModal>
    </>
  )
}
