'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, CheckCircle, Clock, AlertCircle, LogIn } from 'lucide-react'
import { colors } from '@/lib/design-tokens'
import { supabase } from '@/lib/supabase'

interface Shift {
  id: string
  role: string
  date: string
  time: string
  capacity: number
  assigned: number
}

interface EventInfo {
  title: string
  start_date: string
  city: string
}

interface NexartUser {
  id: string
  full_name: string
  email: string
}

export default function RegisterClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [form, setForm] = useState({ name: '', email: '', selectedShifts: [] as string[] })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [nexartUser, setNexartUser] = useState<NexartUser | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, shiftRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/volunteers/shifts/public`),
        ])
        if (evRes.ok) {
          const ev = await evRes.json()
          setEvent(ev.event || ev)
        }
        if (shiftRes.ok) {
          const data = await shiftRes.json()
          setShifts(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()

    // Check Nexart session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .maybeSingle()
      const user: NexartUser = {
        id: session.user.id,
        full_name: profile?.full_name || session.user.email?.split('@')[0] || '',
        email: session.user.email || '',
      }
      setNexartUser(user)
      setForm(f => ({ ...f, name: user.full_name, email: user.email }))
    })
  }, [eventId])

  const toggleShift = (shiftId: string) => {
    setForm(f => ({
      ...f,
      selectedShifts: f.selectedShifts.includes(shiftId)
        ? f.selectedShifts.filter(id => id !== shiftId)
        : [...f.selectedShifts, shiftId],
    }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Veuillez remplir votre nom et email.')
      return
    }
    if (form.selectedShifts.length === 0) {
      setError('Sélectionnez au moins un créneau.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        shifts: form.selectedShifts,
      }
      if (nexartUser) body.user_id = nexartUser.id

      const res = await fetch(`/api/events/${eventId}/volunteers/public-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Une erreur est survenue.')
        return
      }
      setStep('success')
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: colors.text.muted }}>
      Chargement…
    </div>
  )

  if (step === 'success') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', padding: '24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '48px 40px', maxWidth: '460px', textAlign: 'center' }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: colors.green.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} color={colors.green.primary} />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Inscription confirmée !</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Merci {form.name} ! Votre inscription comme bénévole a bien été prise en compte.<br />
          Vous recevrez votre planning par email une fois les créneaux validés.
        </p>
        {nexartUser && (
          <div style={{ padding: '10px 16px', background: colors.violet.bg, borderRadius: '10px', fontSize: '13px', color: colors.violet.text, marginBottom: '16px' }}>
            ✓ Vos créneaux apparaîtront dans votre dashboard Nexart
          </div>
        )}
        <p style={{ fontSize: '12px', color: colors.text.muted }}>Vous pouvez fermer cette page.</p>
      </motion.div>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', padding: '24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '540px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color={colors.violet.primary} />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px 0' }}>Inscription bénévole</p>
            <h1 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{event?.title || 'Événement'}</h1>
            {event?.start_date && (
              <p style={{ fontSize: '12px', color: colors.text.muted, margin: '3px 0 0 0' }}>
                {new Date(event.start_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.city ? ` · ${event.city}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Nexart account banner */}
        {nexartUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: colors.violet.bg, border: `1px solid ${colors.purple.bgLight}`, borderRadius: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: colors.violet.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', color: '#fff', fontWeight: 700 }}>
              {nexartUser.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{nexartUser.full_name}</p>
              <p style={{ fontSize: '11px', color: colors.violet.text, margin: 0 }}>Compte Nexart connecté · vos créneaux iront dans votre dashboard</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '20px' }}>
            <LogIn size={16} color="var(--text-secondary)" />
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
              Vous avez un compte Nexart ?{' '}
              <a href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`} style={{ color: colors.violet.primary, fontWeight: 600, textDecoration: 'none' }}>
                Connectez-vous
              </a>
              {' '}pour retrouver vos créneaux dans votre dashboard.
            </p>
          </div>
        )}

        {/* Infos personnelles */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Vos informations</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Prénom et nom *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Marie Dupont"
                readOnly={!!nexartUser}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: nexartUser ? 'var(--bg-secondary)' : 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="marie@exemple.fr"
                readOnly={!!nexartUser}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: nexartUser ? 'var(--bg-secondary)' : 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Créneaux */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Créneaux disponibles <span style={{ color: colors.text.muted, fontWeight: 400 }}>({form.selectedShifts.length} sélectionné{form.selectedShifts.length > 1 ? 's' : ''})</span>
          </h2>
          {shifts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: colors.text.muted, border: `1px dashed ${colors.border.default}`, borderRadius: '8px', fontSize: '13px' }}>
              Aucun créneau disponible pour le moment.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {shifts.map(shift => {
                const selected = form.selectedShifts.includes(shift.id)
                const full = shift.assigned >= shift.capacity
                return (
                  <div
                    key={shift.id}
                    onClick={() => !full && toggleShift(shift.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: selected ? colors.violet.bg : full ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      border: `1px solid ${selected ? colors.purple.bgPale : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      cursor: full ? 'not-allowed' : 'pointer',
                      opacity: full ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${selected ? colors.violet.primary : colors.gray["300"]}`, backgroundColor: selected ? colors.violet.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ color: colors.bg.primary, fontSize: '12px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <Clock size={14} color={selected ? colors.violet.primary : colors.text.muted} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{shift.role}</span>
                      <span style={{ fontSize: '12px', color: colors.text.muted, marginLeft: '8px' }}>
                        {shift.date ? new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} · {shift.time}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: full ? colors.red.vivid : colors.green.primary, fontWeight: 500, flexShrink: 0 }}>
                      {full ? 'Complet' : `${shift.capacity - shift.assigned} place${shift.capacity - shift.assigned > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: colors.red.bg, border: `1px solid ${colors.red.medium}`, borderRadius: '8px', marginBottom: '16px' }}
            >
              <AlertCircle size={14} color={colors.red.vivid} />
              <span style={{ fontSize: '13px', color: colors.feedback.danger.solid }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', padding: '12px', backgroundColor: colors.violet.primary, color: colors.bg.primary, border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Inscription en cours…' : "S'inscrire comme bénévole"}
        </button>
        <p style={{ fontSize: '11px', color: colors.text.muted, textAlign: 'center', marginTop: '12px' }}>
          Vos données sont utilisées uniquement pour la gestion des bénévoles de cet événement.
        </p>
      </motion.div>
    </div>
  )
}
