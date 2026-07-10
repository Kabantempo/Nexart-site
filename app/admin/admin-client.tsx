'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Users, FileText, BarChart3, Menu, X } from 'lucide-react'

interface Report {
  id: string
  type: string
  status: 'open' | 'resolved'
  reason: string
  created_at: string
}

interface User {
  id: string
  full_name: string
  email: string
  is_banned: boolean
}

interface Event {
  id: string
  title: string
  status: 'draft' | 'published' | 'pending'
  organizer_id: string
}

interface Stats {
  total_users: number
  total_events: number
  total_reports: number
  approval_rate: number
}

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'events' | 'stats'>('reports')
  const [reports, setReports] = useState<Report[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'reports') {
        const res = await fetch('/api/admin/reports')
        const data = await res.json()
        setReports(data.reports || [])
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users')
        const data = await res.json()
        setUsers(data.users || [])
      } else if (activeTab === 'events') {
        const res = await fetch('/api/admin/events')
        const data = await res.json()
        setEvents(data.events || [])
      } else if (activeTab === 'stats') {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'reports' as const, label: 'Reports', icon: AlertCircle },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'events' as const, label: 'Events', icon: FileText },
    { id: 'stats' as const, label: 'Stats', icon: BarChart3 }
  ]

  return (
    <div style={{ display: 'flex', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '0',
        backgroundColor: '#1A1A1A',
        color: '#FFFFFF',
        padding: sidebarOpen ? '24px 16px' : '0',
        borderRight: '1px solid #E5E7EB',
        overflow: 'hidden',
        transition: 'width 0.3s',
        minHeight: '100vh'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>
            Admin
          </h1>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
            Nexart v1.0.0
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                backgroundColor: activeTab === tab.id ? '#6366F1' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#9CA3AF',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex'
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          <div style={{ width: '40px' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                <p>Chargement...</p>
              </div>
            ) : activeTab === 'reports' ? (
              <ReportsTab reports={reports} onRefresh={fetchData} />
            ) : activeTab === 'users' ? (
              <UsersTab users={users} onRefresh={fetchData} />
            ) : activeTab === 'events' ? (
              <EventsTab events={events} onRefresh={fetchData} />
            ) : (
              <StatsTab stats={stats} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ── Reports Tab ──
function ReportsTab({ reports, onRefresh }: { reports: Report[]; onRefresh: () => void }) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
        Reports ({reports.length})
      </h3>

      {reports.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <p>Aucun report</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {reports.map(report => (
            <div key={report.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', backgroundColor: report.status === 'open' ? '#FEF2F2' : '#F0FDF4' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px 0' }}>
                    {report.type}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                    {new Date(report.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: report.status === 'open' ? '#FF6B6B' : '#10B981',
                  color: '#FFFFFF',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  {report.status === 'open' ? 'Ouvert' : 'Résolu'}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#888888', margin: '0 0 12px 0' }}>
                {report.reason}
              </p>
              {report.status === 'open' && (
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Marquer résolu
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Users Tab ──
function UsersTab({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
        Users ({users.length})
      </h3>

      {users.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <p>Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {users.map(user => (
            <div key={user.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px 0' }}>
                  {user.full_name}
                </p>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                  {user.email}
                </p>
              </div>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: user.is_banned ? '#10B981' : '#FF6B6B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {user.is_banned ? 'Débannir' : 'Bannir'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Events Tab ──
function EventsTab({ events, onRefresh }: { events: Event[]; onRefresh: () => void }) {
  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
        Events ({events.length})
      </h3>

      {events.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
          <p>Aucun événement en attente de modération</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {events.map(event => (
            <div key={event.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 8px 0' }}>
                {event.title}
              </h4>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>
                Status: <span style={{ fontWeight: 600 }}>{event.status}</span>
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Approuver
                </button>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#FF6B6B',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stats Tab ──
function StatsTab({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return <div style={{ color: '#9CA3AF' }}>Chargement des stats...</div>
  }

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>
        KPI Dashboard
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <KPICard label="Total Users" value={stats.total_users.toString()} />
        <KPICard label="Total Events" value={stats.total_events.toString()} />
        <KPICard label="Total Reports" value={stats.total_reports.toString()} />
        <KPICard label="Approval Rate" value={`${stats.approval_rate}%`} />
      </div>
    </div>
  )
}

function KPICard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', backgroundColor: '#F9FAFB' }}>
      <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500, margin: '0 0 12px 0' }}>
        {label}
      </p>
      <p style={{ fontSize: '32px', fontWeight: 700, color: '#6366F1', margin: 0 }}>
        {value}
      </p>
    </div>
  )
}
