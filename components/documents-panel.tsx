'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Download, Send, RefreshCw, CheckCircle, Clock } from 'lucide-react'

interface EventDocument {
  id: string
  event_id: string
  creator_id: string
  type: 'contrat' | 'reglement' | 'convocation' | 'facture'
  pdf_url: string
  file_name: string
  sent_at: string | null
  downloaded_at: string | null
  created_at: string
  creator?: { full_name: string; email: string; avatar_url: string | null }
  event?: { title: string; start_date: string; city: string }
}

interface DocumentsPanelProps {
  eventId: string
  role: 'organizer' | 'creator'
  creatorId?: string
}

const TYPE_LABELS: Record<string, string> = {
  contrat: 'Contrat',
  reglement: 'Règlement intérieur',
  convocation: 'Convocation',
  facture: 'Facture',
}

const DOC_TYPES: Array<{ type: 'contrat' | 'reglement' | 'convocation'; label: string }> = [
  { type: 'contrat', label: 'Contrat' },
  { type: 'reglement', label: 'Règlement' },
  { type: 'convocation', label: 'Convocation' },
]

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
  } as React.CSSProperties,
  badge: (sent: boolean) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: sent ? '#EEF2FF' : '#F9FAFB',
    color: sent ? '#6366F1' : '#888888',
  } as React.CSSProperties),
  badgeNew: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  } as React.CSSProperties,
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  buttonSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'transparent',
    color: '#6366F1',
    border: '1px solid #6366F1',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  buttonDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
    border: 'none',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
}

// ─── Vue organisateur ─────────────────────────────────────────────────────────

