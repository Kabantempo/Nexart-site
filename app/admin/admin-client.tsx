'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Users, FileText, BarChart3, Menu, X, Search, CheckCircle, XCircle, Shield, TrendingUp, Calendar, MessageSquare, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string
  type: string
  status: 'open' | 'resolved' | 'dismissed'
  reason: string
  description: string
  reporter_id: string
  target_id: string
  target_type: string
  created_at: string
  resolution_notes?: string
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  is_admin: boolean
  is_banned?: boolean
  banned?: boolean
  created_at: string
}

interface Event {
  id: string
  title: string
  status: 'draft' | 'published' | 'closed'
  organizer_id: string
  start_date: string
  end_date: string
  stand_count: number
  created_at: string
}

interface Stats {
  total_users: number
  total_events: number
  total_reports: number
  approval_rate: number
  open_reports?: number
  published_events?: number
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'events' | 'stats'>('stats')
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === 'reports') {
        const res = await authedFetch('/api/admin/reports')
        const data = await res.json()
        setReports(data.reports || data.data || [])
      } else if (activeTab === 'users') {
        const res = await authedFetch('/api/admin/users')
        const data = await res.json()
        setUsers(data.data || data.users || [])
      } else if (activeTab === 'events') {
        const res = await authedFetch('/api/admin/events')
        const data = await res.json()
        setEvents(data.data || data.events || [])
      } else if (activeTab === 'stats') {
        const res = await authedFetch('/api/admin/stats')
        const data = await res.json()
        setStats(data.stats || data)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchData() }, [fetchData])

  const tabs = [
    { id: 'stats' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'reports' as const, label: 'Signalements', icon: AlertCircle },
    { id: 'users' as const, label: 'Utilisateurs', icon: Users },
    { id: 'events' as const, label: 'Événements', icon: FileText },
  ]

  return (
    <div style={{ display: 'flex', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '0',
        minWidth: sidebarOpen ? '260px' : '0',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column',
        padding: sidebarOpen ? '24px 0' : '0',
      }}>
        {sidebarOpen && (
          <>
            <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1F2937' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <Shield size={20} color="#6366F1" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Admin Panel</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Nexart — Tableau de bord</p>
            </div>
            <nav style={{ padding: '16px 12px', flex: 1 }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    marginBottom: '4px',
                    backgroundColor: activeTab === tab.id ? '#6366F1' : 'transparent',
                    color: activeTab === tab.id ? '#FFFFFF' : '#9CA3AF',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <button onClick={fetchData} style={{ marginLeft: 'auto', padding: '8px 16px', backgroundColor: '#6366F1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            Rafraîchir
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, padding: '32px 24px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: '#6B7280' }}>
              Chargement...
            </div>
          ) : activeTab === 'stats' ? (
            <StatsTab stats={stats} />
          ) : activeTab === 'reports' ? (
            <ReportsTab reports={reports} onRefresh={fetchData} />
          ) : activeTab === 'users' ? (
            <UsersTab users={users} onRefresh={fetchData} />
          ) : (
            <EventsTab events={events} onRefresh={fetchData} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: Stats | null }) {
  if (!stats) return (
    <div style={{ color: '#6B7280', textAlign: 'center', padding: '60px' }}>
      Aucune donnée disponible
    </div>
  )

  const kpis = [
    { label: 'Utilisateurs', value: stats.total_users ?? 0, icon: Users, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Événements publiés', value: stats.published_events ?? stats.total_events ?? 0, icon: Calendar, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Signalements ouverts', value: stats.open_reports ?? 0, icon: AlertCircle, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Total signalements', value: stats.total_reports ?? 0, icon: MessageSquare, color: '#EF4444', bg: '#FEF2F2' },
    { label: "Taux d'approbation", value: `${stats.approval_rate ?? 0}%`, icon: TrendingUp, color: '#8B5CF6', bg: '#F5F3FF' },
  ]

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Dashboard KPI</h2>
      <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '32px' }}>Vue d'ensemble de la plateforme</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {kpis.map(kpi => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
              <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{kpi.label}</span>
            </div>
            <p style={{ fontSize: '36px', fontWeight: 700, color: kpi.color, margin: 0 }}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Résumé rapide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Total événements (toutes catégories)', value: stats.total_events ?? 0 },
            { label: 'Total utilisateurs inscrits', value: stats.total_users ?? 0 },
            { label: 'Signalements en attente', value: stats.open_reports ?? 0 },
            { label: 'Signalements traités', value: (stats.total_reports ?? 0) - (stats.open_reports ?? 0) },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab({ reports, onRefresh }: { reports: Report[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'dismissed'>('open')
  const [selected, setSelected] = useState<Report | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const handleAction = async (reportId: string, status: string) => {
    setBusy(reportId)
    try {
      await authedFetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolution_notes: note }),
      })
      setSelected(null)
      setNote('')
      onRefresh()
    } catch (e) {
      console.error('Error updating report:', e)
    } finally {
      setBusy(null)
    }
  }

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    open: { bg: '#FEF2F2', color: '#EF4444', label: '⏳ Ouvert' },
    resolved: { bg: '#ECFDF5', color: '#10B981', label: '✅ Résolu' },
    dismissed: { bg: '#F3F4F6', color: '#9CA3AF', label: '— Ignoré' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Signalements</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            {reports.filter(r => r.status === 'open').length} en attente · {reports.length} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'open', 'resolved', 'dismissed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px',
              backgroundColor: filter === f ? '#6366F1' : '#F3F4F6',
              color: filter === f ? '#FFFFFF' : '#6B7280',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            }}>
              {f === 'all' ? 'Tous' : f === 'open' ? 'Ouverts' : f === 'resolved' ? 'Résolus' : 'Ignorés'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          Aucun signalement dans cette catégorie
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {filtered.map(report => {
            const s = statusColors[report.status] || statusColors.open
            return (
              <div key={report.id} style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderLeft: `4px solid ${s.color}`,
                borderRadius: '10px',
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{report.type}</span>
                      <span style={{ fontSize: '11px', padding: '2px 8px', backgroundColor: s.bg, color: s.color, borderRadius: '4px', fontWeight: 500 }}>
                        {s.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>{report.reason || report.description}</p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{new Date(report.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setSelected(selected?.id === report.id ? null : report)} style={{ padding: '6px 10px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> Détail
                    </button>
                    {report.status === 'open' && (
                      <>
                        <button onClick={() => handleAction(report.id, 'resolved')} disabled={busy === report.id} style={{ padding: '6px 12px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, opacity: busy === report.id ? 0.6 : 1 }}>
                          Résoudre
                        </button>
                        <button onClick={() => handleAction(report.id, 'dismissed')} disabled={busy === report.id} style={{ padding: '6px 12px', backgroundColor: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, opacity: busy === report.id ? 0.6 : 1 }}>
                          Ignorer
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {selected?.id === report.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                          <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 2px 0' }}>Type ciblé</p>
                            <p style={{ fontSize: '13px', color: '#111827', margin: 0, fontWeight: 500 }}>{report.target_type || '—'}</p>
                          </div>
                          <div style={{ padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                            <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '0 0 2px 0' }}>ID cible</p>
                            <p style={{ fontSize: '11px', color: '#111827', margin: 0, fontFamily: 'monospace' }}>{report.target_id || '—'}</p>
                          </div>
                        </div>
                        {report.description && (
                          <p style={{ fontSize: '13px', color: '#374151', backgroundColor: '#F9FAFB', padding: '10px', borderRadius: '6px', margin: '0 0 12px 0' }}>
                            {report.description}
                          </p>
                        )}
                        {report.status === 'open' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              value={note}
                              onChange={e => setNote(e.target.value)}
                              placeholder="Note de résolution (optionnel)..."
                              style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
                            />
                          </div>
                        )}
                        {report.resolution_notes && (
                          <p style={{ fontSize: '12px', color: '#6B7280', margin: '8px 0 0 0', fontStyle: 'italic' }}>Note : {report.resolution_notes}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleBan = async (userId: string, currentlyBanned: boolean) => {
    setBusy(userId)
    try {
      await authedFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, action: currentlyBanned ? 'unban' : 'ban' }),
      })
      onRefresh()
    } catch (e) {
      console.error('Error ban/unban:', e)
    } finally {
      setBusy(null)
    }
  }

  const isBanned = (u: User) => u.banned || u.is_banned || false

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Utilisateurs</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{users.length} comptes</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher nom / email…"
            style={{ paddingLeft: '32px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', outline: 'none', width: '240px' }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          {search ? 'Aucun résultat' : 'Aucun utilisateur'}
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nom', 'Email', 'Rôle', 'Inscrit le', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const banned = isBanned(user)
                return (
                  <tr key={user.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#6366F1' }}>{(user.full_name || '?')[0].toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{user.full_name || '—'}</span>
                        {user.is_admin && <span style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#FEF3C7', color: '#D97706', borderRadius: '4px', fontWeight: 600 }}>ADMIN</span>}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6B7280' }}>{user.email || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: '#EEF2FF', color: '#6366F1', borderRadius: '4px', fontWeight: 500 }}>{user.role || 'user'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#9CA3AF' }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '12px', padding: '3px 8px', backgroundColor: banned ? '#FEF2F2' : '#ECFDF5', color: banned ? '#EF4444' : '#10B981', borderRadius: '4px', fontWeight: 500 }}>
                        {banned ? '🚫 Banni' : '✓ Actif'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleBan(user.id, banned)}
                        disabled={busy === user.id || user.is_admin}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: banned ? '#10B981' : '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: busy === user.id || user.is_admin ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          opacity: busy === user.id || user.is_admin ? 0.5 : 1,
                        }}
                      >
                        {busy === user.id ? '…' : banned ? 'Débannir' : 'Bannir'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Events Tab ───────────────────────────────────────────────────────────────

function EventsTab({ events, onRefresh }: { events: Event[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'closed'>('draft')
  const [busy, setBusy] = useState<string | null>(null)

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter)

  const handleAction = async (eventId: string, action: 'approve' | 'reject') => {
    setBusy(eventId)
    try {
      await authedFetch('/api/admin/events', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, action }),
      })
      onRefresh()
    } catch (e) {
      console.error('Error event action:', e)
    } finally {
      setBusy(null)
    }
  }

  const statusInfo: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: '#FEF3C7', color: '#D97706', label: '⏳ Brouillon' },
    published: { bg: '#ECFDF5', color: '#10B981', label: '✓ Publié' },
    closed: { bg: '#F3F4F6', color: '#9CA3AF', label: '— Fermé' },
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>Événements</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
            {events.filter(e => e.status === 'draft').length} en attente · {events.length} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'draft', 'published', 'closed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 12px',
              backgroundColor: filter === f ? '#6366F1' : '#F3F4F6',
              color: filter === f ? '#FFFFFF' : '#6B7280',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 500,
            }}>
              {f === 'all' ? 'Tous' : f === 'draft' ? 'En attente' : f === 'published' ? 'Publiés' : 'Fermés'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: '12px' }}>
          Aucun événement dans cette catégorie
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {filtered.map(event => {
            const s = statusInfo[event.status] || statusInfo.draft
            return (
              <div key={event.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</h3>
                      <span style={{ flexShrink: 0, fontSize: '11px', padding: '2px 8px', backgroundColor: s.bg, color: s.color, borderRadius: '4px', fontWeight: 500 }}>{s.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        {event.start_date ? new Date(event.start_date).toLocaleDateString('fr-FR') : '—'}
                        {event.end_date ? ` → ${new Date(event.end_date).toLocaleDateString('fr-FR')}` : ''}
                      </span>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{event.stand_count} stands</span>
                      <span style={{ fontSize: '11px', color: '#D1D5DB', fontFamily: 'monospace' }}>{event.id.slice(0, 8)}…</span>
                    </div>
                  </div>
                  {event.status === 'draft' && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleAction(event.id, 'approve')}
                        disabled={busy === event.id}
                        style={{ padding: '8px 16px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', opacity: busy === event.id ? 0.6 : 1 }}
                      >
                        <CheckCircle size={14} /> Approuver
                      </button>
                      <button
                        onClick={() => handleAction(event.id, 'reject')}
                        disabled={busy === event.id}
                        style={{ padding: '8px 16px', backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', opacity: busy === event.id ? 0.6 : 1 }}
                      >
                        <XCircle size={14} /> Rejeter
                      </button>
                    </div>
                  )}
                  {event.status === 'published' && (
                    <button
                      onClick={() => handleAction(event.id, 'reject')}
                      disabled={busy === event.id}
                      style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, opacity: busy === event.id ? 0.6 : 1 }}
                    >
                      Fermer
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
