'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { FileText, Download, ArrowLeft } from 'lucide-react'
import { colors } from '@/lib/design-tokens'

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
  event?: { title: string; start_date: string; city: string }
}

const TYPE_LABELS: Record<string, string> = {
  contrat: 'Contrat',
  reglement: 'Reglement interieur',
  convocation: 'Convocation',
  facture: 'Facture',
}

export default function DocumentsPageClient() {
  const user = useAuthStore(s => s.user)
  const router = useRouter()
  const [documents, setDocuments] = useState<EventDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchDocs()
  }, [user])

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
    await (supabase as any).from('event_documents').update({ downloaded_at: new Date().toISOString() }).eq('id', docId)
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, downloaded_at: new Date().toISOString() } : d))
  }

  const byEvent = documents.reduce((acc, doc) => {
    const key = doc.event_id
    if (!acc[key]) acc[key] = { event: doc.event, docs: [] }
    acc[key].docs.push(doc)
    return acc
  }, {} as Record<string, { event: EventDocument['event']; docs: EventDocument[] }>)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color={colors.violet.primary} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Mes documents</h1>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Chargement…</p>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 16px', border: '1px dashed var(--border-color)', borderRadius: 12 }}>
            <FileText size={36} color='var(--text-tertiary)' style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>Aucun document pour le moment.</p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '6px 0 0' }}>Vos contrats et convocations apparaitront ici.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.values(byEvent).map(({ event, docs }) => (
              <div key={docs[0].event_id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{event?.title || '—'}</p>
                  {event?.start_date && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                      {new Date(event.start_date).toLocaleDateString('fr-FR')} · {event.city}
                    </p>
                  )}
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {docs.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <FileText size={16} color={colors.violet.primary} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{TYPE_LABELS[doc.type] || doc.type}</p>
                          {doc.sent_at && <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Recu le {new Date(doc.sent_at).toLocaleDateString('fr-FR')}</p>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {!doc.downloaded_at && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backgroundColor: colors.feedback.warning.bg, color: colors.feedback.warning.solid }}>Nouveau</span>
                        )}
                        <button onClick={() => { markDownloaded(doc.id); window.open(doc.pdf_url, '_blank') }}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: colors.violet.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <Download size={13} /> Telecharger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
