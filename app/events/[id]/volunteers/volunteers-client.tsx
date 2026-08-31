'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Trash2, Clock, CheckCircle, Mail, Download, Calendar, X, Shuffle, AlertCircle, BarChart2, Phone, Copy, ExternalLink, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Shift {
  id: string; event_id: string; role: string; date: string; time: string; capacity: number; assigned: number; created_at: string
}
interface Volunteer {
  id: string; event_id: string; name: string; email: string; phone?: string; shifts: string[]; status: 'active' | 'unavailable'; created_at: string
}
interface Assignment {
  id: string; shift_id: string; volunteer_id: string
}
interface EventInfo {
  start_date: string; end_date: string; start_time?: string; end_time?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}
async function authedFetch(url: string, opts: RequestInit = {}) {
  const token = await getToken()
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) } })
}
function greedyAssign(shifts: Shift[], volunteers: Volunteer[]): Map<string, string[]> {
  const assignments = new Map<string, string[]>()
  const load = new Map<string, number>()
  volunteers.forEach(v => load.set(v.id, 0))
  for (const shift of [...shifts].sort((a, b) => a.capacity - b.capacity)) {
    assignments.set(shift.id, [])
    const avail = volunteers.filter(v => v.status === 'active').sort((a, b) => (load.get(a.id) || 0) - (load.get(b.id) || 0))
    let filled = 0
    for (const vol of avail) {
      if (filled >= shift.capacity) break
      assignments.get(shift.id)!.push(vol.id)
      load.set(vol.id, (load.get(vol.id) || 0) + 1)
      filled++
    }
  }
  return assignments
}
function getEventDates(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  while (current <= end) { dates.push(current.toISOString().split('T')[0]); current.setDate(current.getDate() + 1) }
  return dates
}
function getTimeSlots(startTime?: string, endTime?: string): string[] {
  if (!startTime || !endTime) return []
  const slots: string[] = []
  for (let h = parseInt(startTime.split(':')[0], 10); h <= parseInt(endTime.split(':')[0], 10); h++)
    slots.push(`${h.toString().padStart(2, '0')}:00`)
  return slots
}
function initials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }

// ─── Sheet Modal (portal — works everywhere) ──────────────────────────────────

function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!mounted) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9000, backdropFilter: 'blur(2px)' }}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxHeight: '92dvh', overflowY: 'auto', background: 'var(--bg-primary)', borderRadius: '20px 20px 0 0', zIndex: 9001, boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: colors.border.default }} />
            </div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
              <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '20px', paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 700, color: colors.violet.primary }}>{initials(name)}</span>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{children}</label>
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ width: '100%', padding: '14px', border: `1.5px solid ${colors.border.default}`, borderRadius: '10px', fontSize: '16px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', boxSizing: 'border-box', ...props.style }} />
}

function Select({ ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ width: '100%', padding: '14px', border: `1.5px solid ${colors.border.default}`, borderRadius: '10px', fontSize: '16px', outline: 'none', background: 'var(--bg-primary)', color: 'var(--text-primary)', ...props.style }} />
}

function PrimaryBtn({ children, onClick, disabled, fullWidth }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; fullWidth?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: fullWidth ? '100%' : undefined, padding: '14px 20px', background: disabled ? colors.border.default : colors.violet.primary, color: disabled ? 'var(--text-secondary)' : '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: disabled ? 'default' : 'pointer', transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '14px 20px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: `1.5px solid ${colors.border.default}`, borderRadius: '12px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>
      {children}
    </button>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function Empty({ icon: Icon, title, subtitle, action }: { icon: any; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px', border: `1.5px dashed ${colors.border.default}` }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon size={24} color={colors.violet.primary} />
      </div>
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>{subtitle}</p>}
      {action}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'shifts' as const, label: 'Activités', icon: Clock },
  { id: 'volunteers' as const, label: 'Bénévoles', icon: Users },
  { id: 'planning' as const, label: 'Planning', icon: Calendar },
  { id: 'recap' as const, label: 'Récap', icon: BarChart2 },
  { id: 'checklist' as const, label: 'Jour J', icon: CheckCircle },
]

