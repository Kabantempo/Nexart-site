'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Bell, CheckCircle, Clock, X, MessageCircle, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  application_accepted:    { icon: <CheckCircle size={16} />, color: '#10B981', bg: '#ECFDF5' },
  application_rejected:    { icon: <X size={16} />,           color: '#E05A5A', bg: '#FEF2F2' },
  application_received:    { icon: <Calendar size={16} />,    color: '#6366F1', bg: '#EEF2FF' },
  new_message:             { icon: <MessageCircle size={16} />,color: '#06B6D4', bg: '#ECFEFF' },
  verification_accepted:   { icon: <CheckCircle size={16} />, color: '#10B981', bg: '#ECFDF5' },
  verification_refused:    { icon: <X size={16} />,           color: '#E05A5A', bg: '#FEF2F2' },
  default:                 { icon: <Bell size={16} />,         color: '#6B7280', bg: '#F3F4F6' },
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBell({ userId, dark = false }: { userId: string; dark?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [supported, setSupported] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read_at).length

  const fetchNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error?.code === '42P01') { setSupported(false); return }
      if (error) return
      setNotifications(data || [])
    } catch {
      setSupported(false)
    }
  }, [userId])

  // Initial fetch
  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Realtime subscription
  useEffect(() => {
    if (!supported) return
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supported])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!unread) return
    const ids = notifications.filter(n => !n.read_at).map(n => n.id)
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  if (!supported) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        title="Notifications"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-3px', right: '-3px',
            minWidth: '18px', height: '18px', borderRadius: '9999px',
            backgroundColor: '#E05A5A', color: '#FFFFFF',
            fontSize: '11px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid #FFFFFF',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: '340px', maxWidth: '90vw',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              zIndex: 9999,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A' }}>Notifications</span>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ fontSize: '12px', fontWeight: '600', color: '#6366F1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Bell size={32} color="#E5E7EB" style={{ marginBottom: '10px' }} />
                  <p style={{ fontSize: '14px', color: '#9CA3AF' }}>Aucune notification</p>
                </div>
              ) : (
                notifications.map(n => {
                  const tc = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default
                  const isUnread = !n.read_at
                  const inner = (
                    <div
                      key={n.id}
                      onClick={() => { if (isUnread) markRead(n.id); setOpen(false) }}
                      style={{
                        display: 'flex', gap: '12px', padding: '14px 18px',
                        borderBottom: '1px solid #F9FAFB',
                        backgroundColor: isUnread ? '#FAFBFF' : '#FFFFFF',
                        cursor: n.link ? 'pointer' : 'default',
                        transition: 'background-color 150ms',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isUnread ? '#FAFBFF' : '#FFFFFF' }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        backgroundColor: tc.bg, color: tc.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {tc.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: isUnread ? '700' : '500', color: '#1A1A1A', marginBottom: '2px', lineHeight: 1.4 }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p style={{ fontSize: '12px', color: '#6B7280', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.body}
                          </p>
                        )}
                        <p style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {relativeTime(n.created_at)}
                        </p>
                      </div>
                      {isUnread && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1', flexShrink: 0, marginTop: '6px' }} />
                      )}
                    </div>
                  )
                  return n.link ? (
                    <Link key={n.id} href={n.link} style={{ textDecoration: 'none', display: 'block' }}>
                      {inner}
                    </Link>
                  ) : inner
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div style={{ padding: '10px 18px', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
                <Link href="/notifications" onClick={() => setOpen(false)} style={{ fontSize: '13px', color: '#6366F1', fontWeight: '600', textDecoration: 'none' }}>
                  Voir toutes les notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
