'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Trash2, Plus, AlertCircle } from 'lucide-react'

interface ChecklistItem {
  title: string
  description: string
  completed?: boolean
  category?: string
}

interface Checklist {
  id: string
  checklist_type: 'salon' | 'popup' | 'other'
  items: ChecklistItem[]
  created_at: string
  updated_at: string
}

export default function ChecklistClient({ eventId }: { eventId: string }) {
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [checklistType, setChecklistType] = useState<'salon' | 'popup' | 'other'>('salon')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ChecklistItem[]>([])

  useEffect(() => {
    fetchChecklist()
  }, [eventId])

  const fetchChecklist = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/checklists`)
      const data = await res.json()
      if (data.checklist) {
        setChecklist(data.checklist)
        setItems(data.checklist.items || [])
        setChecklistType(data.checklist.checklist_type)
      }
    } catch (error) {
      console.error('Error fetching checklist:', error)
    }
  }

  const handleInitializeChecklist = async (type: 'salon' | 'popup' | 'other') => {
    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_type: type })
      })

      if (res.ok) {
        setChecklistType(type)
        fetchChecklist()
      }
    } catch (error) {
      console.error('Error initializing checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateItems = async (updatedItems: ChecklistItem[]) => {
    try {
      const res = await fetch(`/api/events/${eventId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      })

      if (res.ok) {
        setItems(updatedItems)
        fetchChecklist()
      }
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  const toggleItem = (index: number) => {
    const updated = [...items]
    updated[index] = { ...updated[index], completed: !updated[index].completed }
    handleUpdateItems(updated)
  }

  const deleteItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    handleUpdateItems(updated)
  }

  const addCustomItem = () => {
    const newItem: ChecklistItem = {
      title: 'Nouvelle tâche',
      description: '',
      completed: false,
      category: 'custom'
    }
    const updated = [...items, newItem]
    handleUpdateItems(updated)
  }

  const completionRate = items.length > 0
    ? Math.round((items.filter(i => i.completed).length / items.length) * 100)
    : 0

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
            Checklist Événement
          </h1>
          <p style={{ fontSize: '18px', color: '#888888' }}>
            Suivez toutes les tâches essentielles avant votre événement
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
          {!checklist ? (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '40px 32px', textAlign: 'center' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#6366F1', opacity: 0.7 }} />
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1A1A1A', marginBottom: '12px' }}>
                Créer une checklist
              </h2>
              <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px' }}>
                Choisissez un type d'événement pour initialiser une checklist adaptée
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', maxWidth: '600px', margin: '0 auto' }}>
                {[
                  { type: 'salon' as const, label: 'Salon/Marché', description: 'Événement type marché/salon' },
                  { type: 'popup' as const, label: 'Pop-up Store', description: 'Événement pop-up' },
                  { type: 'other' as const, label: 'Autre', description: 'Type personnalisé' }
                ].map(({ type, label, description }) => (
                  <button
                    key={type}
                    onClick={() => handleInitializeChecklist(type)}
                    disabled={loading}
                    style={{
                      padding: '20px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      backgroundColor: '#F9FAFB',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: '0 0 8px 0' }}>
                      {label}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      {description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Progress */}
              <div style={{ marginBottom: '40px', padding: '24px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
                    Progression
                  </h2>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: '#6366F1' }}>
                    {completionRate}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: '#6366F1',
                      width: `${completionRate}%`,
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px' }}>
                  {items.filter(i => i.completed).length} sur {items.length} tâches complétées
                </p>
              </div>

              {/* Checklist Items */}
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
                  Tâches ({items.length})
                </h2>

                {/* Group by category */}
                {['admin', 'logistique', 'comms', 'custom'].map(category => {
                  const categoryItems = items.filter(i => (i.category || 'custom') === category)
                  if (categoryItems.length === 0) return null

                  const categoryLabels: Record<string, string> = {
                    'admin': '👨‍💼 Administration',
                    'logistique': '📦 Logistique',
                    'comms': '📢 Communications',
                    'custom': '✨ Personnalisé'
                  }

                  return (
                    <div key={category} style={{ marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '12px' }}>
                        {categoryLabels[category]}
                      </h3>

                      <div style={{ display: 'grid', gap: '8px' }}>
                        {categoryItems.map((item, idx) => {
                          const globalIdx = items.indexOf(item)
                          return (
                            <div
                              key={globalIdx}
                              style={{
                                border: '1px solid #E5E7EB',
                                borderRadius: '6px',
                                padding: '12px 16px',
                                backgroundColor: item.completed ? '#F0FDF4' : '#FFFFFF',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'start'
                              }}
                            >
                              <button
                                onClick={() => toggleItem(globalIdx)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginTop: '2px',
                                  flexShrink: 0
                                }}
                              >
                                {item.completed ? (
                                  <CheckCircle2 size={20} color="#10B981" />
                                ) : (
                                  <Circle size={20} color="#E5E7EB" />
                                )}
                              </button>

                              <div style={{ flex: 1 }}>
                                <p style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: item.completed ? '#9CA3AF' : '#1A1A1A',
                                  margin: '0 0 4px 0',
                                  textDecoration: item.completed ? 'line-through' : 'none'
                                }}>
                                  {item.title}
                                </p>
                                {item.description && (
                                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => deleteItem(globalIdx)}
                                style={{
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: '#FF6B6B',
                                  display: 'flex',
                                  flexShrink: 0
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Add Custom Item */}
                <button
                  onClick={addCustomItem}
                  style={{
                    padding: '12px 16px',
                    border: '1px dashed #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: '#F9FAFB',
                    color: '#6366F1',
                    cursor: 'pointer',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                >
                  <Plus size={16} />
                  Ajouter une tâche personnalisée
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
