'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, CheckCircle, X, MessageCircle, Calendar, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  application_accepted: { icon: <CheckCircle size={18} />, color: '#10B981', bg: '#ECFDF5' },
  application_rejected: { icon: <X size={18} />,           color: '#E05A5A', bg: '#FEF2F2' },
  application_received: { icon: <Calendar size={18} />,    color: '#6366F1', bg: '#EEF2FF' },
  new_message:          { icon: <MessageCircle size={18} />,color: '#06B6D4', bg: '#ECFEFF' },
  default:              { icon: <Bell size={18} />,         color: '#6B7280', bg: '#F3F4F6' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      fetchNotifications(session.user.id)
    })
  }, [router, fetchNotifications])

  const markAllRead = async () => {
    if (!userId) return
    const ids = notifications.filter(n => !n.read_at).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const unread = notifications.filter(n => !n.read_at).length

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 80px)' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '20px' }}>
            <ArrowLeft size={16} /> Tableau de bord
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Notifications</h1>
              {unread > 0 && (
                <p style={{ fontSize: '14px', color: '#6366F1', fontWeight: '600', margin: '4px 0 0' }}>
                  {unread} non lue{unread > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#6366F1', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Tout marquer lu
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', borderRadius: '16px', border: '1px solid #E5E7EB', backgroundColor: '#F9F9FB' }}>
            <Bell size={48} color="#E5E7EB" style={{ marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', color: '#6B7280' }}>Aucune notification pour le moment</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map((n, i) => {
              const tc = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default
              const isUnread = !n.read_at
              const inner = (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => { if (isUnread) markRead(n.id) }}
                  style={{
                    display: 'flex', gap: '14px', padding: '16px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${isUnread ? '#E0E0FA' : '#E5E7EB'}`,
                    backgroundColor: isUnread ? '#FAFBFF' : '#FFFFFF',
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5FF' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = isUnread ? '#FAFBFF' : '#FFFFFF' }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    backgroundColor: tc.bg, color: tc.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {tc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: isUnread ? '700' : '500', color: '#1A1A1A', marginBottom: '3px', lineHeight: 1.4 }}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '5px', lineHeight: 1.4 }}>
                        {n.body}
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: '#6B7280' }}>{relativeTime(n.created_at)}</p>
                  </div>
                  {isUnread && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1', flexShrink: 0, marginTop: '8px' }} />
                  )}
                </motion.div>
              )

              return n.link ? (
                <Link key={n.id} href={n.link} style={{ textDecoration: 'none' }}>
                  {inner}
                </Link>
              ) : <div key={n.id}>{inner}</div>
            })}
          </div>
        )}
      </div>
    </div>
  )
}
