'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, HelpCircle } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  keywords: string[]
}

export default function FAQsClient({ eventId }: { eventId: string }) {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', keywords: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFAQs()
  }, [eventId])

  const fetchFAQs = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/faqs`)
      const data = await res.json()
      setFaqs(data.faqs || [])
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    }
  }

  const handleAddFAQ = async () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      alert('Veuillez remplir la question et la réponse')
      return
    }

    try {
      setLoading(true)
      const res = await fetch(`/api/events/${eventId}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newFaq.question,
          answer: newFaq.answer,
          keywords: newFaq.keywords.split(',').map(k => k.trim()).filter(Boolean)
        })
      })

      if (res.ok) {
        setNewFaq({ question: '', answer: '', keywords: '' })
        fetchFAQs()
      }
    } catch (error) {
      console.error('Error adding FAQ:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFAQ = async (faqId: string) => {
    if (!confirm('Êtes-vous sûr?')) return

    try {
      // Implement delete API if needed
      setFaqs(faqs.filter(f => f.id !== faqId))
    } catch (error) {
      console.error('Error deleting FAQ:', error)
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
            FAQ & Auto-répondeur
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280' }}>
            Répondez automatiquement aux questions fréquentes des candidats
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
          {/* Info Box */}
          <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '6px', padding: '16px', marginBottom: '32px', display: 'flex', gap: '12px' }}>
            <HelpCircle size={20} color="#6366F1" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ color: '#4338CA', fontWeight: 500 }}>Auto-répondeur intelligent</p>
              <p style={{ color: '#6366F1', fontSize: '14px', marginTop: '4px' }}>
                Les questions des candidats contenant ces mots-clés recevront automatiquement la réponse configurée
              </p>
            </div>
          </div>

          {/* Add FAQ Form */}
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '32px', marginBottom: '40px', backgroundColor: '#F9FAFB' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '24px' }}>
              Ajouter une FAQ
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1A1A', marginBottom: '8px' }}>
                Question
              </label>
              <input
                type="text"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="Ex: Avez-vous encore de la place?"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1A1A', marginBottom: '8px' }}>
                Réponse
              </label>
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Ex: Oui, nous avons encore des places disponibles. Inscrivez-vous maintenant!"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1A1A1A', marginBottom: '8px' }}>
                Mots-clés (séparés par des virgules)
              </label>
              <input
                type="text"
                value={newFaq.keywords}
                onChange={(e) => setNewFaq({ ...newFaq, keywords: e.target.value })}
                placeholder="Ex: place, disponible, inscription"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px' }}>
                L\'IA détectera ces mots-clés dans les messages entrants
              </p>
            </div>

            <button
              onClick={handleAddFAQ}
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
              <Plus size={16} />
              {loading ? 'Ajout...' : 'Ajouter FAQ'}
            </button>
          </div>

          {/* FAQs List */}
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
              FAQs existantes ({faqs.length})
            </h2>

            {faqs.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '8px' }}>
                <HelpCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Aucune FAQ pour le moment</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {faqs.map((faq) => (
                  <div key={faq.id} style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
                        {faq.question}
                      </h3>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#FF6B6B',
                          padding: '4px'
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px', lineHeight: '1.6' }}>
                      {faq.answer}
                    </p>

                    {faq.keywords && faq.keywords.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {faq.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              backgroundColor: '#F3F4F6',
                              color: '#6B7280',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
