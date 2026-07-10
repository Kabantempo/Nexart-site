'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Download, Filter, X, Check, AlertCircle, Mail } from 'lucide-react'

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
      const res = await fetch(`/api/events/${eventId}/exhibitor-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            Gestion Exposants
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '24px' }}>
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
  const [localFields, setLocalFields] = useState(fields)

  const defaultFields = [
    { field_name: 'full_name', field_label: 'Nom Complet', field_type: 'text', required: true },
    { field_name: 'email', field_label: 'Email', field_type: 'text', required: true },
    { field_name: 'phone', field_label: 'Téléphone', field_type: 'text', required: false },
    { field_name: 'tables_needed', field_label: 'Nombre de tables', field_type: 'number', required: true },
    { field_name: 'special_requests', field_label: 'Demandes spéciales', field_type: 'textarea', required: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>
          Champs du formulaire
        </h2>

        {defaultFields.map((field, idx) => (
          <div key={idx} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500, color: '#1A1A1A' }}>{field.field_label}</p>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>
                  {field.field_type} {field.required ? '(obligatoire)' : '(optionnel)'}
                </p>
              </div>
              <Check size={20} color="#10B981" />
            </div>
          </div>
        ))}

        <button
          onClick={() => onSave(defaultFields)}
          disabled={loading}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Sauvegarde...' : 'Valider le formulaire'}
        </button>
      </div>
    </motion.div>
  )
}

// Exhibitors Dashboard Component
function ExhibitorsDashboard({ exhibitors, fields, filterStatus, onFilterChange, onStatusChange, onExport }: any) {
  const statusColors: Record<string, string> = {
    pending: '#FF6B6B',
    approved: '#10B981',
    rejected: '#9CA3AF',
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
          <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#1A1A1A' }}>{stat.value}</p>
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
                color: filterStatus === status ? '#6366F1' : '#1A1A1A',
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
            border: '1px solid #E5E7EB',
            backgroundColor: '#FFFFFF',
            color: '#1A1A1A',
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
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: '12px', fontWeight: 600 }}>Nom</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: '12px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: '12px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: '12px', fontWeight: 600 }}>Tables</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: '#9CA3AF', fontSize: '12px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exhibitors.map((exhibitor: Exhibitor) => (
              <tr key={exhibitor.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 16px', color: '#1A1A1A' }}>{exhibitor.profiles?.full_name || 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: '#888888' }}>{exhibitor.profiles?.email || 'N/A'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '4px', backgroundColor: statusColors[exhibitor.status] + '20', color: statusColors[exhibitor.status], fontSize: '12px', fontWeight: 500 }}>
                    {exhibitor.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#1A1A1A' }}>{exhibitor.tables_count}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    value={exhibitor.status}
                    onChange={(e) => onStatusChange(exhibitor.exhibitor_id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #E5E7EB',
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

      {exhibitors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 16px', color: '#9CA3AF' }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Aucun candidat pour le moment</p>
        </div>
      )}
    </motion.div>
  )
}
