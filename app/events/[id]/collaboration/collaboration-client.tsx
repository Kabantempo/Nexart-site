'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, MessageCircle, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Task {
  id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'completed'
  assignee_id: string
  deadline: string
  creator_id: string
  created_at: string
  profiles?: { full_name: string; email: string }
}

interface Comment {
  id: string
  content: string
  sender_id: string
  created_at: string
  profiles?: { full_name: string }
}

export default function CollaborationClient({ eventId }: { eventId: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee_id: '', deadline: '' })
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTasks()
    fetchTeamMembers()
  }, [eventId])

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const fetchTasks = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/team`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      setTeamMembers(data.members || [])
    } catch (error) {
      console.error('Error fetching team:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert('Veuillez entrer un titre')
      return
    }

    try {
      setLoading(true)
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(newTask)
      })

      if (res.ok) {
        setNewTask({ title: '', description: '', assignee_id: '', deadline: '' })
        fetchTasks()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus })
      })

      if (res.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <AlertCircle size={16} color="#9CA3AF" />
      case 'in_progress':
        return <Clock size={16} color="#6366F1" />
      case 'completed':
        return <CheckCircle2 size={16} color="#10B981" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'not_started': 'Non démarrée',
      'in_progress': 'En cours',
      'completed': 'Complétée'
    }
    return labels[status] || status
  }

  const filteredTasks = statusFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === statusFilter)

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
            Espace Collaboration
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
            Coordonnez votre équipe, assignez des tâches et suivez la progression
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '32px' }}>
            {/* Left: Task List */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>
                Tâches ({filteredTasks.length})
              </h2>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {(['all', 'not_started', 'in_progress', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    style={{
                      padding: '8px 12px',
                      border: statusFilter === status ? 'none' : '1px solid #E5E7EB',
                      borderRadius: '6px',
                      backgroundColor: statusFilter === status ? '#6366F1' : 'var(--bg-secondary)',
                      color: statusFilter === status ? '#FFFFFF' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500
                    }}
                  >
                    {status === 'all' ? 'Toutes' : getStatusLabel(status)}
                  </button>
                ))}
              </div>

              {/* Task List */}
              <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
                {filteredTasks.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <p>Aucune tâche pour le moment</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      style={{
                        border: selectedTask?.id === task.id ? '2px solid #6366F1' : '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px',
                        cursor: 'pointer',
                        backgroundColor: selectedTask?.id === task.id ? '#F3F4F6' : '#FFFFFF',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                        {getStatusIcon(task.status)}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
                            {task.title}
                          </h3>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, marginBottom: '8px' }}>
                            {task.profiles?.full_name || 'Non assigné'}
                          </p>
                          {task.deadline && (
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Deadline: {new Date(task.deadline).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Create Task Form */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  Nouvelle tâche
                </h3>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Ex: Contacter les exposants"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Détails..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '80px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Assigner à
                  </label>
                  <select
                    value={newTask.assignee_id}
                    onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Sélectionner un membre</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.profiles?.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateTask}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={16} />
                  {loading ? 'Création...' : 'Créer tâche'}
                </button>
              </div>
            </div>

            {/* Right: Task Details */}
            <div>
              {selectedTask ? (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px' }}>
                    Détails de la tâche
                  </h2>

                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                      {selectedTask.title}
                    </h3>

                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                      {selectedTask.description}
                    </p>

                    <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Statut</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(['not_started', 'in_progress', 'completed'] as const).map(status => (
                            <button
                              key={status}
                              onClick={() => handleUpdateStatus(selectedTask.id, status)}
                              style={{
                                padding: '6px 12px',
                                border: selectedTask.status === status ? 'none' : '1px solid #E5E7EB',
                                borderRadius: '4px',
                                backgroundColor: selectedTask.status === status ? '#6366F1' : 'var(--bg-secondary)',
                                color: selectedTask.status === status ? '#FFFFFF' : 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 500
                              }}
                            >
                              {getStatusLabel(status)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Assigné à</p>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                          {selectedTask.profiles?.full_name || 'Non assigné'}
                        </p>
                      </div>

                      {selectedTask.deadline && (
                        <div>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Deadline</p>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>
                            {new Date(selectedTask.deadline).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments - Coming in v1.0.1 */}
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <MessageCircle size={18} />
                    Commentaires
                  </h3>

                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', backgroundColor: '#EEF2FF' }}>
                    <p style={{ fontSize: '14px', color: '#6366F1', fontWeight: 500, textAlign: 'center', margin: '0' }}>
                      💬 Système de commentaires disponible en v1.0.1
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Sélectionnez une tâche pour voir les détails</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
