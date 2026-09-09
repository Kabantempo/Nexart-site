'use client'

import React, { useEffect, useState } from 'react'
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

export default function ExhibitorsClient({ eventId, defaultTab, solo }: { eventId: string; defaultTab?: 'form-setup' | 'dashboard' | 'documents'; solo?: boolean }) {
  const [view, setView] = useState<'form-setup' | 'dashboard' | 'documents'>(defaultTab ?? 'dashboard')
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
      // En mode solo le view est fixé par defaultTab — ne pas le changer
      if (!solo) {
        if (!data.fields || data.fields.length === 0) {
          setView('form-setup')
        } else {
          setView('dashboard')
        }
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
            {view === 'form-setup' ? 'Formulaire exposants'
              : view === 'documents' ? 'Documents'
              : 'Candidatures'}
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {view === 'form-setup' ? 'Personnalisez votre formulaire de candidature'
              : view === 'documents' ? 'Générez et envoyez les documents aux créateurs acceptés'
              : 'Gérez vos candidatures et approuvez les exposants'}
          </p>

          {/* Onglets — masqués en mode solo */}
          {!solo && (
            <NexTabs
              tabs={[
                { key: 'dashboard', label: 'Candidatures' },
                { key: 'form-setup', label: 'Formulaire' },
                { key: 'documents', label: 'Documents' },
              ]}
              activeTab={view}
              onChange={k => setView(k as typeof view)}
              variant="underline"
              ariaLabel="Sections exposants"
            />
          )}
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
    awaiting: exhibitors.filter((e: Exhibitor) => e.status === 'awaiting_payment').length,
  }

  const filtered = filterStatus === 'all' ? exhibitors : exhibitors.filter((e: Exhibitor) => e.status === filterStatus)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Total', value: stats.total, status: 'all' },
          { label: 'En attente', value: stats.pending, status: 'pending' },
          { label: 'Acceptes', value: stats.approved, status: 'approved' },
          { label: 'Stand propose', value: stats.proposed, status: 'stand_proposed', highlight: stats.proposed > 0 },
          { label: 'Contre-offres', value: stats.counter, status: 'counter_proposed', highlight: stats.counter > 0 },
          { label: 'Paiement', value: stats.awaiting, status: 'awaiting_payment', highlight: stats.awaiting > 0 },
        ].map((s, i) => (
          <button key={i} onClick={() => onFilterChange(s.status)}
            style={{ border: `1px solid ${filterStatus === s.status ? colors.violet.primary : s.highlight ? colors.feedback.warning.border : 'var(--border-color)'}`, borderRadius: '8px', padding: '14px', backgroundColor: filterStatus === s.status ? colors.violet.bg : s.highlight ? colors.feedback.warning.bg : 'var(--bg-primary)', cursor: 'pointer', textAlign: 'left' }}>
            <p style={{ color: filterStatus === s.status ? colors.violet.primary : 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: filterStatus === s.status ? colors.violet.primary : s.highlight ? colors.feedback.warning.solid : 'var(--text-primary)', margin: 0 }}>{s.value}</p>
          </button>
        ))}
      </div>

      {/* Export + reset filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center', justifyContent: 'flex-end' }}>
        {filterStatus !== 'all' && (
          <button onClick={() => onFilterChange('all')} style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid var(--border-color)`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px', fontWeight: 500 }}>
            Voir tout
          </button>
        )}
        <button onClick={onExport} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500 }}>
          <Download size={13} /> CSV
        </button>
      </div>

      {/* Desktop table */}
      <div className="exhib-table-wrap" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
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
                      <ExhibitorActions ex={ex} onStatusChange={onStatusChange} onProposeStand={onProposeStand} onAcceptCounter={onAcceptCounter} onConfirmStand={onConfirmStand} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="exhib-cards-wrap" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
        {filtered.map((ex: Exhibitor) => {
          const isCounter = ex.status === 'counter_proposed'
          const ini = ex.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
          return (
            <div key={ex.id} style={{ borderRadius: 12, border: `1px solid ${isCounter ? colors.purple.bgLight : 'var(--border-color)'}`, backgroundColor: isCounter ? colors.purple.bgF5 : 'var(--bg-secondary)', padding: '14px 16px' }}>
              {/* Header: avatar + name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: colors.violet.wash, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: colors.violet.primary, flexShrink: 0 }}>{ini}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.profiles?.full_name || 'N/A'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.profiles?.email || ''}</p>
                </div>
                <span style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: (STATUS_COLOR[ex.status] || 'var(--text-secondary)') + '22', color: STATUS_COLOR[ex.status] || 'var(--text-secondary)' }}>
                  {STATUS_LABEL[ex.status] || ex.status}
                </span>
              </div>
              {/* Stand info */}
              {ex.proposed_stand && (
                <div style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--bg-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ex.proposed_stand.size} · {ex.proposed_stand.price} EUR</span>
                  {isCounter && <span style={{ fontSize: 11, fontWeight: 600, color: colors.purple.dark }}>Contre-offre</span>}
                </div>
              )}
              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <ExhibitorActions ex={ex} onStatusChange={onStatusChange} onProposeStand={onProposeStand} onAcceptCounter={onAcceptCounter} onConfirmStand={onConfirmStand} mobile />
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-secondary)' }}>
          <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Aucun candidat pour le moment</p>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .exhib-table-wrap { display: none !important; }
          .exhib-cards-wrap { display: flex !important; }
        }
      `}</style>
    </motion.div>
  )
}

function ExhibitorActions({ ex, onStatusChange, onProposeStand, onAcceptCounter, onConfirmStand, mobile }: {
  ex: Exhibitor; onStatusChange: any; onProposeStand: any; onAcceptCounter: any; onConfirmStand: any; mobile?: boolean
}) {
  const isCounter = ex.status === 'counter_proposed'
  const isProposed = ex.status === 'stand_proposed'
  const btnBase: React.CSSProperties = mobile
    ? { width: '100%', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
    : { padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }

  return (
    <div style={{ display: 'flex', gap: mobile ? 6 : '6px', flexWrap: mobile ? undefined : 'wrap', flexDirection: mobile ? 'column' : undefined }}>
      {ex.status === 'pending' && (
        <>
          <button onClick={() => onProposeStand(ex.id, ex.proposed_stand)} style={{ ...btnBase, border: 'none', backgroundColor: colors.violet.primary, color: colors.bg.primary }}>
            <ChevronRight size={mobile ? 14 : 12} /> Proposer stand
          </button>
          <button onClick={() => onStatusChange(ex.id, 'rejected')} style={{ ...btnBase, border: `1px solid ${colors.feedback.danger.border}`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.text }}>
            Refuser
          </button>
        </>
      )}
      {isProposed && (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>En attente du createur…</span>
      )}
      {isCounter && (
        <>
          <button onClick={() => onAcceptCounter(ex.id)} style={{ ...btnBase, border: 'none', backgroundColor: colors.feedback.success.solid, color: '#fff' }}>
            <Check size={mobile ? 14 : 12} /> Accepter
          </button>
          <button onClick={() => onProposeStand(ex.id, ex.proposed_stand)} style={{ ...btnBase, border: `1px solid ${colors.violet.primary}`, backgroundColor: colors.violet.bg, color: colors.violet.primary }}>
            <RefreshCw size={mobile ? 14 : 12} /> Contre-proposer
          </button>
        </>
      )}
      {ex.status === 'approved' && (
        <button onClick={() => onConfirmStand(ex.id)} style={{ ...btnBase, border: 'none', backgroundColor: colors.status.accepted.text, color: '#fff' }}>
          <Check size={mobile ? 14 : 12} /> Confirmer stand
        </button>
      )}
      {ex.status === 'awaiting_payment' && (
        <>
          <span style={{ fontSize: '12px', color: colors.feedback.warning.solid, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: mobile ? 0 : 4 }}>
            <Clock size={12} /> Paiement en attente
          </span>
          <button onClick={() => onStatusChange(ex.id, 'paid')} style={{ ...btnBase, border: 'none', backgroundColor: colors.feedback.success.solid, color: '#fff' }}>
            <Check size={mobile ? 14 : 12} /> Marquer paye
          </button>
          <button onClick={() => onStatusChange(ex.id, 'approved')} style={{ ...btnBase, border: `1px solid ${colors.violet.primary}`, backgroundColor: colors.violet.bg, color: colors.violet.primary }}>
            <RefreshCw size={mobile ? 14 : 12} /> Annuler paiement
          </button>
          <button onClick={() => onStatusChange(ex.id, 'rejected')} style={{ ...btnBase, border: `1px solid ${colors.feedback.danger.border}`, backgroundColor: colors.feedback.danger.bg, color: colors.feedback.danger.text }}>
            Refuser
          </button>
        </>
      )}
      {ex.status === 'approved' && (ex as any).stripe_payment_id && (
        <span style={{ fontSize: '12px', color: colors.feedback.success.text, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Check size={12} /> Paye
        </span>
      )}
    </div>
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
