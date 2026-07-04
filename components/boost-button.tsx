'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Zap } from 'lucide-react'

type Props = {
  type: 'boost_application' | 'boost_profile'
  refId?: string
  boostedUntil?: string | null
  onSuccess?: (newBalance: number) => void
}

const COST = { boost_application: 1, boost_profile: 2 }
const LABEL = { boost_application: 'Booster (1 crédit)', boost_profile: 'Booster profil (2 crédits)' }

export function BoostButton({ type, refId, boostedUntil, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const isBoosted = boostedUntil ? new Date(boostedUntil) > new Date() : false

  if (isBoosted || done) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: '#6366F1', background: 'rgba(99,102,241,0.1)', padding: '3px 10px', borderRadius: '99px', border: '1px solid rgba(99,102,241,0.2)' }}>
        <Zap size={11} fill="#6366F1" color="#6366F1" /> Boosté
      </span>
    )
  }

  const handleBoost = async () => {
    setLoading(true)
    setError(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Non connecté'); setLoading(false); return }

    const res = await fetch('/api/credits/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type, ref_id: refId }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error === 'Crédits insuffisants' ? 'Crédits insuffisants' : 'Erreur')
      return
    }
    setDone(true)
    onSuccess?.(json.new_balance)
  }

  return (
    <div>
      <button onClick={handleBoost} disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#FFF', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
        <Zap size={12} fill="#FFF" color="#FFF" />
        {loading ? 'Boosting…' : LABEL[type]}
      </button>
      {error && <p style={{ fontSize: '11px', color: '#EF4444', margin: '4px 0 0', fontWeight: '600' }}>{error}</p>}
    </div>
  )
}
