'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import { Shield, Search, Filter, RefreshCw, Download, ChevronLeft, ChevronRight, Eye, Trash2, FileDown, Lock } from 'lucide-react'
import { NexModal } from '@/components/ui/nex-modal'

type AuditLog = {
  id: string
  user_id: string
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'DECRYPT'
  resource_type: string
  resource_id: string | null
  description: string | null
  changes: Record<string, unknown> | null
  accessed_sensitive_data: boolean
  sensitive_fields: string[] | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  CREATE: { bg: '#D1FAE5', text: '#065F46' },
  READ:   { bg: '#DBEAFE', text: '#1E40AF' },
  UPDATE: { bg: '#FEF3C7', text: '#92400E' },
  DELETE: { bg: '#FEE2E2', text: '#991B1B' },
  EXPORT: { bg: '#EDE9FE', text: '#5B21B6' },
  DECRYPT:{ bg: '#FCE7F3', text: '#9D174D' },
}

const PAGE_SIZE = 50

export default function AuditLogsClient() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Filters
  const [filterAction, setFilterAction] = useState('')
  const [filterResource, setFilterResource] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const [filterSensitive, setFilterSensitive] = useState(false)

  // Selected log for detail
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async (tok: string, pg: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((pg - 1) * PAGE_SIZE),
      })
      if (filterAction) params.set('action', filterAction)
      if (filterResource) params.set('resource_type', filterResource)
      if (filterUserId) params.set('user_id', filterUserId)
      if (filterSensitive) params.set('sensitive_only', 'true')

      const res = await fetch(`/api/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur')
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [filterAction, filterResource, filterUserId, filterSensitive])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const tok = data.session?.access_token
      if (!tok) { router.push('/login'); return }
      setToken(tok)
      fetchLogs(tok, 1)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    setPage(1)
    if (token) fetchLogs(token, 1)
  }

  const handlePage = (p: number) => {
    setPage(p)
    if (token) fetchLogs(token, p)
  }

  const exportCsv = () => {
    const headers = ['id', 'user_id', 'action', 'resource_type', 'resource_id', 'description', 'accessed_sensitive_data', 'ip_address', 'created_at']
    const rows = logs.map(l => [
      l.id, l.user_id, l.action, l.resource_type, l.resource_id || '',
      (l.description || '').replace(/,/g, ';'),
      String(l.accessed_sensitive_data), l.ip_address || '', l.created_at,
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: 'calc(100vh - 58px)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} color={colors.violet.primary} />
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>Audit Logs RGPD</h1>
              <p style={{ fontSize: '14px', color: colors.text.secondary, margin: 0 }}>{total.toLocaleString('fr-FR')} entrées totales</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => token && fetchLogs(token, page)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: `1px solid ${colors.border.default}`, borderRadius: '8px', background: 'white', color: colors.text.primary, cursor: 'pointer', fontSize: '14px' }}
            >
              <RefreshCw size={14} /> Actualiser
            </button>
            <button
              onClick={exportCsv}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: colors.violet.primary, border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', padding: '16px', background: colors.bg.secondary, borderRadius: '12px' }}>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{ padding: '8px 12px', border: `1px solid ${colors.border.default}`, borderRadius: '8px', fontSize: '14px', background: 'white', color: colors.text.primary }}
          >
            <option value="">Toutes les actions</option>
            {['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'DECRYPT'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Resource type (ex: profiles)"
            value={filterResource}
            onChange={e => setFilterResource(e.target.value)}
            style={{ padding: '8px 12px', border: `1px solid ${colors.border.default}`, borderRadius: '8px', fontSize: '14px', minWidth: '200px' }}
          />

          <input
            type="text"
            placeholder="User ID (UUID)"
            value={filterUserId}
            onChange={e => setFilterUserId(e.target.value)}
            style={{ padding: '8px 12px', border: `1px solid ${colors.border.default}`, borderRadius: '8px', fontSize: '14px', minWidth: '200px' }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: colors.text.primary, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterSensitive}
              onChange={e => setFilterSensitive(e.target.checked)}
            />
            <Lock size={14} color={colors.feedback?.danger?.solid || '#E05A5A'} />
            Données sensibles uniquement
          </label>

          <button
            onClick={handleSearch}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', background: colors.violet.primary, border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            <Search size={14} /> Filtrer
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', fontSize: '14px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'white', border: `1px solid ${colors.border.default}`, borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: colors.bg.secondary }}>
                  {['Action', 'Resource', 'Description', 'User ID', 'IP', 'Sensible', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: colors.text.secondary, whiteSpace: 'nowrap', borderBottom: `1px solid ${colors.border.default}` }}>
                      {h}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border.default}` }} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border.default}` }}>
                          <div style={{ height: '16px', background: '#F3F4F6', borderRadius: '4px', width: j === 2 ? '80%' : '60%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: colors.text.secondary }}>
                      Aucun log trouvé
                    </td>
                  </tr>
                ) : logs.map(log => {
                  const ac = ACTION_COLORS[log.action] || { bg: '#F3F4F6', text: '#374151' }
                  return (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${colors.border.default}` }} onMouseEnter={e => (e.currentTarget.style.background = colors.bg.secondary)} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: ac.bg, color: ac.text }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: colors.text.primary, whiteSpace: 'nowrap' }}>
                        {log.resource_type}
                        {log.resource_id && <div style={{ fontSize: '11px', color: colors.text.secondary, fontFamily: 'monospace' }}>{log.resource_id.slice(0, 8)}…</div>}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '13px', color: colors.text.secondary, maxWidth: '280px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: colors.text.secondary, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {log.user_id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                        {log.ip_address || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {log.accessed_sensitive_data && <Lock size={14} color="#E05A5A" />}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: '12px', color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <button onClick={() => setSelected(log)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.violet.primary }}>
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${colors.border.default}` }}>
              <span style={{ fontSize: '13px', color: colors.text.secondary }}>
                Page {page}/{totalPages} · {total.toLocaleString('fr-FR')} entrées
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => handlePage(page - 1)} disabled={page === 1} style={{ padding: '6px 10px', border: `1px solid ${colors.border.default}`, borderRadius: '6px', background: page === 1 ? colors.bg.secondary : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => handlePage(page + 1)} disabled={page === totalPages} style={{ padding: '6px 10px', border: `1px solid ${colors.border.default}`, borderRadius: '6px', background: page === totalPages ? colors.bg.secondary : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <NexModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Détail du log"
        size="md"
        maxContentHeight="60vh"
      >
        {selected && (
          <>
            {([
              ['ID', selected.id],
              ['Action', selected.action],
              ['Resource', `${selected.resource_type}${selected.resource_id ? ` / ${selected.resource_id}` : ''}`],
              ['User ID', selected.user_id],
              ['Description', selected.description || '—'],
              ['IP', selected.ip_address || '—'],
              ['User Agent', selected.user_agent || '—'],
              ['Données sensibles', selected.accessed_sensitive_data ? `Oui — ${(selected.sensitive_fields || []).join(', ')}` : 'Non'],
              ['Date', new Date(selected.created_at).toLocaleString('fr-FR')],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text.secondary, textTransform: 'uppercase', marginBottom: '2px' }}>{k}</div>
                <div style={{ fontSize: '13px', color: colors.text.primary, wordBreak: 'break-all', fontFamily: k === 'ID' || k === 'User ID' ? 'monospace' : undefined }}>{v}</div>
              </div>
            ))}
            {selected.changes && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text.secondary, textTransform: 'uppercase', marginBottom: '6px' }}>Modifications</div>
                <pre style={{ fontSize: '12px', background: colors.bg.secondary, padding: '12px', borderRadius: '8px', overflow: 'auto', margin: 0 }}>
                  {JSON.stringify(selected.changes, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}
      </NexModal>
    </div>
  )
}
