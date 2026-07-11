'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Users, Calendar, Shield, MessageSquare, Package,
  CheckCircle, XCircle, ExternalLink, FileText, Trash2, Eye, EyeOff,
  TrendingUp, BarChart2, Send, Search, X, ArrowUpRight,
  CheckCheck, Clock, LayoutGrid, User, AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Analytics = {
  users: { total: number; creators: number; organizers: number; new_week: number; new_month: number; new_today: number }
  events: { total: number; published: number; draft: number; closed: number }
  applications: { total: number; pending: number; accepted: number; refused: number }
  dailySignups: { date: string; count: number }[]
  eventTypes: { event_type: string; count: number }[]
  verifications: { total: number; siret_verified: number; siret_pending: number; insurance_verified: number; insurance_pending: number }
  messages: { total: number }
  kpi: {
    conversionCreator: { active: number; total: number }
    conversionOrganizer: { active: number; total: number }
    fillRate: { total_stands: number; filled_stands: number }
    liquidity: { avg_hours: number | null }
    retention30: { cohort_total: number; retained: number }
    mrr: number
    churnRate: number | null
    cac: number | null
    ltv: number | null
    gmv: number
    arpu: number
  }
}

type AdminCreator = {
  user_id: string
  siret_number: string | null
  siret_verified: boolean
  insurance_verified: boolean
  insurance_doc_url: string | null
  profiles: { full_name: string; avatar_url: string | null; is_banned?: boolean; is_creator?: boolean; is_organizer?: boolean; role?: string } | null
}

type AdminOrgaVerif = {
  user_id: string
  siret_number: string | null
  siret_verified: boolean
  verification_doc_url: string | null
  verification_doc_verified: boolean
  profiles?: { full_name: string; avatar_url: string | null } | null
}

type AdminEvent = {
  id: string; title: string; city: string | null; start_date: string
  event_type: string; status: string; cover_image: string | null
  stand_count: number | null; stand_price: number | null
  profiles: { full_name: string } | null
}

type AdminMessage = {
  id: string; content: string; subject: string | null; created_at: string; read_at: string | null
  recipient: { full_name: string; avatar_url: string | null; role: string | null } | null
}

type UserSuggestion = { id: string; full_name: string; avatar_url: string | null; role: string | null }

type DisciplineProposal = {
  id: string; name: string; status: string; created_at: string; creator_id: string
  profiles?: { full_name: string } | null
}

type Report = {
  id: string; reporter_id: string; target_id: string; target_type: string
  reason: string; status: string; created_at: string
  reporter?: { full_name: string | null }
}