export default function VolunteersClient({ eventId }: { eventId: string }) {
  const [tab, setTab] = useState<typeof TABS[number]['id']>('shifts')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [shareUrl, setShareUrl] = useState('')
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(`${window.location.origin}/events/${eventId}/volunteer-register`)
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
      setVolunteers(Array.isArray(volData) ? volData : (Array.isArray(volData?.data) ? volData.data : []))
      setShifts(Array.isArray(shiftData) ? shiftData : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [eventId])

  useEffect(() => {
    supabase.from('events').select('start_date, end_date, start_time, end_time').eq('id', eventId).single().then(({ data }) => {
      if (data?.start_date) setEventInfo({ start_date: data.start_date, end_date: data.end_date || data.start_date, start_time: data.start_time ?? undefined, end_time: data.end_time ?? undefined })
    })
  }, [eventId])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: `3px solid ${colors.violet.bg}`, borderTopColor: colors.violet.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 0 40px' }}>
      {/* ── Header ── */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Bénévoles</h1>
          <a href={shareUrl} target="_blank" rel="noreferrer" title="Ouvrir lien inscription" style={{ width: '40px', height: '40px', borderRadius: '12px', background: colors.violet.bg, border: `1px solid ${colors.purple.bgLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: colors.violet.primary }}>
            <ExternalLink size={17} />
          </a>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          {volunteers.length} bénévole{volunteers.length !== 1 ? 's' : ''} · {shifts.length} activité{shifts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* ── Tab strip ── */}
      <div style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', gap: '6px', padding: '0 16px 20px', WebkitOverflowScrolling: 'touch' } as any}>
        <style>{`.vol-tab-strip::-webkit-scrollbar { display: none }`}</style>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', border: 'none', background: active ? colors.violet.primary : 'var(--bg-secondary)', color: active ? '#fff' : 'var(--text-secondary)', fontSize: '13px', fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>
              <t.icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '0 16px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {tab === 'shifts' && <ShiftsTab eventId={eventId} shifts={shifts} onRefresh={fetchAll} eventInfo={eventInfo} />}
            {tab === 'volunteers' && <VolunteersTab eventId={eventId} volunteers={volunteers} shifts={shifts} shareUrl={shareUrl} onRefresh={fetchAll} />}
            {tab === 'planning' && <PlanningTab eventId={eventId} shifts={shifts} volunteers={volunteers} onRefresh={fetchAll} onSwitchTab={setTab} />}
            {tab === 'recap' && <RecapTab shifts={shifts} volunteers={volunteers} />}
            {tab === 'checklist' && <ChecklistTab eventId={eventId} shifts={shifts} volunteers={volunteers} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Shifts Tab ───────────────────────────────────────────────────────────────

function ShiftsTab({ eventId, shifts, onRefresh, eventInfo }: { eventId: string; shifts: Shift[]; onRefresh: () => void; eventInfo: EventInfo | null }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ role: '', date: '', time: '', capacity: '5' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!form.role || !form.date || !form.time) return
    setSaving(true)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/shifts`, { method: 'POST', body: JSON.stringify({ role: form.role, date: form.date, time: form.time, capacity: parseInt(form.capacity) }) })
      setForm({ role: '', date: '', time: '', capacity: '5' })
      setOpen(false)
      onRefresh()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/shifts/${id}`, { method: 'DELETE' })
      onRefresh()
    } catch (e) { console.error(e) } finally { setDeleting(null) }
  }

  const eventDates = eventInfo ? getEventDates(eventInfo.start_date, eventInfo.end_date) : []
  const timeSlots = getTimeSlots(eventInfo?.start_time, eventInfo?.end_time)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{shifts.length} créneau{shifts.length !== 1 ? 'x' : ''}</span>
        <button onClick={() => setOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: colors.violet.primary, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Nouvelle activité
        </button>
      </div>

      {shifts.length === 0 ? (
        <Empty icon={Clock} title="Aucune activité" subtitle="Créez votre premier créneau bénévole." action={<PrimaryBtn onClick={() => setOpen(true)}>+ Créer un créneau</PrimaryBtn>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shifts.map(s => {
            const pct = s.capacity > 0 ? Math.min(100, Math.round((s.assigned / s.capacity) * 100)) : 0
            const barColor = pct >= 100 ? colors.green.primary : pct >= 60 ? colors.status?.pending?.dot ?? '#F59E0B' : colors.violet.primary
            return (
              <div key={s.id} style={{ background: 'var(--bg-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '14px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} color={colors.violet.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.role}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                    {s.date ? new Date(s.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                    {s.time ? ` · ${s.time}` : ''}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '3px', transition: 'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 }}>{s.assigned}/{s.capacity}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} style={{ width: '36px', height: '36px', borderRadius: '10px', background: colors.feedback?.danger?.bg ?? '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === s.id ? 0.4 : 1, flexShrink: 0 }}>
                  <Trash2 size={15} color={colors.feedback?.danger?.solid ?? '#E05A5A'} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Nouvelle activité">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <FieldLabel>Intitulé</FieldLabel>
            <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex : Accueil, Bar, Animation…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <FieldLabel>Date</FieldLabel>
              {eventDates.length > 0 ? (
                <Select value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {eventDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</option>)}
                </Select>
              ) : (
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              )}
            </div>
            <div>
              <FieldLabel>Heure</FieldLabel>
              {timeSlots.length > 0 ? (
                <Select value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}>
                  <option value="">Choisir…</option>
                  {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              ) : (
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              )}
            </div>
          </div>
          <div>
            <FieldLabel>Nombre de bénévoles</FieldLabel>
            <Input type="number" min="1" max="100" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} />
          </div>
          <PrimaryBtn onClick={handleAdd} disabled={saving || !form.role || !form.date || !form.time} fullWidth>
            {saving ? 'Enregistrement…' : 'Ajouter l\'activité'}
          </PrimaryBtn>
        </div>
      </Sheet>
    </div>
  )
}

// ─── Volunteers Tab ───────────────────────────────────────────────────────────

function VolunteersTab({ eventId, volunteers, shifts, shareUrl, onRefresh }: { eventId: string; volunteers: Volunteer[]; shifts: Shift[]; shareUrl: string; onRefresh: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAdd = async () => {
    if (!form.name || !form.email) return
    setSaving(true)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers`, { method: 'POST', body: JSON.stringify({ name: form.name, email: form.email, ...(form.phone ? { phone: form.phone } : {}) }) })
      setForm({ name: '', email: '', phone: '' })
      setOpen(false)
      onRefresh()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/${id}`, { method: 'DELETE' })
      onRefresh()
    } catch (e) { console.error(e) } finally { setDeleting(null) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportCSV = () => {
    const rows = [['Nom', 'Email', 'Téléphone', 'Statut', 'Inscrit le'], ...volunteers.map(v => [v.name, v.email, v.phone ?? '', v.status, new Date(v.created_at).toLocaleDateString('fr-FR')])]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `benevoles-${eventId}.csv` })
    a.click()
  }

  return (
    <div>
      {/* Share strip */}
      <div style={{ background: colors.violet.bg, border: `1px solid ${colors.purple.bgLight}`, borderRadius: '14px', padding: '14px 16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: colors.violet.primary, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lien inscription</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={copyLink} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: copied ? colors.green.bg : 'var(--bg-primary)', border: `1px solid ${copied ? colors.green.primary : colors.border.default}`, borderRadius: '10px', color: copied ? colors.green.primary : 'var(--text-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
          </button>
          <a href={shareUrl} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: colors.violet.primary, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            <ExternalLink size={14} /> Ouvrir
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          <Download size={13} /> CSV
        </button>
        <button onClick={() => setOpen(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 14px', background: colors.violet.primary, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Ajouter manuellement
        </button>
      </div>

      {volunteers.length === 0 ? (
        <Empty icon={Users} title="Aucun bénévole" subtitle="Partagez le lien pour recevoir des inscriptions." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {volunteers.map(vol => (
            <div key={vol.id} style={{ background: 'var(--bg-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Avatar name={vol.name} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vol.name}</span>
                  <span style={{ fontSize: '11px', padding: '2px 7px', background: vol.status === 'active' ? colors.green.bg : 'var(--bg-secondary)', color: vol.status === 'active' ? colors.green.primary : 'var(--text-secondary)', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>
                    {vol.status === 'active' ? '✓' : '—'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vol.email}</p>
                {vol.phone && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} />{vol.phone}</p>}
              </div>
              <button onClick={() => handleDelete(vol.id)} disabled={deleting === vol.id} style={{ width: '36px', height: '36px', borderRadius: '10px', background: colors.feedback?.danger?.bg ?? '#FEE2E2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === vol.id ? 0.4 : 1, flexShrink: 0 }}>
                <Trash2 size={15} color={colors.feedback?.danger?.solid ?? '#E05A5A'} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Ajouter un bénévole">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <FieldLabel>Nom complet</FieldLabel>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemple.fr" />
          </div>
          <div>
            <FieldLabel>Téléphone <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optionnel)</span></FieldLabel>
            <Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+33 6 00 00 00 00" />
          </div>
          <PrimaryBtn onClick={handleAdd} disabled={saving || !form.name || !form.email} fullWidth>
            {saving ? 'Enregistrement…' : 'Ajouter'}
          </PrimaryBtn>
        </div>
      </Sheet>
    </div>
  )
}

// ─── Planning Tab ─────────────────────────────────────────────────────────────

function PlanningTab({ eventId, shifts, volunteers, onRefresh, onSwitchTab }: { eventId: string; shifts: Shift[]; volunteers: Volunteer[]; onRefresh: () => void; onSwitchTab: (t: typeof TABS[number]['id']) => void }) {
  const [plan, setPlan] = useState<Map<string, string[]> | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)

  const generate = () => { setPlan(greedyAssign(shifts, volunteers)); setSaved(false) }
  const save = async () => {
    if (!plan) return
    setSaving(true)
    try {
      const assignments: { shift_id: string; volunteer_id: string }[] = []
      plan.forEach((ids, sid) => ids.forEach(vid => assignments.push({ shift_id: sid, volunteer_id: vid })))
      await authedFetch(`/api/events/${eventId}/volunteers/assign`, { method: 'POST', body: JSON.stringify({ assignments }) })
      setSaved(true); onRefresh()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }
  const sendEmails = async () => {
    setSending(true)
    try {
      await authedFetch(`/api/events/${eventId}/volunteers/notify`, { method: 'POST', body: JSON.stringify({ type: 'assignment' }) })
      alert('Emails envoyés !')
    } catch (e) { console.error(e) } finally { setSending(false) }
  }
  const getVol = (id: string) => volunteers.find(v => v.id === id)

  if (shifts.length === 0 || volunteers.length === 0) return (
    <Empty icon={AlertCircle} title="Planning impossible" subtitle={shifts.length === 0 ? 'Ajoutez d\'abord des activités.' : 'Ajoutez d\'abord des bénévoles.'}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {shifts.length === 0 && <PrimaryBtn onClick={() => onSwitchTab('shifts')}><Clock size={14} /> Ajouter activités</PrimaryBtn>}
        {volunteers.length === 0 && <GhostBtn onClick={() => onSwitchTab('volunteers')}><Users size={14} /> Ajouter bénévoles</GhostBtn>}
      </div>
    </Empty>
  )

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        <button onClick={generate} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: colors.violet.primary, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          <Shuffle size={16} /> Générer le planning
        </button>
        {plan && !saved && (
          <button onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: colors.green.primary, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Check size={16} /> {saving ? 'Enregistrement…' : 'Valider le planning'}
          </button>
        )}
        {saved && (
          <button onClick={sendEmails} disabled={sending} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', background: '#F59E0B', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
            <Mail size={16} /> {sending ? 'Envoi…' : 'Envoyer aux bénévoles'}
          </button>
        )}
      </div>

      {!plan ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '14px', border: `1.5px dashed ${colors.border.default}`, fontSize: '14px' }}>
          Cliquez sur "Générer le planning" pour voir la répartition.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {shifts.map(shift => {
            const assigned = plan.get(shift.id) || []
            const full = assigned.length >= shift.capacity
            return (
              <div key={shift.id} style={{ background: 'var(--bg-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-secondary)', borderBottom: assigned.length > 0 ? `1px solid ${colors.border.default}` : 'none' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: full ? colors.green.bg : colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={16} color={full ? colors.green.primary : colors.violet.primary} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{shift.role}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                      {shift.date ? new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}{shift.time ? ` · ${shift.time}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', background: full ? colors.green.bg : colors.violet.bg, color: full ? colors.green.primary : colors.violet.primary, borderRadius: '8px', flexShrink: 0 }}>
                    {assigned.length}/{shift.capacity}
                  </span>
                </div>
                {assigned.length > 0 && (
                  <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {assigned.map(vid => {
                      const v = getVol(vid)
                      return v ? (
                        <div key={vid} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: colors.violet.bg, borderRadius: '20px' }}>
                          <Avatar name={v.name} size={20} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.purple?.indigoDark ?? colors.violet.primary }}>{v.name}</span>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
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
  const toggle = (k: string) => setChecked(c => ({ ...c, [k]: !c[k] }))
  const active = volunteers.filter(v => v.status === 'active')
  const done = Object.values(checked).filter(Boolean).length
  const pct = active.length > 0 ? Math.round((done / active.length) * 100) : 0

  return (
    <div>
      {/* Progress header */}
      {active.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${colors.border.default}`, borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Présences confirmées</span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: pct === 100 ? colors.green.primary : colors.violet.primary }}>{pct}%</span>
          </div>
          <div style={{ height: '8px', background: colors.border.default, borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? colors.green.primary : colors.violet.primary, borderRadius: '4px', transition: 'width 0.4s' }} />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 0' }}>{done}/{active.length} bénévoles</p>
        </div>
      )}

      {active.length === 0 ? (
        <Empty icon={CheckCircle} title="Aucun bénévole actif" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {active.map(vol => {
            const k = `vol-${vol.id}`
            const isOn = checked[k] || false
            return (
              <div key={vol.id} onClick={() => toggle(k)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: isOn ? colors.green.bg : 'var(--bg-primary)', border: `1.5px solid ${isOn ? colors.green.primary : colors.border.default}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', border: `2.5px solid ${isOn ? colors.green.primary : colors.border.default}`, background: isOn ? colors.green.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {isOn && <Check size={13} color="#fff" strokeWidth={3} />}
                </div>
                <Avatar name={vol.name} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', textDecoration: isOn ? 'line-through' : 'none', opacity: isOn ? 0.5 : 1 }}>{vol.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{vol.email}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Recap Tab ────────────────────────────────────────────────────────────────

function RecapTab({ shifts, volunteers }: { shifts: Shift[]; volunteers: Volunteer[] }) {
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  const toggle = (k: string) => setConfirmed(c => ({ ...c, [k]: !c[k] }))
  const daysUntil = (d: string) => {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const e = new Date(d); e.setHours(0, 0, 0, 0)
    return Math.round((e.getTime() - t.getTime()) / 86400000)
  }

  if (shifts.length === 0) return <Empty icon={BarChart2} title="Aucune activité" subtitle="Ajoutez des activités pour voir le récap." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {shifts.map(shift => {
        const assigned = volunteers.filter(v => (v.shifts || []).includes(shift.id))
        const confCount = assigned.filter(v => confirmed[`${shift.id}-${v.id}`]).length
        const days = shift.date ? daysUntil(shift.date) : null
        const full = confCount >= shift.capacity
        return (
          <div key={shift.id} style={{ background: 'var(--bg-primary)', border: `1px solid ${colors.border.default}`, borderRadius: '16px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: full ? colors.green.bg : colors.violet.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Clock size={18} color={full ? colors.green.primary : colors.violet.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>{shift.role}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    {shift.date ? new Date(shift.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' }) : ''}
                    {shift.time ? ` · ${shift.time}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                  {days !== null && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: days < 0 ? 'var(--bg-secondary)' : days <= 1 ? '#FEE2E2' : days <= 3 ? '#FEF3C7' : 'var(--bg-secondary)', color: days < 0 ? 'var(--text-secondary)' : days <= 1 ? '#E05A5A' : days <= 3 ? '#D97706' : 'var(--text-secondary)' }}>
                      {days < 0 ? 'Passé' : days === 0 ? 'Auj.' : `J-${days}`}
                    </span>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: full ? colors.green.bg : colors.violet.bg, color: full ? colors.green.primary : colors.violet.primary }}>
                    {confCount}/{shift.capacity}
                  </span>
                </div>
              </div>
            </div>

            {/* Volunteer rows */}
            {assigned.length === 0 ? (
              <div style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Aucun bénévole assigné</div>
            ) : assigned.map((vol, i) => {
              const k = `${shift.id}-${vol.id}`
              const isConf = confirmed[k] || false
              return (
                <div key={vol.id} onClick={() => toggle(k)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderTop: `1px solid ${colors.border.default}`, cursor: 'pointer', background: isConf ? `${colors.green.bg}` : 'transparent', transition: 'background 0.15s' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isConf ? colors.green.primary : colors.border.default}`, background: isConf ? colors.green.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {isConf && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <Avatar name={vol.name} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{vol.name}</p>
                    {vol.phone && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} />{vol.phone}</p>}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', background: isConf ? colors.green.bg : 'var(--bg-secondary)', color: isConf ? colors.green.primary : 'var(--text-secondary)', border: `1px solid ${isConf ? colors.green.primary : colors.border.default}`, flexShrink: 0, transition: 'all 0.15s' }}>
                    {isConf ? '✓ Confirmé' : 'En attente'}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
