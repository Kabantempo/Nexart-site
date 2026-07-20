'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Zap, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

type CreditRow = {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  gift: 'Cadeau',
  purchase: 'Achat',
  boost_application: 'Boost candidature',
  boost_profile: 'Boost profil',
  monthly_refill: 'Recharge mensuelle',
  admin: 'Ajout admin',
}

export function CreditsWidget() {
  const [balance, setBalance] = useState<number | null>(null)
  const [history, setHistory] = useState<CreditRow[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/credits/balance', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) return
    const json = await res.json()
    setBalance(json.balance)
    setHistory(json.history)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading || balance === null) return null

  return (
    <div style={{ borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: '16px' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="#FFF" fill="#FFF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Mes crédits</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>1 crédit = boost candidature · 2 crédits = boost profil</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '24px', fontWeight: '800', color: balance > 0 ? '#6366F1' : '#9CA3AF', lineHeight: 1 }}>{balance}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>crédit{balance !== 1 ? 's' : ''}</span>
          </div>
          {open ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
        </div>
      </button>

      {/* Historique */}
      {open && (
        <div style={{ padding: '0 20px 16px', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid #F1F5F9' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0', margin: 0 }}>Aucun mouvement de crédits</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px' }}>
              {history.map(row => (
                <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{TYPE_LABEL[row.type] ?? row.type}</p>
                    {row.description && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{row.description}</p>}
                    <p style={{ fontSize: '11px', color: '#CBD5E1', margin: 0 }}>{new Date(row.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: row.amount > 0 ? '#10B981' : '#EF4444' }}>
                    {row.amount > 0 ? '+' : ''}{row.amount}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <TrendingUp size={13} color="#6366F1" />
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#6366F1', margin: 0 }}>Obtenir des crédits</p>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Les plans <strong>Pro</strong> et <strong>Premium</strong> incluent des crédits offerts chaque mois. Les packs de crédits seront disponibles prochainement.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
