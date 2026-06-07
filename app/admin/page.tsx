'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle, XCircle, FileText, User, ExternalLink, Shield,
  Users, Calendar, MessageSquare, TrendingUp, Activity,
} from 'lucide-react'

type Creator = {
  user_id: string
  siret_number: string | null
  siret_verified: boolean
  insurance_verified: boolean
  insurance_doc_url: string | null
  profiles: { full_name: string; avatar_url: string | null } | null
}

type KPI = {
  totalUsers: number
  creators: number
  organizers: number
  newThisWeek: number
  totalEvents: number
  publishedEvents: number
  totalApplications: number
  acceptedApplications: number
  pendingApplications: number
  totalMessages: number
  siretPending: number
  siretVerified: number
}

const TAB_STYLE = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
  fontSize: '14px', fontWeight: '600',
  backgroundColor: active ? '#6366F1' : '#F3F4F6',
  color: active ? '#FFF' : '#4B5563',
  transition: 'all 0.15s',
})

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'kpi' | 'verif'>('kpi')
  const [loading, setLoading] = useState(true)
  const [creators, setCreators] = useState<Creator[]>([])
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [kpi, setKpi] = useState<KPI | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single()
      if (!prof?.is_admin) { router.push('/'); return }
      await Promise.all([fetchKpi(), fetchCreators()])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchKpi = async () => {
    const [
      { count: totalUsers },
      { count: creators },
      { count: organizers },
      { count: newThisWeek },
      { count: totalEvents },
      { count: publishedEvents },
      { count: totalApplications },
      { count: acceptedApplications },
      { count: pendingApplications },
      { count: totalMessages },
      { count: siretPending },
      { count: siretVerified },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'organizer'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('siret_verified', false).not('siret_number', 'is', null),
      supabase.from('creator_profiles').select('*', { count: 'exact', head: true }).eq('siret_verified', true),
    ])
    setKpi({
      totalUsers: totalUsers ?? 0,
      creators: creators ?? 0,
      organizers: organizers ?? 0,
      newThisWeek: newThisWeek ?? 0,
      totalEvents: totalEvents ?? 0,
      publishedEvents: publishedEvents ?? 0,
      totalApplications: totalApplications ?? 0,
      acceptedApplications: acceptedApplications ?? 0,
      pendingApplications: pendingApplications ?? 0,
      totalMessages: totalMessages ?? 0,
      siretPending: siretPending ?? 0,
      siretVerified: siretVerified ?? 0,
    })
  }

  const fetchCreators = async () => {
    const { data } = await supabase
      .from('creator_profiles')
      .select('user_id, siret_number, siret_verified, insurance_verified, insurance_doc_url, profiles(full_name, avatar_url)')
      .order('user_id')
    setCreators((data as unknown as Creator[]) ?? [])
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleVerify = async (userId: string, field: 'siret_verified' | 'insurance_verified', value: boolean) => {
    setSaving(`${userId}-${field}`)
    await supabase.from('creator_profiles').update({ [field]: value }).eq('user_id', userId)
    setCreators(prev => prev.map(c => c.user_id === userId ? { ...c, [field]: value } : c))
    setSaving(null)
    showToast(value ? '✓ Vérifié' : '✗ Refusé')
  }

  const pending = creators.filter(c => !c.siret_verified || (!c.insurance_verified && c.insurance_doc_url))
  const displayed = filter === 'pending' ? pending : creators

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const pct = (a: number, b: number) => b === 0 ? '—' : `${Math.round((a / b) * 100)}%`

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 16px 80px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={24} color="#FFF" />
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Panel Admin</h1>
          <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>Nexart — Tableau de bord interne</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        <button style={TAB_STYLE(tab === 'kpi')} onClick={() => setTab('kpi')}>
          📊 KPI Business
        </button>
        <button style={TAB_STYLE(tab === 'verif')} onClick={() => setTab('verif')}>
          🛡️ Vérifications ({pending.length} en attente)
        </button>
      </div>

      {/* ── KPI TAB ── */}
      {tab === 'kpi' && kpi && (
        <div>
          {/* Utilisateurs */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="#6366F1" /> Utilisateurs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Total inscrits', value: kpi.totalUsers, color: '#6366F1', bg: '#EEF2FF' },
              { label: 'Créateurs', value: kpi.creators, color: '#8B5CF6', bg: '#F5F3FF' },
              { label: 'Organisateurs', value: kpi.organizers, color: '#06B6D4', bg: '#ECFEFF' },
              { label: 'Nouveaux (7j)', value: kpi.newThisWeek, color: '#10B981', bg: '#ECFDF5' },
            ].map(s => (
              <div key={s.label} style={{ padding: '20px', borderRadius: '12px', backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>
                <p style={{ fontSize: '32px', fontWeight: '800', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, fontWeight: '600' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Événements & Candidatures */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#6366F1" /> Événements & Candidatures
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Événements total', value: kpi.totalEvents, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Publiés', value: kpi.publishedEvents, color: '#10B981', bg: '#ECFDF5' },
              { label: 'Candidatures', value: kpi.totalApplications, color: '#6366F1', bg: '#EEF2FF' },
              { label: 'Acceptées', value: kpi.acceptedApplications, color: '#10B981', bg: '#ECFDF5' },
              { label: 'En attente', value: kpi.pendingApplications, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'Messages', value: kpi.totalMessages, color: '#8B5CF6', bg: '#F5F3FF' },
            ].map(s => (
              <div key={s.label} style={{ padding: '20px', borderRadius: '12px', backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>
                <p style={{ fontSize: '32px', fontWeight: '800', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, fontWeight: '600' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* KPI Marketplace */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#6366F1" /> KPI Marketplace
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {[
              {
                label: 'Taux de conversion candidatures',
                value: pct(kpi.acceptedApplications, kpi.totalApplications),
                desc: 'candidatures acceptées / total',
                color: '#10B981', bg: '#ECFDF5',
              },
              {
                label: 'Taux remplissage stands',
                value: pct(kpi.acceptedApplications, kpi.publishedEvents * 10),
                desc: 'estimation (10 stands/event)',
                color: '#6366F1', bg: '#EEF2FF',
              },
              {
                label: 'Ratio créateurs actifs',
                value: pct(kpi.creators, kpi.totalUsers),
                desc: 'créateurs / total inscrits',
                color: '#8B5CF6', bg: '#F5F3FF',
              },
              {
                label: 'SIRET vérifiés',
                value: pct(kpi.siretVerified, kpi.creators),
                desc: `${kpi.siretVerified} vérifiés, ${kpi.siretPending} en attente`,
                color: '#F59E0B', bg: '#FFFBEB',
              },
            ].map(s => (
              <div key={s.label} style={{ padding: '20px', borderRadius: '12px', backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>
                <p style={{ fontSize: '28px', fontWeight: '800', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: '13px', color: '#1A1A1A', margin: '0 0 2px', fontWeight: '700' }}>{s.label}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* KPI SaaS — placeholders Stripe */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#6366F1" /> KPI SaaS / Revenus
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'MRR', value: '—', desc: 'Stripe requis' },
              { label: 'Churn', value: '—', desc: 'Stripe requis' },
              { label: 'LTV', value: '—', desc: 'Stripe requis' },
              { label: 'CAC', value: '—', desc: 'Stripe requis' },
              { label: 'GMV', value: '—', desc: 'Stripe requis' },
              { label: 'ARPU', value: '—', desc: 'Stripe requis' },
            ].map(s => (
              <div key={s.label} style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#F9F9FB', border: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '28px', fontWeight: '800', color: '#D1D5DB', margin: '0 0 4px' }}>{s.value}</p>
                <p style={{ fontSize: '13px', color: '#1A1A1A', margin: '0 0 2px', fontWeight: '700' }}>{s.label}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VÉRIFICATION TAB ── */}
      {tab === 'verif' && (
        <div>
          {/* Filtres */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { k: 'pending', label: `En attente (${pending.length})` },
              { k: 'all', label: `Tous (${creators.length})` },
            ].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k as 'all' | 'pending')} style={TAB_STYLE(filter === f.k)}>
                {f.label}
              </button>
            ))}
          </div>

          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
              <CheckCircle size={40} color="#10B981" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>Tout est vérifié ✓</p>
              <p style={{ fontSize: '14px', color: '#888' }}>Aucune demande en attente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayed.map(c => (
                <div key={c.user_id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {c.profiles?.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={c.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <User size={20} color="#FFF" />
                      }
                    </div>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>{c.profiles?.full_name ?? 'Créateur'}</p>
                      <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{c.user_id.slice(0, 8)}…</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* SIRET */}
                    <div style={{ flex: 1, minWidth: '260px', padding: '16px', borderRadius: '10px', border: `1px solid ${c.siret_verified ? '#A7F3D0' : '#FDE68A'}`, backgroundColor: c.siret_verified ? '#ECFDF5' : '#FFFBEB' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>SIRET</p>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: c.siret_verified ? '#059669' : '#F59E0B', color: '#FFF' }}>
                          {c.siret_verified ? 'Vérifié' : 'En attente'}
                        </span>
                      </div>
                      {c.siret_number
                        ? <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '1px', margin: '0 0 12px', fontFamily: 'monospace' }}>{c.siret_number}</p>
                        : <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 12px' }}>Numéro non renseigné</p>
                      }
                      {!c.siret_verified && c.siret_number && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleVerify(c.user_id, 'siret_verified', true)} disabled={saving === `${c.user_id}-siret_verified`}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> Valider
                          </button>
                          <button onClick={() => handleVerify(c.user_id, 'siret_verified', false)} disabled={saving === `${c.user_id}-siret_verified`}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            <XCircle size={13} />
                          </button>
                        </div>
                      )}
                      {c.siret_verified && (
                        <button onClick={() => handleVerify(c.user_id, 'siret_verified', false)}
                          style={{ fontSize: '11px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Révoquer
                        </button>
                      )}
                    </div>

                    {/* RC Pro */}
                    <div style={{ flex: 1, minWidth: '260px', padding: '16px', borderRadius: '10px', border: `1px solid ${c.insurance_verified ? '#A7F3D0' : c.insurance_doc_url ? '#FDE68A' : '#E5E7EB'}`, backgroundColor: c.insurance_verified ? '#ECFDF5' : c.insurance_doc_url ? '#FFFBEB' : '#FAFAFA' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>RC Pro</p>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: c.insurance_verified ? '#059669' : c.insurance_doc_url ? '#F59E0B' : '#E5E7EB', color: c.insurance_verified || c.insurance_doc_url ? '#FFF' : '#9CA3AF' }}>
                          {c.insurance_verified ? 'Vérifié' : c.insurance_doc_url ? 'Doc reçu' : 'Aucun doc'}
                        </span>
                      </div>
                      {c.insurance_doc_url
                        ? <a href={c.insurance_doc_url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6366F1', textDecoration: 'none', fontWeight: '600', marginBottom: '12px' }}>
                            <FileText size={14} /> Voir le document <ExternalLink size={12} />
                          </a>
                        : <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 12px' }}>Aucun document déposé</p>
                      }
                      {!c.insurance_verified && c.insurance_doc_url && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleVerify(c.user_id, 'insurance_verified', true)} disabled={saving === `${c.user_id}-insurance_verified`}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: '#059669', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <CheckCircle size={13} /> Valider
                          </button>
                          <button onClick={() => handleVerify(c.user_id, 'insurance_verified', false)} disabled={saving === `${c.user_id}-insurance_verified`}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                            <XCircle size={13} />
                          </button>
                        </div>
                      )}
                      {c.insurance_verified && (
                        <button onClick={() => handleVerify(c.user_id, 'insurance_verified', false)}
                          style={{ fontSize: '11px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Révoquer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '14px', fontWeight: '600', zIndex: 999, animation: 'fadeIn 0.2s ease' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
