'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Trash2, Clock, CheckCircle, Mail, Download, Calendar, Link, ChevronRight, X, Shuffle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shift {
  id: string
  event_id: string
  role: string
  date: string
  time: string
  capacity: number
  assigned: number
  created_at: string
}

interface Volunteer {
  id: string
  event_id: string
  name: string
  email: string
  shifts: string[]
  status: 'active' | 'unavailable'
  created_at: string
}

interface Assignment {
  id: string
  shift_id: string
  volunteer_id: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

async function authedFetch(url: string, opts: RequestInit = {}) {
  const token = await getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  }
  return fetch(url, { ...opts, headers })
}

// ─── Greedy Matching ──────────────────────────────────────────────────────────

function greedyAssign(shifts: Shift[], volunteers: Volunteer[]): Map<string, string[]> {
  // Returns Map<shiftId, volunteerIds[]>
  const assignments = new Map<string, string[]>()
  const volunteerLoad = new Map<string, number>()

  volunteers.forEach(v => volunteerLoad.set(v.id, 0))

  const sorted = [...shifts].sort((a, b) => a.capacity - b.capacity)

  for (const shift of sorted) {
    assignments.set(shift.id, [])
    const available = volunteers
      .filter(v => v.status === 'active')
      .sort((a, b) => (volunteerLoad.get(a.id) || 0) - (volunteerLoad.get(b.id) || 0))

    let filled = 0
    for (const vol of available) {
      if (filled >= shift.capacity) break
      const current = assignments.get(shift.id) || []
      current.push(vol.id)
      assignments.set(shift.id, current)
      volunteerLoad.set(vol.id, (volunteerLoad.get(vol.id) || 0) + 1)
      filled++
    }
  }

  return assignments
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VolunteersClient({ eventId }: { eventId: string }) {
  const [tab, setTab] = useState<'shifts' | 'volunteers' | 'planning' | 'checklist'>('shifts')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/events/${eventId}/volunteer-register`)
    }
  }, [eventId])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [volRes, shiftRes] = await Promise.all([
        authedFetch(`/api/events/${eventId}/volunteers`),
        authedFetch(`/api/events/${eventId}/volunteers/shifts`),
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
  }, [eventId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const tabs = [
    { id: 'shifts' as const, label: 'Activités', icon: Clock },
    { id: 'volunteers' as const, label: 'Bénévoles', icon: Users },
    { id: 'planning' as const, label: 'Planning', icon: Calendar },
    { id: 'checklist' as const, label: 'Jour J', icon: CheckCircle },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#9CA3AF' }}>
      Chargement…
    </div>
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>Bénévoles</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#6B7280' }}>{volunteers.length} bénévoles · {shifts.length} activités</span>
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Lien copié !') }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
          >
            <Link size={13} /> Copier lien inscription
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid #E5E7EB', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 18px',
              backgroundColor: 'transparent',
              color: tab === t.id ? '#6366F1' : '#6B7280',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: tab === t.id ? 600 : 400,
              transition: 'all 0.15s',
            }}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'shifts' && (
        <ShiftsTab eventId={eventId} shifts={shifts} onRefresh={fetchAll} />
      )}
      {tab === 'volunteers' && (
        <VolunteersTab eventId={eventId} volunteers={volunteers} shifts={shifts} shareUrl={shareUrl} onRefresh={fetchAll} />
      )}
      {tab === 'planning' && (
        <PlanningTab eventId={eventId} shifts={shifts} volunteers={volunteers} onRefresh={fetchAll} />
      )}
      {tab === 'checklist' && (
        <ChecklistTab eventId={eventId} shifts={shifts} volunteers={volunteers} />
      )}
    </div>
  )
}

// ─── Shifts Tab ───────────────────────────────────────────────────────────────

function ShiftsTab({ eventId, shifts, onRefresh }: { eventId: string; shifts: Shift[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ role: '', date: '', time: '', capacity: '5' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!form.role || !form.date || !form.time) return
    setSaving(true)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/shifts`, {
        method: 'POST',
        body: JSON.stringify({ role: form.role, date: form.date, time: form.time, capacity: parseInt(form.capacity) }),
      })
      setForm({ role: '', date: '', time: '', capacity: '5' })
      setShowForm(false)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (shiftId: string) => {
    setDeleting(shiftId)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/shifts/${shiftId}`, { method: 'DELETE' })
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  const roles = ['Accueil', 'Setup', 'Bar', 'Sécurité', 'Nettoyage', 'Animation', 'Caisse', 'Autre']

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Définissez les créneaux à pourvoir</p>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
        >
          <Plus size={14} /> Nouvelle activité
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '20px' }}
          >
            <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Nouvelle activité</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Rôle</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    <option value="">Choisir…</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Heure</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Capacité</label>
                  <input type="number" min="1" max="50" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Annuler</button>
                <button onClick={handleAdd} disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Enregistrement…' : 'Ajouter'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {shifts.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          Aucune activité définie. Ajoutez un créneau pour commencer.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {shifts.map(shift => {
            const fillPct = shift.capacity > 0 ? Math.round((shift.assigned / shift.capacity) * 100) : 0
            return (
              <div key={shift.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} color="#6366F1" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{shift.role}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {shift.date ? new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''} · {shift.time}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${fillPct}%`, backgroundColor: fillPct >= 100 ? '#10B981' : fillPct >= 50 ? '#F59E0B' : '#6366F1', borderRadius: '3px', transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>{shift.assigned}/{shift.capacity} bénévoles</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(shift.id)}
                  disabled={deleting === shift.id}
                  style={{ padding: '6px', backgroundColor: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer', opacity: deleting === shift.id ? 0.5 : 1, flexShrink: 0 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Volunteers Tab ───────────────────────────────────────────────────────────

function VolunteersTab({ eventId, volunteers, shifts, shareUrl, onRefresh }: {
  eventId: string; volunteers: Volunteer[]; shifts: Shift[]; shareUrl: string; onRefresh: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  const handleAdd = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers`, {
        method: 'POST',
        body: JSON.stringify({ name: form.name, email: form.email }),
      })
      setForm({ name: '', email: '' })
      setShowForm(false)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (volId: string) => {
    setDeleting(volId)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/${volId}`, { method: 'DELETE' })
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['Nom', 'Email', 'Statut', 'Inscrit le'],
      ...volunteers.map(v => [v.name, v.email, v.status, new Date(v.created_at).toLocaleDateString('fr-FR')]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benevoles-${eventId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div>
      {/* Share banner */}
      <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link size={16} color="#6366F1" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#4338CA', margin: '0 0 2px 0' }}>Lien d'inscription bénévoles</p>
          <p style={{ fontSize: '12px', color: '#6366F1', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</p>
        </div>
        <button onClick={copyLink} style={{ padding: '6px 14px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, flexShrink: 0 }}>
          {linkCopied ? '✓ Copié !' : 'Copier'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>{volunteers.length} bénévoles inscrits</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => setShowForm(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <Plus size={14} /> Ajouter manuellement
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Nom</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.fr"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Annuler</button>
                <button onClick={handleAdd} disabled={saving} style={{ padding: '8px 16px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Enregistrement…' : 'Ajouter'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {volunteers.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
          Aucun bénévole pour le moment. Partagez le lien d'inscription !
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nom', 'Email', 'Statut', 'Inscrit le', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {volunteers.map((vol, i) => (
                <tr key={vol.id} style={{ borderBottom: i < volunteers.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366F1' }}>{vol.name[0].toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{vol.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B7280' }}>{vol.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: vol.status === 'active' ? '#ECFDF5' : '#F3F4F6', color: vol.status === 'active' ? '#10B981' : '#9CA3AF', borderRadius: '4px', fontWeight: 500 }}>
                      {vol.status === 'active' ? '✓ Disponible' : 'Indisponible'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#9CA3AF' }}>{new Date(vol.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => handleDelete(vol.id)} disabled={deleting === vol.id} style={{ padding: '4px', backgroundColor: 'transparent', color: '#EF4444', border: 'none', cursor: 'pointer', opacity: deleting === vol.id ? 0.5 : 1 }}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Planning Tab ─────────────────────────────────────────────────────────────

function PlanningTab({ eventId, shifts, volunteers, onRefresh }: { eventId: string; shifts: Shift[]; volunteers: Volunteer[]; onRefresh: () => void }) {
  const [plan, setPlan] = useState<Map<string, string[]> | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = () => {
    const result = greedyAssign(shifts, volunteers)
    setPlan(result)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!plan) return
    setSaving(true)
    try {
      const assignments: { shift_id: string; volunteer_id: string }[] = []
      plan.forEach((volIds, shiftId) => {
        volIds.forEach(volId => assignments.push({ shift_id: shiftId, volunteer_id: volId }))
      })
      await authedFetch(`/api/events/${eventId}/volunteers/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignments }),
      })
      setSaved(true)
      onRefresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmails = async () => {
    setSending(true)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/notify`, {
        method: 'POST',
        body: JSON.stringify({ type: 'assignment' }),
      })
      alert('Emails envoyés aux bénévoles assignés !')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  const getVolunteer = (id: string) => volunteers.find(v => v.id === id)

  if (shifts.length === 0 || volunteers.length === 0) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
        <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
        Ajoutez des activités et des bénévoles avant de générer un planning.
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Planning automatique</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Algo greedy — répartition équilibrée de la charge</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleGenerate} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
            <Shuffle size={14} /> Générer planning
          </button>
          {plan && !saved && (
            <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : '✓ Valider'}
            </button>
          )}
          {saved && (
            <button onClick={handleSendEmails} disabled={sending} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', backgroundColor: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, opacity: sending ? 0.6 : 1 }}>
              <Mail size={14} /> {sending ? 'Envoi…' : 'Envoyer assignations'}
            </button>
          )}
        </div>
      </div>

      {!plan ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          Cliquez sur "Générer planning" pour voir la proposition.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {shifts.map(shift => {
            const assigned = plan.get(shift.id) || []
            const isFull = assigned.length >= shift.capacity
            return (
              <div key={shift.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: isFull ? '#ECFDF5' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={18} color={isFull ? '#10B981' : '#6366F1'} />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 2px 0' }}>{shift.role}</p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      {shift.date ? new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''} à {shift.time}
                    </p>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, padding: '4px 10px', backgroundColor: isFull ? '#ECFDF5' : '#FEF3C7', color: isFull ? '#10B981' : '#D97706', borderRadius: '6px' }}>
                    {assigned.length}/{shift.capacity}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {assigned.length === 0 ? (
                    <span style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>Aucun bénévole disponible</span>
                  ) : assigned.map(volId => {
                    const vol = getVolunteer(volId)
                    return vol ? (
                      <div key={volId} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#EEF2FF', borderRadius: '20px' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#FFFFFF' }}>{vol.name[0].toUpperCase()}</span>
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: '#4338CA' }}>{vol.name}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Checklist Tab ────────────────────────────────────────────────────────────

function ChecklistTab({ eventId, shifts, volunteers }: { eventId: string; shifts: Shift[]; volunteers: Volunteer[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => setChecked(c => ({ ...c, [key]: !c[key] }))

  const totalVols = volunteers.filter(v => v.status === 'active').length
  const checkedCount = Object.values(checked).filter(Boolean).length
  const totalItems = volunteers.filter(v => v.status === 'active').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Checklist Jour J</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{checkedCount}/{totalItems} bénévoles confirmés présents</p>
        </div>
        {totalItems > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '120px', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`, backgroundColor: '#10B981', borderRadius: '4px', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>{totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0}%</span>
          </div>
        )}
      </div>

      {volunteers.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          Aucun bénévole inscrit.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {volunteers.filter(v => v.status === 'active').map(vol => {
            const key = `vol-${vol.id}`
            const isChecked = checked[key] || false
            return (
              <div
                key={vol.id}
                onClick={() => toggle(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 20px',
                  backgroundColor: isChecked ? '#ECFDF5' : '#FFFFFF',
                  border: `1px solid ${isChecked ? '#A7F3D0' : '#E5E7EB'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isChecked ? '#10B981' : '#D1D5DB'}`, backgroundColor: isChecked ? '#10B981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {isChecked && <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px 0', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.6 : 1 }}>{vol.name}</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{vol.email}</p>
                </div>
                {isChecked && <CheckCircle size={18} color="#10B981" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
