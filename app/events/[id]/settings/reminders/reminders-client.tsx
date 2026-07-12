'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Exhibitor {
  id: string
  exhibitor_id: string
  response_data: Record<string, any>
  status: string
  submitted_at: string
  profiles?: { full_name: string; email: string }
}

export default function RemindersClient({ eventId }: { eventId: string }) {
  const [reminderDays, setReminderDays] = useState(7)
  const [overdue, setOverdue] = useState<Exhibitor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkOverdue()
  }, [eventId])

  const checkOverdue = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/reminders`)
      const data = await res.json()
      // Parse overdue from response (backend returns count)
      // For now, show empty since we need to fetch exhibitors too
    } catch (error) {
      console.error('Error checking overdue:', error)
    }
  }

  const handleSendReminders = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_days: reminderDays })
      })
      if (res.ok) {
        checkOverdue()
        alert('Relances envoyées avec succès!')
      }
    } catch (error) {
      console.error('Error sending reminders:', error)
      alert('Erreur lors de l\'envoi des relances')
    } finally {
      setLoading(false)
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
            Relances Automatiques
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            Configurez les relances pour les exposants qui n\'ont pas confirmé
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '32px' }}>
            {/* Settings */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                Délai avant relance
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(parseInt(e.target.value))}
                  style={{ flex: 1, height: '8px', borderRadius: '4px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#6366F1', minWidth: '100px' }}>
                  {reminderDays} jour{reminderDays > 1 ? 's' : ''}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Les exposants approuvés depuis plus de {reminderDays} jours recevront une relance
              </p>
            </div>

            {/* Info Box */}
            <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '16px', marginBottom: '32px', display: 'flex', gap: '12px' }}>
              <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ color: '#92400E', fontWeight: 500 }}>Automatisation</p>
                <p style={{ color: '#B45309', fontSize: '14px', marginTop: '4px' }}>
                  Les relances seront envoyées automatiquement chaque jour via email
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSendReminders}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Bell size={16} />
                {loading ? 'Envoi...' : 'Envoyer relances maintenant'}
              </button>
            </div>
          </div>

          {/* Waitlist Section */}
          <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Liste d\'attente
            </h2>
            <WaitlistView eventId={eventId} />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function WaitlistView({ eventId }: { eventId: string }) {
  const [waitlist, setWaitlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWaitlist()
  }, [eventId])

  
  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
const fetchWaitlist = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/waitlist`)
      const data = await res.json()
      setWaitlist(data.waitlist || [])
    } catch (error) {
      console.error('Error fetching waitlist:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p style={{ color: 'var(--text-secondary)' }}>Chargement...</p>
  }

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
      {waitlist.length === 0 ? (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Check size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>Aucun exposant en liste d\'attente</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Position</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Nom</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Notifié</th>
            </tr>
          </thead>
          <tbody>
            {waitlist.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#6366F1' }}>#{item.position}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{item.profiles?.full_name || 'N/A'}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{item.profiles?.email || 'N/A'}</td>
                <td style={{ padding: '12px 16px' }}>
                  {item.notified_at ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '14px' }}>
                      <Check size={16} /> Oui
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>En attente</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
