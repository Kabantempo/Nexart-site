'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, X, Check, AlertCircle, ChevronRight, RefreshCw, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import DocumentsPanel from '@/components/documents-panel'
import { NexTabs } from '@/components/ui/nex-tabs'
import { colors } from '@/lib/design-tokens'

interface ExhibitorField {
  id: string
  field_name: string
  field_label: string
  field_type: string
  required: boolean
}

interface Exhibitor {
  id: string
  exhibitor_id: string
  response_data: Record<string, any>
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled' | 'stand_proposed' | 'counter_proposed' | 'awaiting_payment'
  tables_count: number
  submitted_at: string
  profiles?: { full_name: string | null; email: string | null }
  proposed_stand?: { size: string; price: number; note?: string } | null
}

export default function ExhibitorsClient({ eventId }: { eventId: string }) {
  const [view, setView] = useState<'form-setup' | 'dashboard' | 'documents'>('form-setup')
  const [fields, setFields] = useState<ExhibitorField[]>([])
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [standModal, setStandModal] = useState<{ exhibitorId: string; mode: 'propose' | 'accept_counter' | 'confirm'; current?: Exhibitor['proposed_stand'] } | null>(null)

  // Fetch fields and exhibitors on mount
  useEffect(() => {
    fetchFields()
    fetchExhibitors()
  }, [eventId])

  const fetchFields = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/exhibitor-fields`)
      const data = await res.json()
      setFields(data.fields || [])
      // If no fields yet, show setup view
      if (!data.fields || data.fields.length === 0) {
        setView('form-setup')
      } else {
        setView('dashboard')
      }
    } catch (error) {
      console.error('Error fetching fields:', error)
    }
  }

  const fetchExhibitors = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const status = filterStatus === 'all' ? '' : `?status=${filterStatus}`
      const res = await fetch(`/api/events/${eventId}/exhibitors${status}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setExhibitors(data.exhibitors || [])
    } catch (error) {
      console.error('Error fetching exhibitors:', error)
    }
  }

  const handleSaveFields = async (newFields: ExhibitorField[]) => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/events/${eventId}/exhibitor-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ fields: newFields })
      })
      const data = await res.json()
      if (data.success) {
        setFields(newFields)
        setView('dashboard')
        fetchExhibitors()
      }
    } catch (error) {
      console.error('Error saving fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors/export`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `exhibitors-${eventId}.csv`
      a.click()
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const handleStatusChange = async (exhibitorId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchExhibitors()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleProposeStand = async (exhibitorId: string, standData: { size: string; price: number; note?: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: 'stand_proposed', proposed_stand: standData })
      })
      if (res.ok) { setStandModal(null); fetchExhibitors() }
    } catch (error) {
      console.error('Error proposing stand:', error)
    }
  }

  const handleConfirmStand = async (exhibitorId: string, standData: { size: string; price: number; note?: string }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: 'awaiting_payment', proposed_stand: standData })
      })
      if (res.ok) { setStandModal(null); fetchExhibitors() }
    } catch (error) {
      console.error('Error confirming stand:', error)
    }
  }

  const handleAcceptCounter = async (exhibitorId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: 'accepted' })
      })
      if (res.ok) { setStandModal(null); fetchExhibitors() }
    } catch (error) {
      console.error('Error accepting counter:', error)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Gestion Exposants
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {view === 'form-setup' ? 'Personnalisez votre formulaire de candidature'
              : view === 'documents' ? 'Générez et envoyez les documents aux créateurs acceptés'
              : 'Gérez vos candidatures et approuvez les exposants'}
          </p>

          {/* Onglets */}
          <NexTabs
            tabs={[
              { key: 'form-setup', label: 'Formulaire' },
              { key: 'dashboard', label: 'Candidatures' },
              { key: 'documents', label: 'Documents' },
            ]}
            activeTab={view}
            onChange={k => setView(k as typeof view)}
            variant="underline"
            ariaLabel="Sections exposants"
          />
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }}>
        {view === 'form-setup' ? (
          <FormSetup fields={fields} onSave={handleSaveFields} loading={loading} />
        ) : view === 'documents' ? (
          <DocumentsPanel eventId={eventId} role="organizer" />
        ) : (
          <>
            <ExhibitorsDashboard
              exhibitors={exhibitors}
              fields={fields}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              onStatusChange={handleStatusChange}
              onExport={handleExportCSV}
              onProposeStand={(id: string, current?: { size: string; price: number; note?: string }) => setStandModal({ exhibitorId: id, mode: 'propose', current })}
              onAcceptCounter={(id: string) => setStandModal({ exhibitorId: id, mode: 'accept_counter' })}
              onConfirmStand={(id: string) => setStandModal({ exhibitorId: id, mode: 'confirm' })}
            />
            {standModal && (
              <StandModal
                mode={standModal.mode}
                current={standModal.current}
                onClose={() => setStandModal(null)}
                onSubmit={(data) => standModal.mode === 'confirm' ? handleConfirmStand(standModal.exhibitorId, data) : handleProposeStand(standModal.exhibitorId, data)}
                onAccept={() => handleAcceptCounter(standModal.exhibitorId)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Form Setup Component
function FormSetup({ fields, onSave, loading }: any) {
  const defaultFields = [
    { field_name: 'full_name', field_label: 'Nom Complet', field_type: 'text', required: true },
    { field_name: 'email', field_label: 'Email', field_type: 'text', required: true },
    { field_name: 'phone', field_label: 'Téléphone', field_type: 'text', required: false },
    { field_name: 'tables_needed', field_label: 'Nombre de tables', field_type: 'number', required: true },
    { field_name: 'special_requests', field_label: 'Demandes spéciales', field_type: 'textarea', required: false },
  ]

  const [localFields, setLocalFields] = useState<any[]>(fields.length > 0 ? fields : defaultFields)
  const [newField, setNewField] = useState({ field_label: '', field_type: 'text', required: false })
  const [showAddForm, setShowAddForm] = useState(false)

  const FIELD_TYPES = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'number', label: 'Nombre' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Téléphone' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'checkbox', label: 'Case à cocher' },
  ]

  const addField = () => {
    if (!newField.field_label.trim()) return
    const field_name = newField.field_label.toLowerCase().replace(/[^a-z0-9]/g, '_')
    setLocalFields([...localFields, { field_name, ...newField }])
    setNewField({ field_label: '', field_type: 'text', required: false })
    setShowAddForm(false)
  }

  const removeField = (idx: number) => {
    setLocalFields(localFields.filter((_: any, i: number) => i !== idx))
  }

  const toggleRequired = (idx: number) => {
    setLocalFields(localFields.map((f: any, i: number) => i === idx ? { ...f, required: !f.required } : f))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Champs du formulaire
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAddForm ? 'var(--bg-secondary)' : colors.violet.primary,
              color: showAddForm ? 'var(--text-primary)' : colors.bg.primary,
              border: showAddForm ? '1px solid var(--border-color)' : 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              fontSize: '14px'
            }}
          >
            <Plus size={14} />
            {showAddForm ? 'Annuler' : 'Ajouter un champ'}
          </button>
        </div>

        {/* Add field form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ backgroundColor: colors.violet.bg, border: `1px solid ${colors.purple.bgLight}`, borderRadius: '8px', padding: '20px', marginBottom: '24px' }}
          >
            <div className="resp-grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: colors.purple.indigoDark, marginBottom: '6px' }}>
                  Nom du champ
                </label>
                <input
                  type="text"
                  value={newField.field_label}
                  onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                  placeholder="Ex: SIRET, Site web..."
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.purple.bgLight}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: colors.purple.indigoDark, marginBottom: '6px' }}>
                  Type
                </label>
                <select
                  value={newField.field_type}
                  onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${colors.purple.bgLight}`, borderRadius: '6px', fontSize: '14px' }}
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: colors.purple.indigoDark }}>Obligatoire</label>
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
              <button
                onClick={addField}
                style={{ padding: '8px 16px', backgroundColor: colors.violet.primary, color: colors.bg.primary, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
              >
                Ajouter
              </button>
            </div>
          </motion.div>
        )}

        {/* Fields list */}
        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
          {localFields.map((field: any, idx: number) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: field.required ? colors.violet.primary : colors.gray["300"],
                  flexShrink: 0
                }} />
                <div>
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)', margin: 0, fontSize: '14px' }}>{field.field_label}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                    {' · '}
                    {field.required ? 'obligatoire' : 'optionnel'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => toggleRequired(idx)}
                  title={field.required ? 'Rendre optionnel' : 'Rendre obligatoire'}
                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
                >
                  {field.required ? <Check size={16} color={colors.violet.primary} /> : <AlertCircle size={16} color={colors.text.muted} />}
                </button>
                <button
                  onClick={() => removeField(idx)}
                  title="Supprimer ce champ"
                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: colors.coral.primary, padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => onSave(localFields)}
            disabled={loading || localFields.length === 0}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.violet.primary,
              color: colors.bg.primary,
              border: 'none',
              borderRadius: '6px',
              cursor: loading || localFields.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || localFields.length === 0 ? 0.6 : 1,
              fontWeight: 500
            }}
          >
            {loading ? 'Sauvegarde...' : `Valider (${localFields.length} champ${localFields.length > 1 ? 's' : ''})`}
          </button>
          <button
            onClick={() => setLocalFields(defaultFields)}
            style={{ padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer' }}
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Accepte',
  rejected: 'Refuse',
  awaiting_payment: 'Confirmation en attente',
  paid: 'Paye',
  cancelled: 'Annule',
  stand_proposed: 'Stand propose',
  counter_proposed: 'Contre-offre',
}

const STATUS_COLOR: Record<string, string> = {
  pending: colors.status.pending.text,
  approved: colors.status.accepted.text,
  rejected: colors.status.refused.text,
  awaiting_payment: colors.feedback.warning.solid,
  paid: colors.violet.primary,
  cancelled: 'var(--text-tertiary)',
  stand_proposed: colors.feedback.warning.solid,
  counter_proposed: colors.purple.dark,
}

// Exhibitors Dashboard Component
function ExhibitorsDashboard({ exhibitors, fields, filterStatus, onFilterChange, onStatusChange, onExport, onProposeStand, onAcceptCounter, onConfirmStand }: any) {
  const stats = {
    total: exhibitors.length,
    pending: exhibitors.filter((e: Exhibitor) => e.status === 'pending').length,
    approved: exhibitors.filter((e: Exhibitor) => e.status === 'approved').length,
    proposed: exhibitors.filter((e: Exhibitor) => e.status === 'stand_proposed').length,
    counter: exhibitors.filter((e: Exhibitor) => e.status === 'counter_proposed').length,
  }

  const filtered = filterStatus === 'all' ? exhibitors : exhibitors.filter((e: Exhibitor) => e.status === filterStatus)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '32px' }}>
        {[
          { label: 'Candidatures', value: stats.total },
          { label: 'En attente', value: stats.pending },
          { label: 'Acceptes', value: stats.approved },
          { label: 'Stand propose', value: stats.proposed, highlight: stats.proposed > 0 },
          { label: 'Contre-offres', value: stats.counter, highlight: stats.counter > 0 },
        ].map((s, i) => (
          <div key={i} style={{ border: `1px solid ${s.highlight ? colors.feedback.warning.border : 'var(--border-color)'}`, borderRadius: '8px', padding: '16px', backgroundColor: s.highlight ? colors.feedback.warning.bg : 'var(--bg-primary)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: s.highlight ? colors.feedback.warning.solid : 'var(--text-primary)', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + export */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'pending', 'stand_proposed', 'counter_proposed', 'approved', 'rejected'].map(st => (
          <button key={st} onClick={() => onFilterChange(st)} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: filterStatus === st ? `2px solid ${colors.violet.primary}` : `1px solid var(--border-color)`, backgroundColor: filterStatus === st ? colors.violet.bg : 'var(--bg-primary)', color: filterStatus === st ? colors.violet.primary : 'var(--text-secondary)' }}>
            {st === 'all' ? 'Tous' : STATUS_LABEL[st]}
          </button>
        ))}
        <button onClick={onExport} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500 }}>
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Createur</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Statut</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Stand propose</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex: Exhibitor) => {
                const isCounter = ex.status === 'counter_proposed'
                const isProposed = ex.status === 'stand_proposed'
                return (
                  <tr key={ex.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isCounter ? `${colors.purple.bgF5}` : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0, fontSize: '14px' }}>{ex.profiles?.full_name || 'N/A'}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{ex.profiles?.email || ''}</p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, backgroundColor: (STATUS_COLOR[ex.status] || 'var(--text-secondary)') + '18', color: STATUS_COLOR[ex.status] || 'var(--text-secondary)' }}>
                        {STATUS_LABEL[ex.status] || ex.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {ex.proposed_stand ? (
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{ex.proposed_stand.size} · {ex.proposed_stand.price} EUR</p>
                          {ex.proposed_stand.note && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{ex.proposed_stand.note}</p>}
                          {isCounter && <p style={{ margin: '4px 0 0', fontSize: '11px', fontWeight: 600, color: colors.purple.dark }}>Contre-offre du createur</p>}
                        </div>
                      ) : <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {ex.status === 'pending' && (
                          <>
                            <button onClick={() => onProposeStand(ex.id, ex.proposed_stand)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ChevronRight size={12} /> Proposer stand
                            </button>
                            <button onClick={() => onStatusChange(ex.id, 'rejected')} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${colors.feedback.danger.border}`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.text }}>
                              Refuser
                            </button>
                          </>
                        )}
                        {isProposed && (
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>En attente du createur…</span>
                        )}
                        {isCounter && (
                          <>
                            <button onClick={() => onAcceptCounter(ex.id)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: colors.feedback.success.solid, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} /> Accepter
                            </button>
                            <button onClick={() => onProposeStand(ex.id, ex.proposed_stand)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: `1px solid ${colors.violet.primary}`, backgroundColor: colors.violet.bg, color: colors.violet.primary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <RefreshCw size={12} /> Contre-proposer
                            </button>
                          </>
                        )}
                        {ex.status === 'approved' && (
                          <button onClick={() => onConfirmStand(ex.id)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', backgroundColor: colors.status.accepted.text, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> Confirme
                          </button>
                        )}
                        {ex.status === 'awaiting_payment' && (
                          <span style={{ fontSize: '12px', color: colors.feedback.warning.solid, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Confirmation en attente
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-secondary)' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Aucun candidat pour le moment</p>
        </div>
      )}
    </motion.div>
  )
}

// Modal: propose, counter-propose, or confirm a stand
function StandModal({ mode, current, onClose, onSubmit, onAccept }: {
  mode: 'propose' | 'accept_counter' | 'confirm'
  current?: { size: string; price: number; note?: string } | null
  onClose: () => void
  onSubmit: (data: { size: string; price: number; note?: string }) => void
  onAccept: () => void
}) {
  const [size, setSize] = useState(mode === 'accept_counter' ? (current?.size ?? '') : '')
  const [price, setPrice] = useState(mode === 'accept_counter' ? String(current?.price ?? '') : '')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!size.trim() || !price) return
    setSubmitting(true)
    await onSubmit({ size: size.trim(), price: Number(price), note: note.trim() || undefined })
    setSubmitting(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {mode === 'accept_counter' ? 'Contre-proposition du createur' : mode === 'confirm' ? 'Attribuer un stand' : 'Proposer un stand'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}><X size={18} /></button>
        </div>

        {mode === 'accept_counter' && current && (
          <div style={{ backgroundColor: colors.purple.bgF5, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', border: `1px solid ${colors.purple.bgLight}` }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: colors.purple.dark, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Offre du createur</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{current.size} · {current.price} EUR</p>
            {current.note && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{current.note}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={async () => { setSubmitting(true); await onAccept(); setSubmitting(false) }} disabled={submitting} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: colors.feedback.success.solid, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Accepter cette offre
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0 0', textAlign: 'center' }}>ou faites une nouvelle proposition ci-dessous</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Taille du stand</label>
            <input value={size} onChange={e => setSize(e.target.value)} placeholder="ex: 3m × 2m" required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Prix (EUR)</label>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="ex: 150" required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Note (optionnel)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Emplacement, conditions particulieres…" rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="submit" disabled={submitting || !size.trim() || !price} style={{ flex: 2, padding: '11px', borderRadius: '8px', border: 'none', backgroundColor: mode === 'confirm' ? colors.status.accepted.text : colors.violet.primary, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: (!size.trim() || !price) ? 0.5 : 1 }}>
              {submitting ? 'Envoi…' : mode === 'confirm' ? 'Confirmer et attribuer' : mode === 'accept_counter' ? 'Envoyer ma contre-proposition' : 'Envoyer la proposition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
