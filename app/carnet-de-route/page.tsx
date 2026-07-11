'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { MapPin, Plus, Trash2, Eye, EyeOff, ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

interface ItineraryEntry {
  id: string
  label: string
  region?: string
  department?: string
  city?: string
  start_date: string
  end_date: string
  is_public: boolean
  created_at: string
}

export default function CarnetDeRoutePage() {
  const user = useAuthStore(s => s.user)
  const router = useRouter()
  const [entries, setEntries] = useState<ItineraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ label: '', region: '', city: '', start_date: '', end_date: '', is_public: true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
    })
  }, [router])

  useEffect(() => {
    if (!user || user.role !== 'creator') return
    fetch(`/api/itinerary?creator_id=${user.id}`)
      .then(r => r.json())
      .then(d => setEntries(d.itinerary || []))
      .finally(() => setLoading(false))
  }, [user])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !form.label || !form.start_date || !form.end_date) return
    setSubmitting(true)
    setError(null)
    const res = await fetch('/api/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_id: user.id, ...form }),
    })
    if (res.ok) {
      const { entry } = await res.json()
      setEntries(prev => [entry, ...prev])
      setShowForm(false)
      setForm({ label: '', region: '', city: '', start_date: '', end_date: '', is_public: true })
    } else {
      const d = await res.json()
      setError(d.error || 'Erreur')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    await fetch(`/api/itinerary?id=${id}&creator_id=${user.id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (!user || user.role !== 'creator') return (
    <div style={{ padding: '80px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Réservé aux créateurs</p>
    </div>
  )

  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={{ backgroundColor: '#111827', padding: '40px 24px 32px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft size={12} /> Tableau de bord
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px' }}>
                🗺️ Carnet de route
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Publiez vos déplacements prévus — les organisateurs de votre zone vous trouveront.
              </p>
            </div>
            <button onClick={() => setShowForm(!showForm)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
              <Plus size={14} /> Ajouter une étape
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px' }}>
        {/* Formulaire */}
        {showForm && (
          <form onSubmit={handleAdd} style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px' }}>Nouvelle étape</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Label *</label>
                <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} required
                  placeholder="ex : Var du 10 au 20 juillet"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Région</label>
                  <input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                    placeholder="Provence-Alpes-Côte d'Azur"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Ville</label>
                  <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Toulon"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date début *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date fin *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_public} onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))} />
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Visible publiquement (organisateurs + visiteurs)</span>
              </label>
            </div>
            {error && <p style={{ fontSize: '12px', color: '#E05A5A', marginTop: '8px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button type="submit" disabled={submitting}
                style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#111827', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
                {submitting ? 'Ajout...' : 'Ajouter l\'étape'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
            <MapPin size={40} color="#E5E7EB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px' }}>Carnet vide</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
              Ajoutez vos prochains déplacements prévus. Les organisateurs de votre zone pourront vous contacter !
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '8px', backgroundColor: '#111827', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', border: 'none', cursor: 'pointer' }}>
              <Plus size={13} /> Ajouter une étape
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entries.map(entry => (
              <div key={entry.id} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPin size={18} color="#6B7280" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 3px' }}>{entry.label}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {entry.city && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={9} />{entry.city}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={9} />
                        {new Date(entry.start_date).toLocaleDateString('fr-FR')} → {new Date(entry.end_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: entry.is_public ? '#10B981' : '#9CA3AF' }}>
                        {entry.is_public ? <Eye size={9} /> : <EyeOff size={9} />}
                        {entry.is_public ? 'Public' : 'Privé'}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(entry.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Trash2 size={15} color="#9CA3AF" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
