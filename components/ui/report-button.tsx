'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from './toast-provider'

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
  const [submitting, setSubmitting] = useState(false)
  const { success, error } = useToast()

  if (!reporterId) return null

  const handleSubmit = async () => {
    if (!reason) return
    setSubmitting(true)
    const { error: err } = await supabase.from('reports').insert({
      reporter_id: reporterId,
      target_id: targetId,
      target_type: targetType,
      reason,
    })
    if (err) {
      error('Erreur lors du signalement')
    } else {
      success('Signalement envoyé — merci')
      setOpen(false)
      setReason('')
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
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF' }}
      >
        <Flag size={14} /> Signaler
      </button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setOpen(false)}>
          <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px' }}>Signaler ce contenu</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>Pourquoi signalez-vous ce contenu ?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {REASONS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${reason === r ? '#6366F1' : 'var(--border-color)'}`, backgroundColor: reason === r ? '#F0F4FF' : 'var(--bg-secondary)' }}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#6366F1' }} />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: reason === r ? '600' : '400' }}>{r}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSubmit} disabled={!reason || submitting}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: !reason || submitting ? '#D1D5DB' : '#E05A5A', color: '#FFF', fontSize: '14px', fontWeight: '700', cursor: !reason || submitting ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Envoi…' : 'Envoyer'}
              </button>
              <button onClick={() => setOpen(false)}
                style={{ padding: '11px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
