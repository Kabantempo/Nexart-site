'use client'

import { useState } from 'react'
import { Bell, BellOff, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useToast } from './toast-provider'

interface Props {
  disciplines?: string[]
  city?: string
  region?: string
  query?: string
}

export function SaveSearchButton({ disciplines = [], city, region, query }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState(query || disciplines.join(', ') || (city ?? region ?? 'Ma recherche'))
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { success, error: toastError } = useToast()

  const save = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toastError('Connecte-toi pour sauvegarder une alerte'); setSaving(false); return }
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ label, disciplines, city, region, radius_km: 50, notify_email: notifyEmail }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      success('Alerte sauvegardée ! Tu seras notifié par email.')
      setSaved(true)
      setOpen(false)
    } catch (e: unknown) {
      toastError((e as Error)?.message ?? 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', fontSize: '13px', color: '#15803D', fontWeight: '600' }}>
        <Check size={14} /> Alerte activée
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#fff', color: '#6366F1', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 150ms' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D2FE' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB' }}
        aria-label="Sauvegarder cette recherche"
      >
        <Bell size={14} /> Être notifié
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '44px', right: 0, zIndex: 1000,
              backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '16px', width: 'min(300px, calc(100vw - 32px))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Créer une alerte</p>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px' }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', display: 'block', marginBottom: '4px' }}>Nom de l'alerte</label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            {(disciplines.length > 0 || city || region) && (
              <div style={{ marginBottom: '12px', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#F9FAFB', fontSize: '12px', color: '#6B7280' }}>
                {disciplines.length > 0 && <p style={{ margin: '0 0 2px' }}>📌 {disciplines.join(', ')}</p>}
                {(city || region) && <p style={{ margin: 0 }}>📍 {city || region}</p>}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} style={{ accentColor: '#6366F1' }} />
              Recevoir les alertes par email
            </label>

            <button
              onClick={save}
              disabled={saving || !label.trim()}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: saving || !label.trim() ? '#C7D2FE' : '#6366F1', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: saving || !label.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {saving ? 'Sauvegarde...' : 'Activer l\'alerte'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
