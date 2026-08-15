'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { NexModal } from '@/components/ui/nex-modal'
import { colors } from '@/lib/design-tokens'

interface ReportButtonProps {
  reportedUserId?: string
  reportedPostId?: string
  reportedEventId?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ReportButton({
  reportedUserId,
  reportedPostId,
  reportedEventId,
  size = 'sm',
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('auth_token') || ''
      if (!token) {
        setStatus('error')
        setErrorMsg('Vous devez être connecté pour signaler du contenu')
        return
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reported_user_id: reportedUserId || null,
          reported_post_id: reportedPostId || null,
          reported_event_id: reportedEventId || null,
          reason,
          description: description || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Échec du signalement')
      }

      setStatus('success')
      setReason('')
      setDescription('')
      setTimeout(() => { setIsOpen(false); setStatus('idle') }, 2000)
    } catch (error: any) {
      setStatus('error')
      setErrorMsg(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    border: `1.5px solid ${colors.border.default}`,
    backgroundColor: colors.bg.secondary,
    color: colors.text.primary,
    outline: 'none',
  }

  const footer = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        disabled={isLoading}
        style={{
          flex: 1, padding: '9px 16px', borderRadius: '8px',
          border: `1px solid ${colors.border.default}`,
          backgroundColor: colors.bg.secondary,
          color: colors.text.secondary,
          fontSize: '14px', fontWeight: 500, cursor: 'pointer',
        }}
      >
        Annuler
      </button>
      <button
        type="submit"
        form="report-form"
        disabled={!reason || isLoading || status === 'success'}
        style={{
          flex: 1, padding: '9px 16px', borderRadius: '8px',
          border: 'none',
          backgroundColor: colors.feedback.danger.solid,
          color: colors.text.onDanger,
          fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          opacity: (!reason || isLoading || status === 'success') ? 0.5 : 1,
        }}
      >
        {isLoading ? 'Envoi…' : 'Signaler'}
      </button>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Signaler ce contenu"
        style={{
          minWidth: '44px', minHeight: '44px',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px', border: 'none',
          backgroundColor: 'transparent',
          color: colors.text.muted,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = colors.feedback.danger.solid
          e.currentTarget.style.backgroundColor = colors.feedback.danger.bg
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = colors.text.muted
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <Flag size={iconSize} />
      </button>

      <NexModal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setStatus('idle') }}
        title="Signaler du contenu"
        subtitle="Notre équipe examine tous les signalements sous 24-48h."
        footer={footer}
      >
        {status === 'success' && (
          <div style={{
            padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
            backgroundColor: colors.feedback.success.bg,
            border: `1px solid ${colors.feedback.success.border}`,
            color: colors.feedback.success.text,
            fontSize: '14px',
          }}>
            ✅ Signalement envoyé. Merci pour votre vigilance.
          </div>
        )}

        {status === 'error' && (
          <div style={{
            padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
            backgroundColor: colors.feedback.danger.bg,
            border: `1px solid ${colors.feedback.danger.border}`,
            color: colors.feedback.danger.text,
            fontSize: '14px',
          }}>
            ❌ {errorMsg}
          </div>
        )}

        <form id="report-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text.primary, marginBottom: '6px' }}>
              Raison du signalement *
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={isLoading}
              style={inputStyle}
            >
              <option value="">Choisir une raison…</option>
              <option value="spam">Spam ou arnaque</option>
              <option value="harassment">Harcèlement</option>
              <option value="inappropriate">Contenu inapproprié</option>
              <option value="copyright">Violation de droits d&apos;auteur</option>
              <option value="fraud">Fraude</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: colors.text.primary, marginBottom: '6px' }}>
              Détails supplémentaires (optionnel)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Expliquez pourquoi vous signalez ce contenu…"
              rows={3}
              disabled={isLoading}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </form>

        <p style={{ fontSize: '12px', color: colors.text.muted, marginTop: '12px', textAlign: 'center', lineHeight: 1.5 }}>
          Les faux signalements peuvent entraîner la suspension du compte.
        </p>
      </NexModal>
    </>
  )
}
