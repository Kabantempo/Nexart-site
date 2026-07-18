'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, Filter, X, Check, AlertCircle, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled'
  tables_count: number
  submitted_at: string
  profiles?: { full_name: string; email: string }
}

export default function ExhibitorsClient({ eventId }: { eventId: string }) {
  const [view, setView] = useState<'form-setup' | 'dashboard'>('form-setup')
  const [fields, setFields] = useState<ExhibitorField[]>([])
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [loading, setLoading] = useState(false)

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
      const status = filterStatus === 'all' ? '' : `?status=${filterStatus}`
      const res = await fetch(`/api/events/${eventId}/exhibitors${status}`)
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
      const res = await fetch(`/api/events/${eventId}/exhibitors/${exhibitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        fetchExhibitors()
      }
    } catch (error) {
      console.error('Error updating status:', error)
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
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Gestion Exposants
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {view === 'form-setup' ? 'Personnalisez votre formulaire de candidature' : 'Gérez vos candidatures et approuvez les exposants'}
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }}>
        {view === 'form-setup' ? (
          <FormSetup fields={fields} onSave={handleSaveFields} loading={loading} />
        ) : (
          <ExhibitorsDashboard
            exhibitors={exhibitors}
            fields={fields}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            onStatusChange={handleStatusChange}
            onExport={handleExportCSV}
          />
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
              backgroundColor: showAddForm ? 'var(--bg-secondary)' : '#6366F1',
              color: showAddForm ? 'var(--text-primary)' : '#FFFFFF',
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
            style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4338CA', marginBottom: '6px' }}>
                  Nom du champ
                </label>
                <input
                  type="text"
                  value={newField.field_label}
                  onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                  placeholder="Ex: SIRET, Site web..."
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #C7D2FE', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#4338CA', marginBottom: '6px' }}>
                  Type
                </label>
                <select
                  value={newField.field_type}
                  onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #C7D2FE', borderRadius: '6px', fontSize: '14px' }}
                >
                  {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#4338CA' }}>Obligatoire</label>
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
              <button
                onClick={addField}
                style={{ padding: '8px 16px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
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
                  backgroundColor: field.required ? '#6366F1' : '#D1D5DB',
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
                  {field.required ? <Check size={16} color="#6366F1" /> : <AlertCircle size={16} color="#9CA3AF" />}
                </button>
                <button
                  onClick={() => removeField(idx)}
                  title="Supprimer ce champ"
                  style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: '#FF6B6B', padding: '4px' }}
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
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
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

// Exhibitors Dashboard Component
function ExhibitorsDashboard({ exhibitors, fields, filterStatus, onFilterChange, onStatusChange, onExport }: any) {
  const statusColors: Record<string, string> = {
    pending: '#FF6B6B',
    approved: '#10B981',
    rejected: 'var(--text-tertiary)',
    paid: '#6366F1',
    cancelled: '#F59E0B'
  }

  const stats = {
    total: exhibitors.length,
    pending: exhibitors.filter((e: Exhibitor) => e.status === 'pending').length,
    approved: exhibitors.filter((e: Exhibitor) => e.status === 'approved').length,
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {[
          { label: 'Candidatures', value: stats.total },
          { label: 'En attente', value: stats.pending },
          { label: 'Approuvés', value: stats.approved }
        ].map((stat, i) => (
          <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => onFilterChange(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: filterStatus === status ? '2px solid #6366F1' : '1px solid #E5E7EB',
                backgroundColor: filterStatus === status ? '#EEF2FF' : '#FFFFFF',
                color: filterStatus === status ? '#6366F1' : 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {status === 'all' ? 'Tous' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={onExport}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500
          }}
        >
          <Download size={16} /> Exporter CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Nom</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Tables</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exhibitors.map((exhibitor: Exhibitor) => (
              <tr key={exhibitor.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{exhibitor.profiles?.full_name || 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{exhibitor.profiles?.email || 'N/A'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '4px', backgroundColor: statusColors[exhibitor.status] + '20', color: statusColors[exhibitor.status], fontSize: '12px', fontWeight: 500 }}>
                    {exhibitor.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{exhibitor.tables_count}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={exhibitor.status}
                    onChange={(e) => onStatusChange(exhibitor.exhibitor_id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <option value="pending">En attente</option>
                    <option value="approved">Approuvé</option>
                    <option value="rejected">Rejeté</option>
                    <option value="paid">Payé</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {exhibitors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 16px', color: 'var(--text-secondary)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Aucun candidat pour le moment</p>
        </div>
      )}
    </motion.div>
  )
}
