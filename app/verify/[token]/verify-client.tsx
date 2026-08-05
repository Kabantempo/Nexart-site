'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

interface VerifyData {
  valid: boolean
  creator_name?: string
  event_title?: string
  event_date?: string
  stand_number?: string
  document_type?: string
  verified_at?: string
  already_scanned?: boolean
}

export default function VerifyClient({ token }: { token: string }) {
  const [data, setData] = useState<VerifyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/verify/${token}`, { method: 'POST' })
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <span style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366F1', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!data?.valid) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#FEF2F2', padding: '24px', textAlign: 'center' }}>
      <XCircle size={64} color="#EF4444" />
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginTop: '16px' }}>Document invalide</h1>
      <p style={{ color: '#888888', marginTop: '8px' }}>Ce QR code n'existe pas ou a expiré.</p>
      <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '24px' }}>nexart.fr</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F0FDF4', padding: '24px', textAlign: 'center' }}>
      <CheckCircle size={64} color="#22C55E" />
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', marginTop: '16px' }}>
        {data.already_scanned ? 'Déjà scanné ✓' : 'Document valide ✓'}
      </h1>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', marginTop: '24px', width: '100%', maxWidth: '360px', textAlign: 'left', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Row label="Créateur" value={data.creator_name} />
        <Row label="Événement" value={data.event_title} />
        <Row label="Date" value={data.event_date} />
        {data.stand_number && <Row label="Stand" value={data.stand_number} />}
        <Row label="Document" value={data.document_type} />
        {data.already_scanned && data.verified_at && (
          <Row label="⚠️ Scanné le" value={new Date(data.verified_at).toLocaleString('fr-FR')} highlight />
        )}
      </div>

      <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '24px' }}>Vérifié via nexart.fr</p>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: '13px', color: '#888888' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: highlight ? '#EF4444' : '#1A1A1A' }}>{value || '—'}</span>
    </div>
  )
}
