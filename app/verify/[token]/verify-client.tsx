'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Loader2, QrCode } from 'lucide-react'

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888888', fontSize: '14px', fontWeight: 500 }}>Vérification en cours…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!data?.valid) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {/* Logo */}
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.5px', marginBottom: '40px' }}>NEXART</p>

        {/* Erreur card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '40px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <XCircle size={36} color="#EF4444" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>Document invalide</h1>
          <p style={{ color: '#888888', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            Ce QR code ne correspond à aucun document valide dans notre système ou a expiré.
          </p>
        </div>

        <p style={{ color: '#C0C0C0', fontSize: '12px', marginTop: '32px' }}>nexart.fr · Vérification sécurisée</p>
      </div>
    </div>
  )

  const alreadyScanned = data.already_scanned

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.5px', marginBottom: '32px', textAlign: 'center' }}>NEXART</p>

        {/* Status card */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: `1px solid ${alreadyScanned ? '#FEF3C7' : '#E5E7EB'}`,
        }}>
          {/* Header coloré */}
          <div style={{
            padding: '28px 32px',
            background: alreadyScanned
              ? 'linear-gradient(135deg, #FEF3C7, #FDE68A)'
              : 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: alreadyScanned ? 'rgba(217,119,6,0.15)' : 'rgba(99,102,241,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {alreadyScanned
                ? <AlertTriangle size={28} color="#D97706" />
                : <CheckCircle size={28} color="#6366F1" />
              }
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                {alreadyScanned ? 'Déjà scanné' : 'Document valide ✓'}
              </p>
              <p style={{ fontSize: '13px', color: alreadyScanned ? '#D97706' : '#6366F1', margin: '2px 0 0', fontWeight: 500 }}>
                {alreadyScanned ? 'Ce document a déjà été présenté' : 'Entrée autorisée'}
              </p>
            </div>
          </div>

          {/* Infos */}
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <Row label="Créateur" value={data.creator_name} />
            <Row label="Événement" value={data.event_title} />
            <Row label="Date" value={data.event_date} />
            {data.stand_number && <Row label="Stand" value={data.stand_number} accent />}
            <Row label="Document" value={data.document_type} />
            {alreadyScanned && data.verified_at && (
              <Row
                label="Premier scan"
                value={new Date(data.verified_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                warning
              />
            )}
          </div>

          {/* Footer */}
          {alreadyScanned && (
            <div style={{ padding: '16px 32px', backgroundColor: '#FFFBEB', borderTop: '1px solid #FDE68A' }}>
              <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                ⚠️ Ce QR code a déjà été utilisé. Si ce n'est pas vous, contactez l'organisateur.
              </p>
            </div>
          )}
        </div>

        {/* QR icon + footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '28px' }}>
          <QrCode size={14} color="#C0C0C0" />
          <p style={{ color: '#C0C0C0', fontSize: '12px', margin: 0 }}>Vérifié via nexart.fr</p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, accent, warning }: { label: string; value?: string; accent?: boolean; warning?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '11px 0',
      borderBottom: '1px solid #F3F4F6',
      gap: '12px',
    }}>
      <span style={{ fontSize: '13px', color: '#888888', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{
        fontSize: '13px',
        fontWeight: 600,
        color: warning ? '#D97706' : accent ? '#6366F1' : '#1A1A1A',
        textAlign: 'right',
      }}>
        {value || '—'}
      </span>
    </div>
  )
}
