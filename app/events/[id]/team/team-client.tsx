'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Trash2, Crown, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  email: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  status: 'active' | 'invited'
}

export default function TeamCollaborationClient({ eventId }: { eventId: string }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    fetchTeam()
  }, [eventId])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Supprimer ce membre de l\'équipe ?')) return
    try {
      const token = await getToken()
      await fetch(`/api/events/${eventId}/team/${memberId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      await fetchTeam()
    } catch (err) {
      console.error('Error removing member:', err)
    }
  }

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`/api/events/${eventId}/team`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Erreur chargement')
      const data = await response.json()
      setMembers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) {
      alert('Entrer un email')
      return
    }

    try {
      const token = await getToken()
      const response = await fetch(`/api/events/${eventId}/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (!response.ok) throw new Error('Erreur invitation')

      setInviteEmail('')
      setShowInvite(false)
      await fetchTeam()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>⏳ Chargement...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}
        >
          <div>
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Mon Équipe
            </h1>
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
              {members.length} membre{members.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <Plus size={16} />
            Inviter
          </button>
        </motion.div>

        {/* Team List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ display: 'grid', gap: '12px' }}
        >
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {member.email}
                  </span>
                  {member.role === 'owner' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>
                      <Crown size={14} />
                      Propriétaire
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {member.status === 'invited' ? 'Invitation en attente' : `Rejoint le ${new Date(member.joinedAt).toLocaleDateString('fr-FR')}`}
                </span>
              </div>

              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.id)}
                  style={{
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Invite Modal */}
        {showInvite && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                Inviter un membre
              </h2>

              <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setShowInvite(false)}
                  style={{
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleInvite}
                  style={{
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Mail size={16} />
                  Envoyer invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
