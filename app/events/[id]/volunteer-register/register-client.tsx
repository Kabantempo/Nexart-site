'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react'

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

export default function RegisterClient({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [form, setForm] = useState({ name: '', email: '', selectedShifts: [] as string[] })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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
      const res = await fetch(`/api/events/${eventId}/volunteers/public-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), shifts: form.selectedShifts }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Une erreur est survenue.')
        return
      }
      setStep('success')
    } catch (e) {
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#9CA3AF' }}>
      Chargement…
    </div>
  )

  if (step === 'success') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '48px 40px', maxWidth: '460px', textAlign: 'center' }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={32} color="#10B981" />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Inscription confirmée !</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
          Merci {form.name} ! Votre inscription comme bénévole a bien été prise en compte.<br />
          Vous recevrez votre planning par email une fois les créneaux validés.
        </p>
        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Vous pouvez fermer cette page.</p>
      </motion.div>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '540px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Users size={22} color="#6366F1" />
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px 0' }}>Inscription bénévole</p>
            <h1 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>{event?.title || 'Événement'}</h1>
            {event?.start_date && (
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '3px 0 0 0' }}>
                {new Date(event.start_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {event.city ? ` · ${event.city}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Infos personnelles */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Vos informations</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Prénom et nom *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Marie Dupont"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="marie@exemple.fr"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Créneaux */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
            Créneaux disponibles <span style={{ color: '#9CA3AF', fontWeight: 400 }}>({form.selectedShifts.length} sélectionné{form.selectedShifts.length > 1 ? 's' : ''})</span>
          </h2>
          {shifts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '8px', fontSize: '13px' }}>
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
                      backgroundColor: selected ? '#EEF2FF' : full ? '#F9FAFB' : '#FFFFFF',
                      border: `1px solid ${selected ? '#A5B4FC' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      cursor: full ? 'not-allowed' : 'pointer',
                      opacity: full ? 0.6 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${selected ? '#6366F1' : '#D1D5DB'}`, backgroundColor: selected ? '#6366F1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                    </div>
                    <Clock size={14} color={selected ? '#6366F1' : '#9CA3AF'} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{shift.role}</span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: '8px' }}>
                        {shift.date ? new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} · {shift.time}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: full ? '#EF4444' : '#10B981', fontWeight: 500, flexShrink: 0 }}>
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
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', marginBottom: '16px' }}
            >
              <AlertCircle size={14} color="#EF4444" />
              <span style={{ fontSize: '13px', color: '#DC2626' }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', padding: '12px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '15px', fontWeight: 600, opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Inscription en cours…' : "S'inscrire comme bénévole"}
        </button>
        <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: '12px' }}>
          Vos données sont utilisées uniquement pour la gestion des bénévoles de cet événement.
        </p>
      </motion.div>
    </div>
  )
}
