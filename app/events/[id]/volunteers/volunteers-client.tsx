'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Trash2, Clock, CheckCircle, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Volunteer {
  id: string
  name: string
  email: string
  shifts: string[]
  status: string
  created_at: string
}

interface Shift {
  id: string
  role: string
  date: string
  time: string
  capacity: number
  assigned: number
}

export default function VolunteersClient({ eventId }: { eventId: string }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'volunteers' | 'shifts'>('volunteers')
  const [showAddVolunteer, setShowAddVolunteer] = useState(false)
  const [showAddShift, setShowAddShift] = useState(false)
  const [volForm, setVolForm] = useState({ name: '', email: '' })
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '', end_time: '', max_volunteers: '5' })

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  useEffect(() => {
    fetchAll()
  }, [eventId])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const [volRes, shiftRes] = await Promise.all([
        fetch(`/api/events/${eventId}/volunteers`, { headers }),
        fetch(`/api/events/${eventId}/volunteers/shifts`, { headers }),
      ])
      const volData = await volRes.json()
      const shiftData = await shiftRes.json()
      setVolunteers(Array.isArray(volData) ? volData : [])
      setShifts(Array.isArray(shiftData) ? shiftData : [])
    } catch (err) {
      console.error('Error fetching volunteers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVolunteer = async () => {
    if (!volForm.name || !volForm.email) return
    try {
      const token = await getToken()
      await fetch(`/api/events/${eventId}/volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: volForm.name, email: volForm.email }),
      })
      setVolForm({ name: '', email: '' })
      setShowAddVolunteer(false)
      fetchAll()
    } catch (err) {
      console.error('Error adding volunteer:', err)
    }
  }

  const handleAddShift = async () => {
    if (!shiftForm.name || !shiftForm.start_time || !shiftForm.end_time) return
    try {
      const token = await getToken()
      await fetch(`/api/events/${eventId}/volunteers/shifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...shiftForm, max_volunteers: parseInt(shiftForm.max_volunteers) }),
      })
      setShiftForm({ name: '', start_time: '', end_time: '', max_volunteers: '5' })
      setShowAddShift(false)
      fetchAll()
    } catch (err) {
      console.error('Error adding shift:', err)
    }
  }

  const handleDelete = async (id: string, type: 'volunteer' | 'shift') => {
    if (!confirm('Supprimer ?')) return
    try {
      const token = await getToken()
      const url = type === 'volunteer'
        ? `/api/events/${eventId}/volunteers/${id}`
        : `/api/events/${eventId}/volunteers/shifts/${id}`
      await fetch(url, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      fetchAll()
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>⏳ Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Bénévoles</h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
              {volunteers.length} bénévole{volunteers.length !== 1 ? 's' : ''} · {shifts.length} créneau{shifts.length !== 1 ? 'x' : ''}
            </p>
          </div>
          <button
            onClick={() => tab === 'volunteers' ? setShowAddVolunteer(true) : setShowAddShift(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            <Plus size={16} />
            {tab === 'volunteers' ? 'Ajouter bénévole' : 'Nouveau créneau'}
          </button>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px', marginBottom: '32px', width: 'fit-content' }}>
          {(['volunteers', 'shifts'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                backgroundColor: tab === t ? '#6366F1' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-secondary)' }}>
              {t === 'volunteers' ? 'Bénévoles' : 'Créneaux'}
            </button>
          ))}
        </div>

        {/* Volunteers list */}
        {tab === 'volunteers' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '12px' }}>
            {volunteers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                <Users size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Aucun bénévole pour l'instant</p>
              </div>
            ) : volunteers.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366F1', fontSize: '16px' }}>
                    {v.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{v.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} />{v.email}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '20px', padding: '4px 10px', fontWeight: 600 }}>
                    <CheckCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {v.status || 'Actif'}
                  </span>
                  <button onClick={() => handleDelete(v.id, 'volunteer')}
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Shifts list */}
        {tab === 'shifts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gap: '12px' }}>
            {shifts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Aucun créneau défini</p>
              </div>
            ) : shifts.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px', marginBottom: '4px' }}>{s.role || '—'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} />
                    {s.date || '—'} {s.time || ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {s.assigned ?? 0}/{s.capacity ?? '∞'} bénévoles
                  </span>
                  <button onClick={() => handleDelete(s.id, 'shift')}
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Modal add volunteer */}
      {showAddVolunteer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowAddVolunteer(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '32px', width: '90%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Ajouter un bénévole</h2>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              {(['name', 'email'] as const).map(field => (
                <input key={field} type={field === 'email' ? 'email' : 'text'}
                  placeholder={field === 'name' ? 'Nom' : 'Email'}
                  value={volForm[field]} onChange={e => setVolForm(f => ({ ...f, [field]: e.target.value }))}
                  style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px' }} />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => setShowAddVolunteer(false)}
                style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}>Annuler</button>
              <button onClick={handleAddVolunteer}
                style={{ padding: '12px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Ajouter</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal add shift */}
      {showAddShift && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowAddShift(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', padding: '32px', width: '90%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>Nouveau créneau</h2>
            <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
              <input type="text" placeholder="Nom du créneau (ex: Accueil matin)"
                value={shiftForm.name} onChange={e => setShiftForm(f => ({ ...f, name: e.target.value }))}
                style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Début</label>
                  <input type="datetime-local" value={shiftForm.start_time} onChange={e => setShiftForm(f => ({ ...f, start_time: e.target.value }))}
                    style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Fin</label>
                  <input type="datetime-local" value={shiftForm.end_time} onChange={e => setShiftForm(f => ({ ...f, end_time: e.target.value }))}
                    style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', width: '100%' }} />
                </div>
              </div>
              <input type="number" placeholder="Max bénévoles" min="1"
                value={shiftForm.max_volunteers} onChange={e => setShiftForm(f => ({ ...f, max_volunteers: e.target.value }))}
                style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button onClick={() => setShowAddShift(false)}
                style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}>Annuler</button>
              <button onClick={handleAddShift}
                style={{ padding: '12px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Créer</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