type AdminTab = 'analytics' | 'verifications' | 'disciplines' | 'marches' | 'messages' | 'abonnements' | 'signalements'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB' },
  accepted:  { label: 'Acceptée',   color: '#10B981', bg: '#ECFDF5' },
  refused:   { label: 'Refusée',    color: '#EF4444', bg: '#FEF2F2' },
  draft:     { label: 'Brouillon',  color: 'var(--text-secondary)', bg: '#F3F4F6' },
  published: { label: 'Publié',     color: '#10B981', bg: '#ECFDF5' },
  closed:    { label: 'Fermé',      color: 'var(--text-secondary)', bg: '#F3F4F6' },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent', seasonal: 'Saisonnier',
  popup: 'Pop-up', salon: 'Salon', fair: 'Foire',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminId, setAdminId] = useState<string | null>(null)

  // Tab
  const [tab, setTab] = useState<AdminTab>('analytics')

  // Analytics
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Verifications
  const [creators, setCreators] = useState<AdminCreator[]>([])
  const [orgaVerifs, setOrgaVerifs] = useState<AdminOrgaVerif[]>([])
  const [creatorFilter, setCreatorFilter] = useState<'pending' | 'all'>('pending')
  const [orgaFilter, setOrgaFilter] = useState<'pending' | 'all'>('pending')
  const [refusedSet, setRefusedSet] = useState<Set<string>>(new Set())
  const [refuseModal, setRefuseModal] = useState<{ userId: string; field: 'siret_verified' | 'insurance_verified'; creatorName: string } | null>(null)
  const [refuseComment, setRefuseComment] = useState('')
  const [verifSaving, setVerifSaving] = useState<string | null>(null)
  const [orgaVerifSaving, setOrgaVerifSaving] = useState<string | null>(null)

  // Disciplines
  const [discProposals, setDiscProposals] = useState<DisciplineProposal[]>([])
  const [discProposalSaving, setDiscProposalSaving] = useState<string | null>(null)

  // Marchés
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null)

  // Messages
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [msgSearch, setMsgSearch] = useState('')
  const [msgSuggestions, setMsgSuggestions] = useState<UserSuggestion[]>([])
  const [msgRecipient, setMsgRecipient] = useState<UserSuggestion | null>(null)
  const [msgSubject, setMsgSubject] = useState('')
  const [msgContent, setMsgContent] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [msgSearchTimeout, setMsgSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Abonnements
  const [subSearch, setSubSearch] = useState('')
  const [subResults, setSubResults] = useState<{ id: string; full_name: string; role: string; subscription_tier?: string }[]>([])
  const [subSearching, setSubSearching] = useState(false)
  const [subSaving, setSubSaving] = useState<string | null>(null)
  const [subToast, setSubToast] = useState<string | null>(null)

  // Signalements
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoaded, setReportsLoaded] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ─── Load data on mount ───────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const uid = session.user.id

      const { data: prof } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', uid)
        .maybeSingle()

      if (!prof?.is_admin) { router.push('/'); return }

      setAdminId(uid)

      const [
        { data: creatorsData },
        { data: eventsData },
        analyticsRes,
        { data: discProps },
        { data: orgaData },
        { data: msgs },
      ] = await Promise.all([
        supabase.from('creator_profiles')
          .select('user_id,siret_number,siret_verified,insurance_verified,insurance_doc_url,profiles(full_name,avatar_url,is_banned,is_creator,is_organizer,role)')
          .order('user_id'),
        supabase.from('events')
          .select('id,title,city,start_date,event_type,status,cover_image,stand_count,stand_price,profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(50),
        fetch('/api/admin/analytics').then(r => r.json()),
        supabase.from('discipline_proposals')
          .select('id,name,status,created_at,creator_id,profiles!creator_id(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('organizer_profiles')
          .select('user_id,siret_number,siret_verified,verification_doc_url,verification_doc_verified,profiles!user_id(full_name,avatar_url)')
          .order('user_id'),
        supabase.from('admin_messages')
          .select('id,content,subject,created_at,read_at,recipient:recipient_id(full_name,avatar_url,role)')
          .eq('sender_id', uid)
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      setCreators((creatorsData as unknown as AdminCreator[]) ?? [])
      setEvents((eventsData as unknown as AdminEvent[]) ?? [])
      setAnalytics(analyticsRes as Analytics)
      setDiscProposals((discProps as unknown as DisciplineProposal[]) ?? [])
      setOrgaVerifs((orgaData as unknown as AdminOrgaVerif[]) ?? [])
      setAdminMessages((msgs as unknown as AdminMessage[]) ?? [])
      setLoading(false)
    })
  }, [router])

  // Load reports on tab switch
  useEffect(() => {
    if (tab === 'signalements' && !reportsLoaded) {
      supabase.from('reports')
        .select('*, reporter:reporter_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(100)
        .then(({ data }) => {
          setReports((data as unknown as Report[]) ?? [])
          setReportsLoaded(true)
        })
    }
  }, [tab, reportsLoaded])

  // Load analytics lazily if needed
  useEffect(() => {
    if (tab === 'analytics' && !analytics && !analyticsLoading) {
      setAnalyticsLoading(true)
      fetch('/api/admin/analytics').then(r => r.json()).then(d => {
        setAnalytics(d)
        setAnalyticsLoading(false)
      })
    }
  }, [tab, analytics, analyticsLoading])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const callVerifyAPI = async (userId: string, field: string, value: boolean, table = 'creator_profiles') => {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/admin/verify-creator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ userId, field, value, table }),
    })
    return res.ok
  }

  const handleVerifyCreator = async (userId: string, field: 'siret_verified' | 'insurance_verified', value: boolean) => {
    setVerifSaving(`${userId}-${field}`)
    const ok = await callVerifyAPI(userId, field, value)
    if (ok) {
      setCreators(prev => prev.map(c => c.user_id === userId ? { ...c, [field]: value } : c))
      showToast(value ? '✓ Vérifié' : '✓ Révoqué')
    } else {
      showToast('Erreur lors de la mise à jour')
    }
    setVerifSaving(null)
  }

  const handleRefuse = async () => {
    if (!refuseModal) return
    const { userId, field } = refuseModal
    setVerifSaving(`${userId}-${field}`)
    const ok = await callVerifyAPI(userId, field, false)
    if (ok) {
      setRefusedSet(prev => new Set([...prev, `${userId}-${field}`]))
      showToast('✓ Refusé')
    } else {
      showToast('Erreur lors du refus')
    }
    setVerifSaving(null)
    setRefuseModal(null)
  }

  const handleVerifyOrga = async (userId: string, field: 'siret_verified' | 'verification_doc_verified', value: boolean) => {
    setOrgaVerifSaving(`${userId}-${field}`)
    const ok = await callVerifyAPI(userId, field, value, 'organizer_profiles')
    if (ok) {
      setOrgaVerifs(prev => prev.map(o => o.user_id === userId ? { ...o, [field]: value } : o))
      showToast(value ? '✓ Vérifié' : '✓ Révoqué')
    } else {
      showToast('Erreur lors de la mise à jour')
    }
    setOrgaVerifSaving(null)
  }

  const handleBanCreator = async (userId: string, ban: boolean) => {
    await supabase.from('profiles').update({ is_banned: ban }).eq('id', userId)
    setCreators(prev => prev.map(c => c.user_id === userId ? { ...c, profiles: c.profiles ? { ...c.profiles, is_banned: ban } : null } : c))
    showToast(ban ? '✓ Utilisateur banni' : '✓ Utilisateur débanni')
  }

  const handleDiscProposal = async (id: string, status: 'approved' | 'rejected') => {
    setDiscProposalSaving(id)
    await supabase.from('discipline_proposals').update({ status }).eq('id', id)
    setDiscProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setDiscProposalSaving(null)
    showToast(status === 'approved' ? '✓ Discipline approuvée' : '✓ Proposition refusée')
  }

  const handleToggleEventStatus = async (id: string, status: string) => {
    const newStatus = status === 'published' ? 'draft' : 'published'
    await supabase.from('events').update({ status: newStatus }).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e))
    showToast(newStatus === 'published' ? '✓ Marché publié' : '✓ Mis en brouillon')
  }

  const handleDeleteEvent = async (id: string) => {
    setDeletingEvent(id)
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
    setDeletingEvent(null)
    showToast('✓ Marché supprimé')
  }

  const handleMsgSearch = (q: string) => {
    setMsgSearch(q)
    if (msgSearchTimeout) clearTimeout(msgSearchTimeout)
    if (q.length < 2) { setMsgSuggestions([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/search-users?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setMsgSuggestions(json.users || [])
    }, 300)
    setMsgSearchTimeout(t)
  }

  const handleSendMessage = async () => {
    if (!msgRecipient || !msgContent.trim() || !adminId) return
    setMsgSending(true)
    const { data: conv } = await supabase.from('conversations').insert({
      participant_ids: [adminId, msgRecipient.id],
    }).select('id').single()
    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: adminId,
        content: msgContent,
      })
    }
    await supabase.from('admin_messages').insert({
      sender_id: adminId,
      recipient_id: msgRecipient.id,
      subject: msgSubject || null,
      content: msgContent,
    })
    setMsgSending(false)
    setMsgSent(true)
    setMsgContent('')
    setMsgSubject('')
    setMsgRecipient(null)
    setMsgSearch('')
    setTimeout(() => setMsgSent(false), 3000)
    showToast('✓ Message envoyé')
    const { data: msgs } = await supabase
      .from('admin_messages')
      .select('id,content,subject,created_at,read_at,recipient:recipient_id(full_name,avatar_url,role)')
      .eq('sender_id', adminId)
      .order('created_at', { ascending: false })
      .limit(50)
    setAdminMessages((msgs as unknown as AdminMessage[]) ?? [])
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const pendingCreators = creators.filter(c => !c.siret_verified && c.siret_number)
  const pendingOrgas = orgaVerifs.filter(o => !o.siret_verified && !o.verification_doc_verified && (o.siret_number || o.verification_doc_url))
  const pendingDiscs = discProposals.filter(p => p.status === 'pending')
  const pendingReports = reports.filter(r => r.status === 'pending')

  const TABS: { k: AdminTab; label: string; badge?: number }[] = [
    { k: 'analytics',      label: 'Analytiques' },
    { k: 'verifications',  label: 'Vérifications', badge: pendingCreators.length + pendingOrgas.length || undefined },
    { k: 'disciplines',    label: 'Disciplines',   badge: pendingDiscs.length || undefined },
    { k: 'marches',        label: `Marchés (${events.length})` },
    { k: 'messages',       label: `Messages (${adminMessages.length})` },
    { k: 'abonnements',    label: 'Abonnements' },
    { k: 'signalements',   label: 'Signalements',  badge: pendingReports.length || undefined },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#06060F' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#06060F', color: '#F9FAFB' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', height: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="#FFF" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#F9FAFB', letterSpacing: '-0.3px' }}>Nexart Admin</span>
          </div>
          <div style={{ flex: 1 }} />
          <Link href="/profile" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← Retour au profil
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 32px', overflowX: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '2px' }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              padding: '14px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === t.k ? '700' : '500',
              color: tab === t.k ? '#F9FAFB' : '#6B7280',
              borderBottom: tab === t.k ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: '-1px', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {t.label}
              {t.badge ? (
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#6366F1', color: '#FFF' }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>

        {/* ═══════════════════════════════════════ ANALYTICS ════════════════════ */}
        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.2s ease' }}>
            {analyticsLoading || !analytics ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* KPIs Utilisateurs */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Users size={16} color="#9CA3AF" />
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Utilisateurs</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px' }}>
                    {[
                      { label: 'Total',         value: analytics.users.total,      sub: 'comptes créés' },
                      { label: 'Créateurs',      value: analytics.users.creators,   sub: `${analytics.users.total ? Math.round(analytics.users.creators / analytics.users.total * 100) : 0}% du total` },
                      { label: 'Organisateurs',  value: analytics.users.organizers, sub: `${analytics.users.total ? Math.round(analytics.users.organizers / analytics.users.total * 100) : 0}% du total` },
                      { label: 'Cette semaine',  value: analytics.users.new_week,   sub: 'nouveaux inscrits', up: analytics.users.new_week > 0 },
                      { label: 'Ce mois',        value: analytics.users.new_month,  sub: 'nouveaux inscrits' },
                      { label: "Aujourd'hui",    value: analytics.users.new_today,  sub: "inscrits aujourd'hui" },
                    ].map(kpi => (
                      <div key={kpi.label} style={{ padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ fontSize: '28px', fontWeight: '800', color: '#F9FAFB', margin: '0 0 2px', lineHeight: 1 }}>{kpi.value}</p>
                          {'up' in kpi && kpi.up && <ArrowUpRight size={16} color="#6366F1" />}
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#D1D5DB', margin: '0 0 2px' }}>{kpi.label}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{kpi.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Graphique inscriptions */}
                <div style={{ padding: '22px 24px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                    <TrendingUp size={16} color="#9CA3AF" />
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Inscriptions — 30 derniers jours</h3>
                  </div>
                  {analytics.dailySignups.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p>
                  ) : (() => {
                    const max = Math.max(...analytics.dailySignups.map(d => d.count), 1)
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '100px' }}>
                          {analytics.dailySignups.map((d, i) => (
                            <div key={i} title={`${d.date} : ${d.count}`}
                              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                              <div style={{
                                width: '100%', borderRadius: '3px 3px 0 0',
                                height: d.count > 0 ? `${Math.max((d.count / max) * 100, 8)}%` : '2px',
                                backgroundColor: d.count > 0 ? '#6366F1' : 'rgba(255,255,255,0.08)',
                              }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{analytics.dailySignups[0]?.date}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{analytics.dailySignups[analytics.dailySignups.length - 1]?.date}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Événements + Candidatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Événements */}
                  <div style={{ padding: '22px 24px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Calendar size={16} color="#9CA3AF" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Événements</h3>
                      <span style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: '800', color: '#F9FAFB' }}>{analytics.events.total}</span>
                    </div>
                    {[
                      { label: 'Publiés',   value: analytics.events.published },
                      { label: 'Brouillons', value: analytics.events.draft },
                      { label: 'Fermés',    value: analytics.events.closed },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#F9FAFB' }}>{item.value}</span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ height: '100%', width: `${analytics.events.total ? (item.value / analytics.events.total) * 100 : 0}%`, backgroundColor: '#6366F1', borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Candidatures */}
                  <div style={{ padding: '22px 24px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Package size={16} color="#9CA3AF" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Candidatures</h3>
                      <span style={{ marginLeft: 'auto', fontSize: '22px', fontWeight: '800', color: '#F9FAFB' }}>{analytics.applications.total}</span>
                    </div>
                    {[
                      { label: 'En attente', value: analytics.applications.pending },
                      { label: 'Acceptées',  value: analytics.applications.accepted },
                      { label: 'Refusées',   value: analytics.applications.refused },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#F9FAFB' }}>{item.value}</span>
                        </div>
                        <div style={{ height: '5px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                          <div style={{ height: '100%', width: `${analytics.applications.total ? (item.value / analytics.applications.total) * 100 : 0}%`, backgroundColor: '#8B5CF6', borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                    {analytics.applications.total > 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '12px 0 0', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        Taux d&apos;acceptation : <strong style={{ color: '#10B981' }}>{Math.round(analytics.applications.accepted / analytics.applications.total * 100)}%</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* KPIs Business */}
                {analytics.kpi && (
                  <div style={{ padding: '22px 24px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                      <BarChart2 size={16} color="#9CA3AF" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>KPIs Business</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '12px' }}>
                      {[
                        { label: 'MRR', value: `${analytics.kpi.mrr.toFixed(0)} €`, sub: 'revenus mensuels récurrents' },
                        { label: 'GMV', value: `${analytics.kpi.gmv.toFixed(0)} €`, sub: 'volume brut marchandises' },
                        { label: 'ARPU', value: `${analytics.kpi.arpu.toFixed(2)} €`, sub: 'revenu par utilisateur' },
                        { label: 'Conv. Créateurs', value: `${analytics.kpi.conversionCreator.active}/${analytics.kpi.conversionCreator.total}`, sub: 'payants / total' },
                        { label: 'Conv. Orga', value: `${analytics.kpi.conversionOrganizer.active}/${analytics.kpi.conversionOrganizer.total}`, sub: 'payants / total' },
                        { label: 'Fill Rate', value: analytics.kpi.fillRate.total_stands > 0 ? `${Math.round(analytics.kpi.fillRate.filled_stands / analytics.kpi.fillRate.total_stands * 100)}%` : 'N/A', sub: 'stands remplis' },
                      ].map(kpi => (
                        <div key={kpi.label} style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p style={{ fontSize: '20px', fontWeight: '800', color: '#F9FAFB', margin: '0 0 2px', lineHeight: 1 }}>{kpi.value}</p>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#D1D5DB', margin: '0 0 2px' }}>{kpi.label}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{kpi.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════ VÉRIFICATIONS ════════════════ */}
        {tab === 'verifications' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>

            {/* Créateurs */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Créateurs à vérifier</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([
                    { k: 'pending', label: `En attente (${pendingCreators.length})` },
                    { k: 'all', label: `Tous (${creators.filter(c => c.siret_number || c.insurance_doc_url).length})` },
                  ] as const).map(f => (
                    <button key={f.k} onClick={() => setCreatorFilter(f.k)} style={{
                      padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                      backgroundColor: creatorFilter === f.k ? '#6366F1' : 'rgba(255,255,255,0.08)',
                      color: creatorFilter === f.k ? '#FFF' : '#9CA3AF',
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>

              {(() => {
                const list = creatorFilter === 'pending' ? pendingCreators : creators.filter(c => c.siret_number || c.insurance_doc_url)
                if (list.length === 0) return (
                  <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <CheckCircle size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Aucune demande en attente</p>
                  </div>
                )
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {list.map(c => (
                      <div key={c.user_id} style={{ padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {c.profiles?.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={c.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={16} color="#FFF" />}
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>{c.profiles?.full_name ?? 'Créateur'}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'monospace' }}>{c.user_id.slice(0, 8)}…</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleBanCreator(c.user_id, !(c.profiles as { is_banned?: boolean })?.is_banned)}
                            style={{
                              padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: 'transparent',
                              color: (c.profiles as { is_banned?: boolean })?.is_banned ? '#EF4444' : '#9CA3AF',
                            }}>
                            {(c.profiles as { is_banned?: boolean })?.is_banned ? 'Débannir' : 'Bannir'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {/* SIRET */}
                          {(() => {
                            const refused = refusedSet.has(`${c.user_id}-siret_verified`)
                            const status = c.siret_verified ? 'verified' : refused ? 'refused' : 'pending'
                            return (
                              <div style={{ flex: 1, minWidth: '240px', padding: '14px', borderRadius: '10px', border: `1px solid ${status === 'refused' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, backgroundColor: status === 'refused' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>SIRET</p>
                                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                                    backgroundColor: status === 'verified' ? '#374151' : status === 'refused' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                                    color: status === 'verified' ? '#10B981' : status === 'refused' ? '#EF4444' : '#9CA3AF' }}>
                                    {status === 'verified' ? 'Vérifié' : status === 'refused' ? 'Refusé' : 'En attente'}
                                  </span>
                                </div>
                                {c.siret_number ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', letterSpacing: '1px', margin: 0, fontFamily: 'monospace' }}>{c.siret_number}</p>
                                    <a href={`https://pappers.fr/entreprise/${c.siret_number}`} target="_blank" rel="noopener noreferrer"
                                      style={{ fontSize: '11px', color: '#6366F1', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <ExternalLink size={10} /> Pappers
                                    </a>
                                  </div>
                                ) : (
                                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>Non renseigné</p>
                                )}
                                {status === 'pending' && c.siret_number && (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', true)} disabled={verifSaving === `${c.user_id}-siret_verified`}
                                      style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                      <CheckCircle size={12} /> Valider
                                    </button>
                                    <button onClick={() => { setRefuseModal({ userId: c.user_id, field: 'siret_verified', creatorName: c.profiles?.full_name || 'ce créateur' }); setRefuseComment('') }}
                                      style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                      <XCircle size={13} />
                                    </button>
                                  </div>
                                )}
                                {status === 'refused' && (
                                  <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', true)}
                                    style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#D1D5DB', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    Re-examiner
                                  </button>
                                )}
                                {status === 'verified' && (
                                  <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', false)}
                                    style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    Révoquer
                                  </button>
                                )}
                              </div>
                            )
                          })()}

                          {/* RC Pro */}
                          {(() => {
                            const refused = refusedSet.has(`${c.user_id}-insurance_verified`)
                            const status = c.insurance_verified ? 'verified' : refused ? 'refused' : c.insurance_doc_url ? 'doc' : 'none'
                            return (
                              <div style={{ flex: 1, minWidth: '240px', padding: '14px', borderRadius: '10px', border: `1px solid ${status === 'refused' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, backgroundColor: status === 'refused' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <p style={{ fontSize: '12px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>RC Pro</p>
                                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                                    backgroundColor: status === 'verified' ? '#374151' : status === 'refused' ? 'rgba(239,68,68,0.2)' : status === 'doc' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.1)',
                                    color: status === 'verified' ? '#10B981' : status === 'refused' ? '#EF4444' : status === 'doc' ? '#6366F1' : '#6B7280' }}>
                                    {status === 'verified' ? 'Vérifié' : status === 'refused' ? 'Refusé' : status === 'doc' ? 'Doc reçu' : 'Aucun doc'}
                                  </span>
                                </div>
                                {c.insurance_doc_url ? (
                                  <a href={c.insurance_doc_url} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#D1D5DB', textDecoration: 'none', fontWeight: '600', marginBottom: '10px' }}>
                                    <FileText size={13} /> Voir le document <ExternalLink size={11} />
                                  </a>
                                ) : (
                                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>Aucun document</p>
                                )}
                                {status === 'doc' && (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', true)} disabled={verifSaving === `${c.user_id}-insurance_verified`}
                                      style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                      <CheckCircle size={12} /> Valider
                                    </button>
                                    <button onClick={() => { setRefuseModal({ userId: c.user_id, field: 'insurance_verified', creatorName: c.profiles?.full_name || 'ce créateur' }); setRefuseComment('') }}
                                      style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                      <XCircle size={13} />
                                    </button>
                                  </div>
                                )}
                                {status === 'refused' && (
                                  <button onClick={() => setRefusedSet(prev => { const s = new Set(prev); s.delete(`${c.user_id}-insurance_verified`); return s })}
                                    style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: '#D1D5DB', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                    Re-examiner
                                  </button>
                                )}
                                {status === 'verified' && (
                                  <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', false)}
                                    style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    Révoquer
                                  </button>
                                )}
                              </div>
                            )
                          })()}
                        </div>

                        {/* Rôles */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          {(['is_creator', 'is_organizer'] as const).map(field => {
                            const active = !!(c.profiles as { is_creator?: boolean; is_organizer?: boolean })?.[field]
                            const label = field === 'is_creator' ? 'Créateur' : 'Organisateur'
                            return (
                              <button key={field} onClick={async () => {
                                const { data: { session } } = await supabase.auth.getSession()
                                await fetch('/api/admin/set-role', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                                  body: JSON.stringify({ userId: c.user_id, field, value: !active }),
                                })
                                setCreators(prev => prev.map(x => x.user_id === c.user_id
                                  ? { ...x, profiles: x.profiles ? { ...x.profiles, [field]: !active } : x.profiles }
                                  : x
                                ))
                              }} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '5px 12px', borderRadius: '8px', border: '1px solid',
                                borderColor: active ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
                                backgroundColor: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: active ? '#A5B4FC' : '#6B7280',
                                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                              }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: active ? '#818CF8' : '#4B5563', flexShrink: 0 }} />
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Organisateurs */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Organisateurs à vérifier</h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {([
                    { k: 'pending', label: `En attente (${pendingOrgas.length})` },
                    { k: 'all', label: `Tous (${orgaVerifs.filter(o => o.siret_number || o.verification_doc_url).length})` },
                  ] as const).map(f => (
                    <button key={f.k} onClick={() => setOrgaFilter(f.k)} style={{
                      padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                      backgroundColor: orgaFilter === f.k ? '#6366F1' : 'rgba(255,255,255,0.08)',
                      color: orgaFilter === f.k ? '#FFF' : '#9CA3AF',
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>

              {(() => {
                const list = orgaFilter === 'pending' ? pendingOrgas : orgaVerifs.filter(o => o.siret_number || o.verification_doc_url)
                if (list.length === 0) return (
                  <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <CheckCircle size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Aucune demande organisateur en attente</p>
                  </div>
                )
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {list.map(o => (
                      <div key={o.user_id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                            {o.profiles?.avatar_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={o.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <User size={16} color="#FFF" />}
                          </div>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>{o.profiles?.full_name ?? 'Organisateur'}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'monospace' }}>{o.user_id.slice(0, 8)}…</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {o.siret_number && (
                            <div style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SIRET</p>
                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: o.siret_verified ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', color: o.siret_verified ? '#10B981' : '#9CA3AF' }}>
                                  {o.siret_verified ? 'Vérifié' : 'En attente'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#F9FAFB', fontFamily: 'monospace', letterSpacing: '1px', margin: 0 }}>{o.siret_number}</p>
                                <a href={`https://pappers.fr/entreprise/${o.siret_number}`} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: '11px', color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>Pappers →</a>
                              </div>
                              {!o.siret_verified && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleVerifyOrga(o.user_id, 'siret_verified', true)} disabled={orgaVerifSaving === `${o.user_id}-siret_verified`}
                                    style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <CheckCircle size={12} /> Valider
                                  </button>
                                  <button onClick={() => handleVerifyOrga(o.user_id, 'siret_verified', false)} disabled={orgaVerifSaving === `${o.user_id}-siret_verified`}
                                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                    <XCircle size={13} />
                                  </button>
                                </div>
                              )}
                              {o.siret_verified && (
                                <button onClick={() => handleVerifyOrga(o.user_id, 'siret_verified', false)}
                                  style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Révoquer</button>
                              )}
                            </div>
                          )}
                          {o.verification_doc_url && (
                            <div style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document</p>
                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: o.verification_doc_verified ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)', color: o.verification_doc_verified ? '#10B981' : '#6366F1' }}>
                                  {o.verification_doc_verified ? 'Vérifié' : 'Doc reçu'}
                                </span>
                              </div>
                              <a href={o.verification_doc_url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#D1D5DB', textDecoration: 'none', fontWeight: '600', marginBottom: '8px' }}>
                                <FileText size={13} /> Voir le document <ExternalLink size={11} />
                              </a>
                              {!o.verification_doc_verified && (
                                <button onClick={() => handleVerifyOrga(o.user_id, 'verification_doc_verified', true)} disabled={orgaVerifSaving === `${o.user_id}-verification_doc_verified`}
                                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                  <CheckCircle size={12} /> Valider
                                </button>
                              )}
                              {o.verification_doc_verified && (
                                <button onClick={() => handleVerifyOrga(o.user_id, 'verification_doc_verified', false)}
                                  style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Révoquer</button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ DISCIPLINES ══════════════════ */}
        {tab === 'disciplines' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Propositions de disciplines</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pendingDiscs.length} en attente</span>
            </div>
            {discProposals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <LayoutGrid size={32} color="#374151" style={{ marginBottom: '10px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Aucune proposition</p>
              </div>
            ) : discProposals.map(p => (
              <div key={p.id} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                    Par {(p as unknown as { profiles?: { full_name?: string } })?.profiles?.full_name ?? 'Créateur'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {p.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleDiscProposal(p.id, 'approved')} disabled={discProposalSaving === p.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      <CheckCircle size={13} /> Approuver
                    </button>
                    <button onClick={() => handleDiscProposal(p.id, 'rejected')} disabled={discProposalSaving === p.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      <XCircle size={13} /> Refuser
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
                    backgroundColor: p.status === 'approved' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: p.status === 'approved' ? '#10B981' : '#EF4444' }}>
                    {p.status === 'approved' ? 'Approuvée' : 'Refusée'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════ MARCHÉS ══════════════════════ */}
        {tab === 'marches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.2s ease' }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Calendar size={40} color="#374151" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Aucun marché créé</p>
              </div>
            ) : events.map(ev => {
              const sc = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft
              return (
                <div key={ev.id} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#1F2937' }}>
                    {ev.cover_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={ev.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} color="#374151" /></div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                      {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                      {ev.city ? ` · ${ev.city}` : ''}
                      {ev.start_date ? ` · ${new Date(ev.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                    </p>
                    {ev.profiles?.full_name && (
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>par {ev.profiles.full_name}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => handleToggleEventStatus(ev.id, ev.status)} title={ev.status === 'published' ? 'Mettre en brouillon' : 'Publier'}
                      style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {ev.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button onClick={() => { if (window.confirm(`Supprimer "${ev.title}" ?`)) handleDeleteEvent(ev.id) }} disabled={deletingEvent === ev.id} title="Supprimer"
                      style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════ MESSAGES ════════════════════ */}
        {tab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease' }}>

            {/* Composer */}
            <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Send size={16} color="#9CA3AF" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Nouveau message</h3>
              </div>

              {/* Destinataire */}
              <div style={{ marginBottom: '14px', position: 'relative' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destinataire</label>
                {msgRecipient ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.5)', backgroundColor: 'rgba(99,102,241,0.1)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      {msgRecipient.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={msgRecipient.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFF' }}>{msgRecipient.full_name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>{msgRecipient.full_name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>{msgRecipient.role ?? 'utilisateur'}</p>
                    </div>
                    <button onClick={() => { setMsgRecipient(null); setMsgSearch('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Search size={14} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input value={msgSearch} onChange={e => handleMsgSearch(e.target.value)} placeholder="Rechercher par nom…"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.06)', color: '#F9FAFB', boxSizing: 'border-box' }} />
                    {msgSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#111827', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', marginTop: '4px', overflow: 'hidden' }}>
                        {msgSuggestions.map(s => (
                          <button key={s.id} onClick={() => { setMsgRecipient(s); setMsgSearch(s.full_name); setMsgSuggestions([]) }}
                            style={{ width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', color: '#F9FAFB' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {s.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFF' }}>{s.full_name[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{s.full_name}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>{s.role ?? 'utilisateur'}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Objet */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Objet <span style={{ color: 'var(--text-primary)', fontWeight: '400', textTransform: 'none' }}>(optionnel)</span></label>
                <input value={msgSubject} onChange={e => setMsgSubject(e.target.value)} placeholder="Ex : Votre compte a été vérifié"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.06)', color: '#F9FAFB', boxSizing: 'border-box' }} />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Message</label>
                <textarea value={msgContent} onChange={e => setMsgContent(e.target.value)} placeholder="Tapez votre message ici…" rows={4}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', backgroundColor: 'rgba(255,255,255,0.06)', color: '#F9FAFB', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleSendMessage} disabled={msgSending || !msgRecipient || !msgContent.trim()}
                  style={{ padding: '11px 24px', borderRadius: '8px', border: 'none', backgroundColor: msgRecipient && msgContent.trim() ? '#6366F1' : 'rgba(255,255,255,0.08)', color: msgRecipient && msgContent.trim() ? '#FFF' : '#6B7280', fontSize: '14px', fontWeight: '700', cursor: msgRecipient && msgContent.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {msgSending ? (
                    <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Envoi…</>
                  ) : msgSent ? (
                    <><CheckCheck size={15} /> Envoyé !</>
                  ) : (
                    <><Send size={15} /> Envoyer</>
                  )}
                </button>
              </div>
            </div>

            {/* Messages envoyés */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>Envoyés</h3>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontWeight: '600' }}>{adminMessages.length}</span>
              </div>
              {adminMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <MessageSquare size={32} color="#374151" style={{ marginBottom: '10px' }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Aucun message envoyé</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {adminMessages.map(msg => (
                    <div key={msg.id} style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {msg.recipient?.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={msg.recipient.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>{msg.recipient?.full_name?.[0]?.toUpperCase() ?? '?'}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#F9FAFB' }}>{msg.recipient?.full_name ?? 'Utilisateur'}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px', textTransform: 'capitalize' }}>{msg.recipient?.role ?? ''}</span>
                            {msg.subject && <p style={{ fontSize: '12px', fontWeight: '600', color: '#D1D5DB', margin: '2px 0 0' }}>{msg.subject}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {msg.read_at ? <CheckCheck size={13} color="#10B981" /> : <Clock size={13} color="#6B7280" />}
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ ABONNEMENTS ═════════════════ */}
        {tab === 'abonnements' && (
          <div style={{ animation: 'fadeIn 0.2s ease' }}>
            <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#F9FAFB', margin: '0 0 18px' }}>Modifier l&apos;abonnement d&apos;un utilisateur</h3>

              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input value={subSearch} onChange={async e => {
                  const q = e.target.value
                  setSubSearch(q)
                  if (q.length < 2) { setSubResults([]); return }
                  setSubSearching(true)
                  try {
                    const res = await fetch(`/api/admin/search-users?q=${encodeURIComponent(q)}`)
                    const json = await res.json()
                    setSubResults(json.users || [])
                  } catch { setSubResults([]) }
                  setSubSearching(false)
                }} placeholder="Rechercher un utilisateur par nom…"
                  style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '14px', fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.06)', color: '#F9FAFB', boxSizing: 'border-box' }} />
                {subSearching && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
              </div>

              {subToast && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#10B981', fontWeight: '600', margin: 0 }}>{subToast}</p>
                </div>
              )}

              {subResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {subResults.map(u => {
                    const TIERS = [
                      { value: 'free', label: 'Gratuit', role: 'creator' },
                      { value: 'boost', label: 'Boost — 5,99€', role: 'creator' },
                      { value: 'pro', label: 'Pro — 14,99€', role: 'creator' },
                      { value: 'premium', label: 'Premium — 29,99€', role: 'creator' },
                      { value: 'org_pro', label: 'Org Pro — 29€', role: 'organizer' },
                      { value: 'org_studio', label: 'Org Studio — 79€', role: 'organizer' },
                    ]
                    const relevantTiers = u.role === 'organizer'
                      ? TIERS.filter(t => t.role === 'organizer' || t.value === 'free')
                      : TIERS.filter(t => t.role === 'creator')
                    const currentTier = u.subscription_tier || 'free'
                    const TIER_COLORS: Record<string, string> = {
                      free: '#9CA3AF', boost: '#6366F1', pro: '#8B5CF6',
                      premium: '#EC4899', org_pro: '#0EA5E9', org_studio: '#F59E0B',
                    }
                    return (
                      <div key={u.id} style={{ padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>{u.full_name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: '#F9FAFB', margin: '0 0 3px' }}>{u.full_name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{u.role}</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: TIER_COLORS[currentTier] || '#9CA3AF', backgroundColor: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: '99px' }}>
                              {currentTier}
                            </span>
                          </div>
                        </div>
                        <select value={currentTier} onChange={async e => {
                          const newTier = e.target.value
                          setSubSaving(u.id)
                          const res = await fetch('/api/admin/set-tier', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: u.id, tier: newTier }) })
                          if (res.ok) {
                            setSubResults(prev => prev.map(x => x.id === u.id ? { ...x, subscription_tier: newTier } : x))
                            setSubToast(`✓ Abonnement de ${u.full_name} changé en "${newTier}"`)
                            setTimeout(() => setSubToast(null), 3000)
                          }
                          setSubSaving(null)
                        }} disabled={subSaving === u.id}
                          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.08)', color: '#F9FAFB', cursor: 'pointer', minWidth: '180px' }}>
                          {relevantTiers.map(t => <option key={t.value} value={t.value} style={{ backgroundColor: '#111827' }}>{t.label}</option>)}
                        </select>
                        {subSaving === u.id && <div style={{ width: '16px', height: '16px', border: '2px solid rgba(99,102,241,0.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                      </div>
                    )
                  })}
                </div>
              )}

              {subSearch.length >= 2 && !subSearching && subResults.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Aucun utilisateur trouvé</p>
              )}

              <div style={{ marginTop: '18px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <p style={{ fontSize: '12px', color: '#F59E0B', margin: 0, lineHeight: 1.5 }}>
                  ⚠️ Ces changements sont immédiats. Ils ne créent pas d&apos;abonnement Stripe — uniquement une mise à jour manuelle en base.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════ SIGNALEMENTS ════════════════ */}
        {tab === 'signalements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F9FAFB', margin: 0 }}>
                Signalements <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>({pendingReports.length} en attente)</span>
              </h3>
            </div>
            {!reportsLoaded ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366F1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <AlertTriangle size={36} color="#374151" style={{ marginBottom: '10px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Aucun signalement</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reports.map(r => (
                  <div key={r.id} style={{
                    padding: '14px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px',
                    border: `1px solid ${r.status === 'pending' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    backgroundColor: r.status === 'pending' ? 'rgba(245,158,11,0.12)' : '#111827',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#F9FAFB', margin: '0 0 2px' }}>
                        {r.target_type === 'creator' ? 'Créateur' : r.target_type === 'event' ? 'Événement' : 'Post'} signalé
                        <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '6px' }}>par {r.reporter?.full_name || 'utilisateur'}</span>
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 2px' }}>{r.reason}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={async () => {
                            await supabase.from('reports').update({ status: 'reviewed' }).eq('id', r.id)
                            setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'reviewed' } : x))
                          }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.15)', fontSize: '12px', fontWeight: '600', color: '#6EE7B7', cursor: 'pointer' }}>
                            Vu
                          </button>
                          <button onClick={async () => {
                            await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id)
                            setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'dismissed' } : x))
                          }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            Ignorer
                          </button>
                        </>
                      )}
                      {r.status !== 'pending' && (
                        <span style={{ fontSize: '12px', fontWeight: '600', color: r.status === 'reviewed' ? '#10B981' : '#6B7280', padding: '4px 8px', borderRadius: '6px', backgroundColor: r.status === 'reviewed' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)' }}>
                          {r.status === 'reviewed' ? 'Traité' : 'Ignoré'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Modale refus ── */}
      {refuseModal && (
        <div onClick={() => setRefuseModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 9000, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#F9FAFB', margin: '0 0 8px' }}>Refuser la vérification</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              Refuser {refuseModal.field === 'siret_verified' ? 'le SIRET' : 'la RC Pro'} de <strong style={{ color: '#F9FAFB' }}>{refuseModal.creatorName}</strong>
            </p>
            <textarea value={refuseComment} onChange={e => setRefuseComment(e.target.value)} placeholder="Raison du refus (optionnel)…" rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'rgba(255,255,255,0.06)', color: '#F9FAFB', resize: 'none', boxSizing: 'border-box', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRefuseModal(null)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleRefuse} style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: '#FFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.4)', color: '#F9FAFB', fontSize: '14px', fontWeight: '600', zIndex: 9999, animation: 'fadeIn 0.2s ease', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
