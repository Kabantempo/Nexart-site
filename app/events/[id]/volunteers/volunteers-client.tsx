'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock, Users, Trash2, Check, X, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Shift {
  id: string
  role: string
  start_time: string
  end_time: string
  max_volunteers: number
  description?: string
  volunteer_assignments?: Assignment[]
}

interface Assignment {
  id: string
  shift_id: string
  volunteer_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  profiles?: { full_name: string; avatar_url?: string }
}

const ROLES = ['Accueil', 'Installation', 'Rangement', 'Sécurité', 'Communication', 'Logistique', 'Caisse', 'Autre']

export default function VolunteersClient({ eventId }: { eventId: string }) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ role: '', start_time: '', end_time: '', max_volunteers: 2, description: '' })
  const [error, setError] = useState('')

  useEffect(() => { fetchShifts() }, [eventId])

  const fetchShifts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('volunteer_shifts')
      .select('*, volunteer_assignments(id, shift_id, volunteer_id, status, profiles(full_name, avatar_url))')
      .eq('event_id', eventId)
      .order('start_time')
    setShifts((data || []) as unknown as Shift[])
    setLoading(false)
  }

  const createShift = async () => {
    if (!form.role || !form.start_time || !form.end_time) { setError('Rôle, heure début et fin requis'); return }
    setSaving(true)
    const { error: err } = await supabase.from('volunteer_shifts').insert({
      event_id: eventId,
      role: form.role,
      start_time: form.start_time,
      end_time: form.end_time,
      max_volunteers: form.max_volunteers,
      description: form.description || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setForm({ role: '', start_time: '', end_time: '', max_volunteers: 2, description: '' })
    setShowForm(false)
    setError('')
    fetchShifts()
  }

  const deleteShift = async (shiftId: string) => {
    await supabase.from('volunteer_shifts').delete().eq('id', shiftId)
    setShifts(prev => prev.filter(s => s.id !== shiftId))
  }

  const updateAssignment = async (assignmentId: string, status: 'confirmed' | 'cancelled') => {
    await supabase.from('volunteer_assignments').update({ status }).eq('id', assignmentId)
    fetchShifts()
  }

  const totalVolunteers = shifts.reduce((acc, s) => acc + (s.volunteer_assignments?.filter(a => a.status === 'confirmed').length || 0), 0)
  const totalCapacity = shifts.reduce((acc, s) => acc + s.max_volunteers, 0)

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Header */}
        <Link href={`/events/${eventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Retour à l'événement
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A', marginBottom: '4px' }}>Bénévoles</h1>
            {!loading && <p style={{ fontSize: '14px', color: '#6B7280' }}>{totalVolunteers}/{totalCapacity} places confirmées sur {shifts.length} shift{shifts.length > 1 ? 's' : ''}</p>}
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={16} /> Créer un shift
          </button>
        </motion.div>

        {/* Formulaire création shift */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ border: '1px solid #E5E7EB', borderRadius: '14px', padding: '24px', marginBottom: '24px', overflow: 'hidden' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '20px' }}>Nouveau shift</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Rôle</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', backgroundColor: '#FFFFFF' }}>
                    <option value="">Choisir un rôle</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Début</label>
                  <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Fin</label>
                  <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Nb. places</label>
                  <input type="number" min={1} max={50} value={form.max_volunteers} onChange={e => setForm({ ...form, max_volunteers: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', display: 'block', marginBottom: '6px' }}>Description (optionnel)</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Accueil des exposants à l'entrée principale"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#1A1A1A', boxSizing: 'border-box' }} />
              </div>
              {error && <p style={{ color: '#E05A5A', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={createShift} disabled={saving} style={{ padding: '10px 24px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Création...' : 'Créer le shift'}
                </button>
                <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '10px 20px', backgroundColor: '#F5F5F7', color: '#6B7280', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Liste shifts */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : shifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed #E5E7EB', borderRadius: '16px' }}>
            <Users size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', color: '#6B7280' }}>Aucun shift créé</p>
            <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Créez des shifts pour organiser vos bénévoles</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shifts.map((shift, i) => {
              const confirmed = shift.volunteer_assignments?.filter(a => a.status === 'confirmed').length || 0
              const pending = shift.volunteer_assignments?.filter(a => a.status === 'pending').length || 0
              const fillPct = Math.round((confirmed / shift.max_volunteers) * 100)

              return (
                <motion.div key={shift.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ border: '1px solid #E5E7EB', borderRadius: '14px', padding: '20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ padding: '3px 10px', backgroundColor: '#EEF2FF', color: '#6366F1', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{shift.role}</span>
                        {pending > 0 && <span style={{ padding: '3px 10px', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{pending} en attente</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6B7280', fontSize: '13px' }}>
                          <Clock size={13} />
                          {new Date(shift.start_time).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          {' → '}
                          {new Date(shift.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6B7280', fontSize: '13px' }}>
                          <UserCheck size={13} />
                          {confirmed}/{shift.max_volunteers} confirmés
                        </div>
                      </div>
                      {shift.description && <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>{shift.description}</p>}
                    </div>
                    <button onClick={() => deleteShift(shift.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Barre de remplissage */}
                  <div style={{ backgroundColor: '#F5F5F7', borderRadius: '4px', height: '6px', marginBottom: '12px' }}>
                    <div style={{ backgroundColor: fillPct >= 100 ? '#10B981' : '#6366F1', borderRadius: '4px', height: '100%', width: `${Math.min(fillPct, 100)}%`, transition: 'width 400ms' }} />
                  </div>

                  {/* Assignations */}
                  {shift.volunteer_assignments && shift.volunteer_assignments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {shift.volunteer_assignments.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F9F9FB', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#6366F1' }}>
                              {a.profiles?.full_name?.charAt(0) || '?'}
                            </div>
                            <span style={{ fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>{a.profiles?.full_name || 'Bénévole'}</span>
                          </div>
                          {a.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => updateAssignment(a.id, 'confirmed')} style={{ padding: '4px 10px', backgroundColor: '#ECFDF5', color: '#10B981', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} /> Confirmer
                              </button>
                              <button onClick={() => updateAssignment(a.id, 'cancelled')} style={{ padding: '4px 10px', backgroundColor: '#FEF2F2', color: '#E05A5A', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <X size={12} /> Refuser
                              </button>
                            </div>
                          ) : (
                            <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: a.status === 'confirmed' ? '#ECFDF5' : '#FEF2F2', color: a.status === 'confirmed' ? '#10B981' : '#E05A5A' }}>
                              {a.status === 'confirmed' ? '✓ Confirmé' : '✗ Annulé'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