function OrganizerView({ eventId }: { eventId: string }) {
  const [documents, setDocuments] = useState<EventDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [acceptedCreators, setAcceptedCreators] = useState<Array<{ id: string; full_name: string; email: string }>>([])

  useEffect(() => {
    if (!eventId) return
    fetchDocs()
    fetchAcceptedCreators()
  }, [eventId])

  async function fetchDocs() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    const res = await fetch(`/api/events/${eventId}/documents`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setDocuments(json.documents || [])
    }
    setLoading(false)
  }

  async function fetchAcceptedCreators() {
    const { data } = await supabase
      .from('applications')
      .select('creator_id, profiles!creator_id(id, full_name, email)')
      .eq('event_id', eventId)
      .eq('status', 'accepted')
    if (data) {
      setAcceptedCreators(
        data.map((a: any) => ({
          id: a.profiles?.id || a.creator_id,
          full_name: a.profiles?.full_name || '—',
          email: a.profiles?.email || '',
        }))
      )
    }
  }

  async function sendDoc(creatorId: string, type: 'contrat' | 'reglement' | 'convocation') {
    const key = `${creatorId}-${type}`
    setSending(s => ({ ...s, [key]: true }))
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSending(s => ({ ...s, [key]: false })); return }
    await fetch(`/api/events/${eventId}/documents/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ creator_id: creatorId, type }),
    })
    setSending(s => ({ ...s, [key]: false }))
    fetchDocs()
  }

  function getDoc(creatorId: string, type: string) {
    return documents.find(d => d.creator_id === creatorId && d.type === type) || null
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#888888', fontSize: '14px' }}>
      Chargement des documents…
    </div>
  )

  if (acceptedCreators.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <FileText size={32} color="#9CA3AF" style={{ marginBottom: '12px' }} />
      <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
        Aucun créateur accepté. Acceptez des candidatures pour générer des documents.
      </p>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
            <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#888888', whiteSpace: 'nowrap' }}>Créateur</th>
            {DOC_TYPES.map(dt => (
              <th key={dt.type} style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#888888', whiteSpace: 'nowrap' }}>
                {dt.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {acceptedCreators.map(creator => (
            <tr key={creator.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{creator.full_name}</p>
                <p style={{ fontSize: '12px', color: '#888888', margin: 0 }}>{creator.email}</p>
              </td>
              {DOC_TYPES.map(dt => {
                const doc = getDoc(creator.id, dt.type)
                const key = `${creator.id}-${dt.type}`
                const isLoading = sending[key]
                return (
                  <td key={dt.type} style={{ padding: '12px 14px', textAlign: 'center' }}>
                    {doc ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <span style={styles.badge(true)}>
                          <CheckCircle size={10} />
                          {doc.sent_at ? `Envoyé ${new Date(doc.sent_at).toLocaleDateString('fr-FR')}` : 'Généré'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => window.open(doc.pdf_url, '_blank')}
                            style={styles.buttonSecondary}
                          >
                            <Download size={12} /> Voir
                          </button>
                          <button
                            onClick={() => sendDoc(creator.id, dt.type)}
                            disabled={isLoading}
                            style={isLoading ? styles.buttonDisabled : styles.buttonSecondary}
                          >
                            <RefreshCw size={12} /> Renvoyer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => sendDoc(creator.id, dt.type)}
                        disabled={isLoading}
                        style={isLoading ? styles.buttonDisabled : styles.button}
                      >
                        <Send size={12} /> {isLoading ? 'Envoi…' : 'Générer'}
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Vue créateur ─────────────────────────────────────────────────────────────

function CreatorView() {
  const [documents, setDocuments] = useState<EventDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocs()
  }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    const res = await fetch('/api/documents/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const json = await res.json()
      setDocuments(json.documents || [])
    }
    setLoading(false)
  }

  async function markDownloaded(docId: string) {
    await supabase.from('event_documents').update({ downloaded_at: new Date().toISOString() }).eq('id', docId)
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, downloaded_at: new Date().toISOString() } : d))
  }

  // Grouper par événement
  const byEvent = documents.reduce((acc, doc) => {
    const key = doc.event_id
    if (!acc[key]) acc[key] = { event: doc.event, docs: [] }
    acc[key].docs.push(doc)
    return acc
  }, {} as Record<string, { event: EventDocument['event']; docs: EventDocument[] }>)

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#888888', fontSize: '14px' }}>
      Chargement de vos documents…
    </div>
  )

  if (documents.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <FileText size={32} color="#9CA3AF" style={{ marginBottom: '12px' }} />
      <p style={{ color: '#888888', fontSize: '14px', margin: 0 }}>
        Aucun document pour le moment. Vos contrats et convocations apparaîtront ici.
      </p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Object.values(byEvent).map(({ event, docs }) => (
        <div key={docs[0].event_id} style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>{event?.title || '—'}</p>
            {event?.start_date && (
              <p style={{ fontSize: '12px', color: '#888888', margin: '2px 0 0' }}>
                {new Date(event.start_date).toLocaleDateString('fr-FR')} · {event.city}
              </p>
            )}
          </div>
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {docs.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={16} color="#6366F1" />
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', margin: 0 }}>
                      {TYPE_LABELS[doc.type] || doc.type}
                    </p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                      {doc.sent_at ? `Reçu le ${new Date(doc.sent_at).toLocaleDateString('fr-FR')}` : ''}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {!doc.downloaded_at && (
                    <span style={styles.badgeNew}>Nouveau</span>
                  )}
                  <button
                    onClick={() => {
                      markDownloaded(doc.id)
                      window.open(doc.pdf_url, '_blank')
                    }}
                    style={styles.button}
                  >
                    <Download size={13} /> Télécharger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Export principal ─────────────────────────────────────────────────────────

export default function DocumentsPanel({ eventId, role }: DocumentsPanelProps) {
  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <FileText size={18} color="#6366F1" />
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
          {role === 'organizer' ? 'Documents par créateur' : 'Mes documents'}
        </h3>
      </div>
      {role === 'organizer' ? (
        <OrganizerView eventId={eventId} />
      ) : (
        <CreatorView />
      )}
    </div>
  )
}
