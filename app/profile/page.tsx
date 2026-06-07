'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  User, Mail, MapPin, AtSign, Globe, Edit3, Save, X,
  Star, CheckCircle, Calendar, LogOut, Upload, ExternalLink,
  Shield, FileText, XCircle, Trash2, Eye, EyeOff,
  TrendingUp, Users, BarChart2, MessageSquare, Package, CreditCard, ArrowUpRight,
  Send, Search, CheckCheck, Clock,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PortfolioGridEditor, type GridItem } from '@/components/portfolio-grid-editor'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string; bio: string | null; avatar_url: string | null
  role: string | null; is_admin: boolean
}
type CreatorProfile = {
  disciplines: string[]; city: string | null; region: string | null
  travel_radius: string | null; portfolio_images: string[]
  website: string | null; instagram: string | null; etsy: string | null
  siret_verified: boolean; insurance_verified: boolean
}
type Application = {
  id: string; status: string; created_at: string; message: string | null
  events: { title: string; city: string | null; start_date: string; cover_image: string | null } | null
}
type Review = {
  id: string; rating: number; comment: string | null; tags: string[] | null; created_at: string
  profiles: { full_name: string } | null
}
type AdminCreator = {
  user_id: string; siret_number: string | null
  siret_verified: boolean; insurance_verified: boolean; insurance_doc_url: string | null
  profiles: { full_name: string; avatar_url: string | null } | null
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINES = [
  'Tatouage','Céramique','Gravure','Joaillerie','Bijoux','Illustration',
  'Textile','Maroquinerie','Sculpture','Photographie','Peinture','Poterie',
  'Broderie','Lutherie','Verrerie','Reliure','Cosmétique naturelle','Savonnerie',
  'Coutellerie','Bougies','Macramé','Origami','Calligraphie','Sérigraphie',
]
const RADIUS_LABELS: Record<string, string> = {
  '5': '5 km', '10': '10 km', '25': '25 km', national: 'France entière',
}
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: '#F59E0B', bg: '#FFFBEB' },
  accepted:  { label: 'Acceptée',   color: '#10B981', bg: '#ECFDF5' },
  refused:   { label: 'Refusée',    color: '#EF4444', bg: '#FEF2F2' },
  draft:     { label: 'Brouillon',  color: '#9CA3AF', bg: '#F3F4F6' },
  published: { label: 'Publié',     color: '#10B981', bg: '#ECFDF5' },
  closed:    { label: 'Fermé',      color: '#6366F1', bg: '#EEF2FF' },
}
const EVENT_TYPE_LABELS: Record<string, string> = {
  permanent: 'Permanent', seasonal: 'Saisonnier',
  popup: 'Pop-up', salon: 'Salon', fair: 'Foire',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} fill={i <= n ? '#F59E0B' : 'none'} color={i <= n ? '#F59E0B' : '#D1D5DB'} />
      ))}
    </span>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      backgroundColor: ok ? '#ECFDF5' : '#F3F4F6',
      color: ok ? '#059669' : '#9CA3AF',
    }}>
      <CheckCircle size={12} fill={ok ? '#059669' : 'none'} color={ok ? '#059669' : '#9CA3AF'} />
      {label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Creator state
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [gridItems, setGridItems] = useState<GridItem[]>([])
  const [tab, setTab] = useState<'profil' | 'portfolio' | 'candidatures' | 'avis'>('profil')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editRadius, setEditRadius] = useState('')
  const [editDisc, setEditDisc] = useState<string[]>([])
  const [editInstagram, setEditInstagram] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editEtsy, setEditEtsy] = useState('')
  const [editSiret, setEditSiret] = useState(false)
  const [editInsurance, setEditInsurance] = useState(false)
  const [siretNumber, setSiretNumber] = useState('')
  const [siretChecking, setSiretChecking] = useState(false)
  const [siretResult, setSiretResult] = useState<{ valid: boolean; nom?: string; error?: string } | null>(null)
  const rcProRef = useRef<HTMLInputElement>(null)
  const [rcProUploading, setRcProUploading] = useState(false)

  // Admin state
  const [adminTab, setAdminTab] = useState<'analytics' | 'verifications' | 'marches' | 'messages'>('analytics')
  const [adminCreators, setAdminCreators] = useState<AdminCreator[]>([])
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([])
  const [adminFilter, setAdminFilter] = useState<'pending' | 'all'>('pending')
  const [adminSaving, setAdminSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Admin messaging state
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [msgSearch, setMsgSearch] = useState('')
  const [msgSuggestions, setMsgSuggestions] = useState<UserSuggestion[]>([])
  const [msgRecipient, setMsgRecipient] = useState<UserSuggestion | null>(null)
  const [msgSubject, setMsgSubject] = useState('')
  const [msgContent, setMsgContent] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const u = session.user
      setUser(u)

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name,bio,avatar_url,role,is_admin')
        .eq('id', u.id)
        .single()

      setProfile(prof as Profile)

      if (prof?.is_admin) {
        const [{ data: creators }, { data: events }, analyticsRes] = await Promise.all([
          supabase.from('creator_profiles')
            .select('user_id,siret_number,siret_verified,insurance_verified,insurance_doc_url,profiles(full_name,avatar_url)')
            .order('user_id'),
          supabase.from('events')
            .select('id,title,city,start_date,event_type,status,cover_image,stand_count,stand_price,profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(50),
          fetch('/api/admin/analytics').then(r => r.json()),
        ])
        setAdminCreators((creators as unknown as AdminCreator[]) ?? [])
        setAdminEvents((events as unknown as AdminEvent[]) ?? [])
        setAnalytics(analyticsRes as Analytics)
        // Load sent messages
        const { data: msgs } = await supabase
          .from('admin_messages')
          .select('id,content,subject,created_at,read_at,recipient:recipient_id(full_name,avatar_url,role)')
          .eq('sender_id', u.id)
          .order('created_at', { ascending: false })
          .limit(50)
        setAdminMessages((msgs as unknown as AdminMessage[]) ?? [])
      } else {
        const [{ data: creat }, { data: apps }, { data: revs }] = await Promise.all([
          supabase.from('creator_profiles').select('*').eq('user_id', u.id).single(),
          supabase.from('applications').select('id,status,created_at,message,events(title,city,start_date,cover_image)').eq('creator_id', u.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('reviews').select('id,rating,comment,tags,created_at,profiles(full_name)').eq('reviewed_id', u.id).order('created_at', { ascending: false }).limit(20),
        ])
        setCreator(creat)
        if (creat?.portfolio_grid) setGridItems(creat.portfolio_grid as GridItem[])
        else if (creat?.portfolio_images?.length) setGridItems(creat.portfolio_images.map((url: string) => ({ url, colSpan: 1 as const, rowSpan: 1 as const })))
        setApplications((apps as unknown as Application[]) ?? [])
        setReviews((revs as unknown as Review[]) ?? [])
        setEditName(prof?.full_name ?? u.user_metadata?.full_name ?? '')
        setEditBio(prof?.bio ?? '')
        setEditCity(creat?.city ?? '')
        setEditRegion(creat?.region ?? '')
        setEditRadius(creat?.travel_radius ?? '25')
        setEditDisc(creat?.disciplines ?? [])
        setEditInstagram(creat?.instagram ?? '')
        setEditWebsite(creat?.website ?? '')
        setEditEtsy(creat?.etsy ?? '')
        setEditSiret(creat?.siret_verified ?? false)
        setEditInsurance(creat?.insurance_verified ?? false)
        setSiretNumber((creat as Record<string, unknown>)?.siret_number as string ?? '')
      }
      setLoading(false)
    })
  }, [router])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Creator handlers ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await Promise.all([
      supabase.from('profiles').upsert({ id: user.id, full_name: editName, bio: editBio }),
      supabase.from('creator_profiles').upsert({
        user_id: user.id, disciplines: editDisc,
        city: editCity, region: editRegion, travel_radius: editRadius,
        instagram: editInstagram, website: editWebsite, etsy: editEtsy,
        siret_verified: editSiret, insurance_verified: editInsurance,
      }),
    ])
    setProfile(p => p ? { ...p, full_name: editName, bio: editBio } : p)
    setCreator(c => c ? { ...c, disciplines: editDisc, city: editCity, region: editRegion, travel_radius: editRadius, instagram: editInstagram, website: editWebsite, etsy: editEtsy, siret_verified: editSiret, insurance_verified: editInsurance } : c)
    setSaving(false)
    setEditing(false)
  }

  const handleCheckSiret = async () => {
    if (!user || siretNumber.length !== 14) return
    setSiretChecking(true)
    setSiretResult(null)
    const res = await fetch(`/api/verify-siret?siret=${siretNumber}`)
    const data = await res.json()
    if (data.valid) {
      setSiretResult({ valid: true, nom: data.nom })
      await supabase.from('creator_profiles').upsert({ user_id: user.id, siret_number: siretNumber, siret_verified: false })
      setCreator(c => c ? { ...c, siret_verified: false } : c)
    } else {
      setSiretResult({ valid: false, error: data.error })
    }
    setSiretChecking(false)
  }

  const handleRcProUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setRcProUploading(true)
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage.from('insurance-docs').upload(`${user.id}/rc-pro.${ext}`, file, { upsert: true })
    if (!error) {
      await supabase.from('creator_profiles').update({ insurance_verified: true }).eq('user_id', user.id)
      setCreator(c => c ? { ...c, insurance_verified: true } : c)
      setEditInsurance(true)
    }
    setRcProUploading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setProfile(p => p ? { ...p, avatar_url: data.publicUrl } : p)
    }
    setAvatarUploading(false)
  }

  const toggleDisc = (d: string) =>
    setEditDisc(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  // ─── Admin handlers ─────────────────────────────────────────────────────────

  const handleVerifyCreator = async (userId: string, field: 'siret_verified' | 'insurance_verified', value: boolean) => {
    setAdminSaving(`${userId}-${field}`)
    await supabase.from('creator_profiles').update({ [field]: value }).eq('user_id', userId)
    setAdminCreators(prev => prev.map(c => c.user_id === userId ? { ...c, [field]: value } : c))
    setAdminSaving(null)
    showToast(value ? '✓ Vérifié' : '✗ Révoqué')
  }

  const loadAdminMessages = async () => {
    if (!user) return
    const { data } = await supabase
      .from('admin_messages')
      .select('id,content,subject,created_at,read_at,recipient:recipient_id(full_name,avatar_url,role)')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setAdminMessages((data as unknown as AdminMessage[]) ?? [])
  }

  const handleMsgSearch = (val: string) => {
    setMsgSearch(val)
    setMsgRecipient(null)
    if (searchTimeout) clearTimeout(searchTimeout)
    if (val.trim().length < 2) { setMsgSuggestions([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,full_name,avatar_url,role')
        .ilike('full_name', `%${val.trim()}%`)
        .neq('is_admin', true)
        .limit(6)
      setMsgSuggestions((data as UserSuggestion[]) ?? [])
    }, 300)
    setSearchTimeout(t)
  }

  const handleSendMessage = async () => {
    if (!user || !msgRecipient || !msgContent.trim()) return
    setMsgSending(true)
    const { error } = await supabase.from('admin_messages').insert({
      sender_id: user.id,
      recipient_id: msgRecipient.id,
      subject: msgSubject.trim() || null,
      content: msgContent.trim(),
    })
    if (!error) {
      setMsgSent(true)
      setMsgContent('')
      setMsgSubject('')
      setMsgRecipient(null)
      setMsgSearch('')
      showToast('✉ Message envoyé')
      await loadAdminMessages()
      setTimeout(() => setMsgSent(false), 3000)
    }
    setMsgSending(false)
  }

  const handleToggleEventStatus = async (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    setAdminSaving(eventId)
    await supabase.from('events').update({ status: newStatus }).eq('id', eventId)
    setAdminEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e))
    setAdminSaving(null)
    showToast(newStatus === 'published' ? '✓ Événement publié' : '✓ Mis en brouillon')
  }

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingEvent(eventId)
    await supabase.from('events').delete().eq('id', eventId)
    setAdminEvents(prev => prev.filter(e => e.id !== eventId))
    setDeletingEvent(null)
    showToast('🗑 Événement supprimé')
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const name = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Utilisateur'
  const firstName = name.split(' ')[0]
  const isAdmin = profile?.is_admin === true
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  // ──────────────────────────────────────────────────────────────────────────────
  // ADMIN DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────────

  if (isAdmin) {
    const pendingCreators = adminCreators.filter(c =>
      (!c.siret_verified && c.siret_number) || (!c.insurance_verified && c.insurance_doc_url)
    )
    const displayedCreators = adminFilter === 'pending' ? pendingCreators : adminCreators

    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 16px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* ── Header Admin ── */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', overflow: 'hidden', border: '3px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profile?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '32px', fontWeight: '800', color: '#FFF' }}>{firstName[0]?.toUpperCase()}</span>
                }
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#6366F1', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {avatarUploading ? <div style={{ width: '10px', height: '10px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Upload size={11} color="#FFF" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>{name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#FFF', fontSize: '12px', fontWeight: '700' }}>
                  <Shield size={12} /> Administrateur
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#888888', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {user?.email}
              </p>
            </div>

            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LogOut size={15} /> Déconnexion
            </button>
          </div>

          {/* ── Stats ── */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { label: 'Créateurs', value: adminCreators.length, color: '#6366F1', bg: '#EEF2FF' },
              { label: 'SIRET en attente', value: adminCreators.filter(c => !c.siret_verified && c.siret_number).length, color: '#F59E0B', bg: '#FFFBEB' },
              { label: 'RC Pro en attente', value: adminCreators.filter(c => !c.insurance_verified && c.insurance_doc_url).length, color: '#EF4444', bg: '#FEF2F2' },
              { label: 'Marchés publiés', value: adminEvents.filter(e => e.status === 'published').length, color: '#10B981', bg: '#ECFDF5' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: '140px', padding: '16px 20px', borderRadius: '12px', backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>
                <p style={{ fontSize: '28px', fontWeight: '800', color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, fontWeight: '600' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E5E7EB', marginBottom: '28px' }}>
            {([
              { k: 'analytics', label: 'Analytiques' },
              { k: 'verifications', label: `Vérifications${pendingCreators.length > 0 ? ` (${pendingCreators.length})` : ''}` },
              { k: 'marches', label: `Marchés (${adminEvents.length})` },
              { k: 'messages', label: `Messages${adminMessages.length > 0 ? ` (${adminMessages.length})` : ''}` },
            ] as const).map(t => (
              <button key={t.k} onClick={() => {
                setAdminTab(t.k)
                if (t.k === 'analytics' && !analytics && !analyticsLoading) {
                  setAnalyticsLoading(true)
                  fetch('/api/admin/analytics').then(r => r.json()).then(d => { setAnalytics(d); setAnalyticsLoading(false) })
                }
              }}
                style={{
                  padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                  fontSize: '14px', fontWeight: adminTab === t.k ? '700' : '500',
                  color: adminTab === t.k ? '#6366F1' : '#888888',
                  borderBottom: adminTab === t.k ? '2px solid #6366F1' : '2px solid transparent',
                  marginBottom: '-2px',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Analytiques ── */}
          {adminTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {analyticsLoading || !analytics ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
                  <div style={{ width: '36px', height: '36px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <>
                  {/* KPIs Utilisateurs */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Users size={16} color="#6366F1" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Utilisateurs</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                      {[
                        { label: 'Total', value: analytics.users.total, color: '#6366F1', bg: '#EEF2FF', sub: 'comptes créés' },
                        { label: 'Créateurs', value: analytics.users.creators, color: '#8B5CF6', bg: '#F5F3FF', sub: `${analytics.users.total ? Math.round(analytics.users.creators / analytics.users.total * 100) : 0}% du total` },
                        { label: 'Organisateurs', value: analytics.users.organizers, color: '#06B6D4', bg: '#ECFEFF', sub: `${analytics.users.total ? Math.round(analytics.users.organizers / analytics.users.total * 100) : 0}% du total` },
                        { label: 'Cette semaine', value: analytics.users.new_week, color: '#10B981', bg: '#ECFDF5', sub: 'nouveaux inscrits', up: analytics.users.new_week > 0 },
                        { label: 'Ce mois', value: analytics.users.new_month, color: '#F59E0B', bg: '#FFFBEB', sub: 'nouveaux inscrits' },
                        { label: "Aujourd'hui", value: analytics.users.new_today, color: '#EF4444', bg: '#FEF2F2', sub: 'inscrits aujourd\'hui' },
                      ].map(kpi => (
                        <div key={kpi.label} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: kpi.bg, border: `1px solid ${kpi.color}22` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '26px', fontWeight: '800', color: kpi.color, margin: '0 0 2px', lineHeight: 1 }}>{kpi.value}</p>
                            {kpi.up && <ArrowUpRight size={16} color="#10B981" />}
                          </div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 2px' }}>{kpi.label}</p>
                          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>{kpi.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Croissance 30 jours */}
                  <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <TrendingUp size={16} color="#6366F1" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Inscriptions — 30 derniers jours</h3>
                    </div>
                    {analytics.dailySignups.length === 0 ? (
                      <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p>
                    ) : (() => {
                      const max = Math.max(...analytics.dailySignups.map(d => d.count), 1)
                      return (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '100px' }}>
                            {analytics.dailySignups.map((d, i) => (
                              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0', height: '100%', justifyContent: 'flex-end', position: 'relative' }}
                                title={`${d.date} : ${d.count} inscription${d.count > 1 ? 's' : ''}`}>
                                <div style={{
                                  width: '100%', borderRadius: '3px 3px 0 0',
                                  height: d.count > 0 ? `${Math.max((d.count / max) * 100, 8)}%` : '2px',
                                  backgroundColor: d.count > 0 ? '#6366F1' : '#E5E7EB',
                                  transition: 'height 0.3s ease',
                                }} />
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{analytics.dailySignups[0]?.date}</span>
                            <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{analytics.dailySignups[analytics.dailySignups.length - 1]?.date}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Événements + Candidatures */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                    {/* Événements */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Calendar size={16} color="#6366F1" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Événements</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: '800', color: '#6366F1' }}>{analytics.events.total}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { label: 'Publiés', value: analytics.events.published, color: '#10B981' },
                          { label: 'Brouillons', value: analytics.events.draft, color: '#9CA3AF' },
                          { label: 'Fermés', value: analytics.events.closed, color: '#6366F1' },
                        ].map(item => {
                          const pct = analytics.events.total ? (item.value / analytics.events.total) * 100 : 0
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#4B5563' }}>{item.label}</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.value}</span>
                              </div>
                              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: item.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                        {analytics.eventTypes.length > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Par type</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {analytics.eventTypes.map(et => (
                                <span key={et.event_type} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#EEF2FF', color: '#6366F1', fontWeight: '600' }}>
                                  {et.event_type} · {et.count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Candidatures */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Package size={16} color="#6366F1" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Candidatures</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: '800', color: '#6366F1' }}>{analytics.applications.total}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { label: 'En attente', value: analytics.applications.pending, color: '#F59E0B' },
                          { label: 'Acceptées', value: analytics.applications.accepted, color: '#10B981' },
                          { label: 'Refusées', value: analytics.applications.refused, color: '#EF4444' },
                        ].map(item => {
                          const pct = analytics.applications.total ? (item.value / analytics.applications.total) * 100 : 0
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#4B5563' }}>{item.label}</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.value}</span>
                              </div>
                              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: item.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                        {analytics.applications.total > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                              Taux d&apos;acceptation : <strong style={{ color: '#10B981' }}>
                                {Math.round(analytics.applications.accepted / analytics.applications.total * 100)}%
                              </strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vérifications + Messages */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                    {/* Vérifications */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Shield size={16} color="#6366F1" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Vérifications</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          { label: 'SIRET vérifié', ok: analytics.verifications.siret_verified, pending: analytics.verifications.siret_pending, total: analytics.verifications.total },
                          { label: 'RC Pro valide', ok: analytics.verifications.insurance_verified, pending: analytics.verifications.insurance_pending, total: analytics.verifications.total },
                        ].map(v => {
                          const pct = v.total ? (v.ok / v.total) * 100 : 0
                          return (
                            <div key={v.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: '#4B5563' }}>{v.label}</span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{v.ok}/{v.total} · {v.pending > 0 && <span style={{ color: '#F59E0B', fontWeight: '700' }}>{v.pending} en attente</span>}</span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366F1, #10B981)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Messages + Abonnements */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <MessageSquare size={16} color="#6366F1" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Activité</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
                          <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: '600' }}>Messages envoyés</span>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: '#6366F1' }}>{analytics.messages.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
                          <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: '600' }}>Ratio créateurs/orga</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#8B5CF6' }}>
                            {analytics.users.organizers > 0
                              ? `${Math.round(analytics.users.creators / analytics.users.organizers * 10) / 10}:1`
                              : '—'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── KPI Business ── */}
                  {analytics.kpi && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <BarChart2 size={16} color="#6366F1" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>KPI Business</h3>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        {(() => {
                          const k = analytics.kpi
                          const convCr = k.conversionCreator.total > 0
                            ? Math.round(k.conversionCreator.active / k.conversionCreator.total * 100) : 0
                          const convOrg = k.conversionOrganizer.total > 0
                            ? Math.round(k.conversionOrganizer.active / k.conversionOrganizer.total * 100) : 0
                          const fill = k.fillRate.total_stands > 0
                            ? Math.round(k.fillRate.filled_stands / k.fillRate.total_stands * 100) : 0
                          const liq = k.liquidity.avg_hours !== null ? k.liquidity.avg_hours : null
                          const ret = k.retention30.cohort_total > 0
                            ? Math.round(k.retention30.retained / k.retention30.cohort_total * 100) : null

                          return [
                            { label: 'Conversion créateurs', value: `${convCr}%`, sub: `${k.conversionCreator.active}/${k.conversionCreator.total} actifs`, color: '#6366F1', bg: '#EEF2FF', target: '> 40 %' },
                            { label: 'Conversion organisateurs', value: `${convOrg}%`, sub: `${k.conversionOrganizer.active}/${k.conversionOrganizer.total} actifs`, color: '#06B6D4', bg: '#ECFEFF', target: '> 60 %' },
                            { label: 'Taux de remplissage', value: `${fill}%`, sub: `${k.fillRate.filled_stands}/${k.fillRate.total_stands} stands`, color: '#10B981', bg: '#ECFDF5', target: '> 70 %' },
                            { label: 'Liquidité marketplace', value: liq !== null ? `${liq}h` : '—', sub: liq !== null ? '1ère candidature' : 'Pas de données', color: '#F59E0B', bg: '#FFFBEB', target: '< 48h' },
                            { label: 'Rétention J30', value: ret !== null ? `${ret}%` : '—', sub: ret !== null ? `${k.retention30.retained}/${k.retention30.cohort_total}` : 'Cohorte vide', color: '#8B5CF6', bg: '#F5F3FF', target: '> 40 %' },
                          ].map(kpi => (
                            <div key={kpi.label} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: kpi.bg, border: `1px solid ${kpi.color}22` }}>
                              <p style={{ fontSize: '22px', fontWeight: '800', color: kpi.color, margin: '0 0 2px', lineHeight: 1 }}>{kpi.value}</p>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 2px' }}>{kpi.label}</p>
                              <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '0 0 4px' }}>{kpi.sub}</p>
                              <p style={{ fontSize: '10px', color: kpi.color, fontWeight: '600', margin: 0 }}>Cible : {kpi.target}</p>
                            </div>
                          ))
                        })()}
                      </div>

                      <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px dashed #E5E7EB', backgroundColor: '#FAFAFA', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <CreditCard size={15} color="#9CA3AF" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#6B7280' }}>KPI financiers (Stripe requis)</span>
                        {['MRR', 'GMV', 'ARPU', 'Churn', 'LTV/CAC'].map(f => (
                          <span key={f} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>
          )}

          {/* ── Tab: Vérifications ── */}
          {adminTab === 'verifications' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {([
                  { k: 'pending', label: `En attente (${pendingCreators.length})` },
                  { k: 'all', label: `Tous (${adminCreators.length})` },
                ] as const).map(f => (
                  <button key={f.k} onClick={() => setAdminFilter(f.k)}
                    style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: adminFilter === f.k ? '#6366F1' : '#F3F4F6', color: adminFilter === f.k ? '#FFF' : '#4B5563' }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {displayedCreators.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                  <CheckCircle size={40} color="#10B981" style={{ marginBottom: '12px' }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>Tout est vérifié ✓</p>
                  <p style={{ fontSize: '14px', color: '#888' }}>Aucune demande en attente.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {displayedCreators.map(c => (
                    <div key={c.user_id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {c.profiles?.avatar_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={c.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <User size={18} color="#FFF" />
                          }
                        </div>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>{c.profiles?.full_name ?? 'Créateur'}</p>
                          <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, fontFamily: 'monospace' }}>{c.user_id.slice(0, 8)}…</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                        {/* SIRET block */}
                        <div style={{ flex: 1, minWidth: '240px', padding: '14px', borderRadius: '10px', border: `1px solid ${c.siret_verified ? '#A7F3D0' : '#FDE68A'}`, backgroundColor: c.siret_verified ? '#ECFDF5' : '#FFFBEB' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>SIRET</p>
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: c.siret_verified ? '#059669' : '#F59E0B', color: '#FFF' }}>
                              {c.siret_verified ? 'Vérifié' : 'En attente'}
                            </span>
                          </div>
                          {c.siret_number
                            ? <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', letterSpacing: '1px', margin: '0 0 10px', fontFamily: 'monospace' }}>{c.siret_number}</p>
                            : <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 10px' }}>Non renseigné</p>
                          }
                          {!c.siret_verified && c.siret_number && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', true)}
                                disabled={adminSaving === `${c.user_id}-siret_verified`}
                                style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: '#059669', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> Valider
                              </button>
                              <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', false)}
                                disabled={adminSaving === `${c.user_id}-siret_verified`}
                                style={{ padding: '7px 10px', borderRadius: '7px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '12px', cursor: 'pointer' }}>
                                <XCircle size={13} />
                              </button>
                            </div>
                          )}
                          {c.siret_verified && (
                            <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', false)}
                              style={{ fontSize: '11px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              Révoquer
                            </button>
                          )}
                        </div>

                        {/* RC Pro block */}
                        <div style={{ flex: 1, minWidth: '240px', padding: '14px', borderRadius: '10px', border: `1px solid ${c.insurance_verified ? '#A7F3D0' : c.insurance_doc_url ? '#FDE68A' : '#E5E7EB'}`, backgroundColor: c.insurance_verified ? '#ECFDF5' : c.insurance_doc_url ? '#FFFBEB' : '#FAFAFA' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>RC Pro</p>
                            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: c.insurance_verified ? '#059669' : c.insurance_doc_url ? '#F59E0B' : '#E5E7EB', color: c.insurance_verified || c.insurance_doc_url ? '#FFF' : '#9CA3AF' }}>
                              {c.insurance_verified ? 'Vérifié' : c.insurance_doc_url ? 'Doc reçu' : 'Aucun doc'}
                            </span>
                          </div>
                          {c.insurance_doc_url ? (
                            <a href={c.insurance_doc_url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6366F1', textDecoration: 'none', fontWeight: '600', marginBottom: '10px' }}>
                              <FileText size={13} /> Voir le document <ExternalLink size={11} />
                            </a>
                          ) : (
                            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 10px' }}>Aucun document</p>
                          )}
                          {!c.insurance_verified && c.insurance_doc_url && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', true)}
                                disabled={adminSaving === `${c.user_id}-insurance_verified`}
                                style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: '#059669', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <CheckCircle size={12} /> Valider
                              </button>
                              <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', false)}
                                disabled={adminSaving === `${c.user_id}-insurance_verified`}
                                style={{ padding: '7px 10px', borderRadius: '7px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '12px', cursor: 'pointer' }}>
                                <XCircle size={13} />
                              </button>
                            </div>
                          )}
                          {c.insurance_verified && (
                            <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', false)}
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

          {/* ── Tab: Marchés ── */}
          {adminTab === 'marches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {adminEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                  <Calendar size={40} color="#D1D5DB" style={{ marginBottom: '12px' }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>Aucun marché créé</p>
                </div>
              ) : adminEvents.map(ev => {
                const sc = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft
                return (
                  <div key={ev.id} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: '#E5E7EB' }}>
                      {ev.cover_image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={ev.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#6366F1,#818CF8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} color="#FFF" /></div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                        {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                        {ev.city ? ` · ${ev.city}` : ''}
                        {ev.start_date ? ` · ${new Date(ev.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                      </p>
                      {ev.profiles?.full_name && (
                        <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '2px 0 0' }}>par {ev.profiles.full_name}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleEventStatus(ev.id, ev.status)}
                        disabled={adminSaving === ev.id}
                        title={ev.status === 'published' ? 'Mettre en brouillon' : 'Publier'}
                        style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', backgroundColor: ev.status === 'published' ? '#ECFDF5' : '#F3F4F6', color: ev.status === 'published' ? '#059669' : '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ev.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Supprimer "${ev.title}" ?`)) handleDeleteEvent(ev.id) }}
                        disabled={deletingEvent === ev.id}
                        title="Supprimer"
                        style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Tab: Messages ── */}
          {adminTab === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Composer */}
              <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <Send size={16} color="#6366F1" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Nouveau message</h3>
                </div>

                {/* Recipient search */}
                <div style={{ marginBottom: '14px', position: 'relative' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Destinataire</label>
                  {msgRecipient ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '2px solid #6366F1', backgroundColor: '#EEF2FF' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {msgRecipient.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={msgRecipient.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFF' }}>{msgRecipient.full_name[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>{msgRecipient.full_name}</p>
                        <p style={{ fontSize: '11px', color: '#6B7280', margin: 0, textTransform: 'capitalize' }}>{msgRecipient.role ?? 'utilisateur'}</p>
                      </div>
                      <button onClick={() => { setMsgRecipient(null); setMsgSearch('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                      <input
                        value={msgSearch}
                        onChange={e => handleMsgSearch(e.target.value)}
                        placeholder="Rechercher par nom…"
                        style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      {msgSuggestions.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '4px', overflow: 'hidden' }}>
                          {msgSuggestions.map(s => (
                            <button key={s.id} onClick={() => { setMsgRecipient(s); setMsgSearch(s.full_name); setMsgSuggestions([]) }}
                              style={{ width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                {s.avatar_url
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFF' }}>{s.full_name[0]?.toUpperCase()}</span>
                                }
                              </div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', margin: 0 }}>{s.full_name}</p>
                                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0, textTransform: 'capitalize' }}>{s.role ?? 'utilisateur'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {msgSearch.length >= 2 && msgSuggestions.length === 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB', padding: '14px', marginTop: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>Aucun utilisateur trouvé</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Objet <span style={{ color: '#D1D5DB', fontWeight: '400' }}>(optionnel)</span></label>
                  <input
                    value={msgSubject}
                    onChange={e => setMsgSubject(e.target.value)}
                    placeholder="Ex : Votre compte a été vérifié"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Message</label>
                  <textarea
                    value={msgContent}
                    onChange={e => setMsgContent(e.target.value)}
                    placeholder="Tapez votre message ici…"
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSendMessage}
                    disabled={msgSending || !msgRecipient || !msgContent.trim()}
                    style={{
                      padding: '11px 24px', borderRadius: '8px', border: 'none',
                      background: msgRecipient && msgContent.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#E5E7EB',
                      color: msgRecipient && msgContent.trim() ? '#FFF' : '#9CA3AF',
                      fontSize: '14px', fontWeight: '700', cursor: msgRecipient && msgContent.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: msgRecipient && msgContent.trim() ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                    }}>
                    {msgSending ? (
                      <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Envoi…</>
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
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>Envoyés</h3>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: '#F3F4F6', color: '#6B7280', fontWeight: '600' }}>{adminMessages.length}</span>
                </div>

                {adminMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                    <MessageSquare size={32} color="#D1D5DB" style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>Aucun message envoyé</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adminMessages.map(msg => (
                      <div key={msg.id} style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {msg.recipient?.avatar_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={msg.recipient.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>{msg.recipient?.full_name?.[0]?.toUpperCase() ?? '?'}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A1A' }}>{msg.recipient?.full_name ?? 'Utilisateur'}</span>
                              <span style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '6px', textTransform: 'capitalize' }}>{msg.recipient?.role ?? ''}</span>
                              {msg.subject && <p style={{ fontSize: '12px', fontWeight: '600', color: '#6366F1', margin: '2px 0 0' }}>{msg.subject}</p>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {msg.read_at
                                ? <span title="Lu"><CheckCheck size={13} color="#10B981" /></span>
                                : <span title="Non lu"><Clock size={13} color="#9CA3AF" /></span>
                              }
                              <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                                {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                {' '}
                                {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
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

        </motion.div>

        {toast && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '14px', fontWeight: '600', zIndex: 999, animation: 'fadeIn 0.2s ease' }}>
            {toast}
          </div>
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // CREATOR DASHBOARD
  // ──────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 16px 80px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#6366F1', overflow: 'hidden', border: '3px solid #EEF2FF' }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '36px', fontWeight: '800', color: '#FFF' }}>{firstName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#6366F1', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {avatarUploading ? <div style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Upload size={12} color="#FFF" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>{name}</h1>
              {profile?.role === 'creator' && (
                <span style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: '#EEF2FF', color: '#6366F1', fontSize: '12px', fontWeight: '700' }}>Créateur</span>
              )}
              {avgRating && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '700', color: '#F59E0B' }}>
                  <Star size={14} fill="#F59E0B" color="#F59E0B" /> {avgRating} ({reviews.length} avis)
                </span>
              )}
            </div>
            <p style={{ fontSize: '14px', color: '#888888', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Mail size={13} /> {user?.email}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Badge ok={creator?.siret_verified ?? false} label="SIRET vérifié" />
              <Badge ok={creator?.insurance_verified ?? false} label="RC Pro valide" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFF', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: '#1A1A1A', border: 'none', fontSize: '14px', cursor: 'pointer' }}>
                  <X size={15} />
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: '#1A1A1A', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit3 size={15} /> Modifier
              </button>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E5E7EB', marginBottom: '32px' }}>
          {(['profil', 'portfolio', 'candidatures', 'avis'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                fontSize: '14px', fontWeight: tab === t ? '700' : '500',
                color: tab === t ? '#6366F1' : '#888888',
                borderBottom: tab === t ? '2px solid #6366F1' : '2px solid transparent',
                marginBottom: '-2px', textTransform: 'capitalize',
                transition: 'color 150ms ease',
              }}>
              {t === 'candidatures' ? `Candidatures (${applications.length})` : t === 'avis' ? `Avis (${reviews.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Tab: Profil ── */}
        {tab === 'profil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} color="#6366F1" /> Bio
              </h3>
              {editing ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom complet"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '15px', marginBottom: '12px', fontFamily: 'inherit' }} />
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Décrivez votre activité…" rows={4}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }} />
                </>
              ) : (
                <p style={{ fontSize: '15px', color: profile?.bio ? '#1A1A1A' : '#9CA3AF', lineHeight: '1.7', margin: 0 }}>
                  {profile?.bio ?? 'Aucune bio renseignée. Cliquez sur Modifier pour en ajouter une.'}
                </p>
              )}
            </div>

            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>🎨 Disciplines</h3>
              {editing ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DISCIPLINES.map(d => (
                    <button key={d} onClick={() => toggleDisc(d)}
                      style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${editDisc.includes(d) ? '#6366F1' : '#E5E7EB'}`, backgroundColor: editDisc.includes(d) ? '#EEF2FF' : '#FFF', color: editDisc.includes(d) ? '#6366F1' : '#888', fontSize: '13px', fontWeight: editDisc.includes(d) ? '700' : '500', cursor: 'pointer' }}>
                      {d}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(creator?.disciplines ?? []).length > 0
                    ? creator!.disciplines.map(d => (
                      <span key={d} style={{ padding: '6px 14px', borderRadius: '20px', backgroundColor: '#EEF2FF', color: '#6366F1', fontSize: '13px', fontWeight: '600' }}>{d}</span>
                    ))
                    : <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Aucune discipline renseignée</span>
                  }
                </div>
              )}
            </div>

            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#6366F1" /> Localisation & déplacement
              </h3>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Ville" style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                    <input value={editRegion} onChange={e => setEditRegion(e.target.value)} placeholder="Région" style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                  </div>
                  <select value={editRadius} onChange={e => setEditRadius(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#FFF' }}>
                    <option value="5">Rayon 5 km</option>
                    <option value="10">Rayon 10 km</option>
                    <option value="25">Rayon 25 km</option>
                    <option value="national">France entière</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', color: '#1A1A1A' }}>📍 {creator?.city ?? '—'}{creator?.region ? `, ${creator.region}` : ''}</span>
                  <span style={{ fontSize: '14px', color: '#1A1A1A' }}>🚗 {RADIUS_LABELS[creator?.travel_radius ?? ''] ?? 'Non renseigné'}</span>
                </div>
              )}
            </div>

            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>🔗 Liens</h3>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: <AtSign size={16} color="#E1306C" />, val: editInstagram, set: setEditInstagram, placeholder: '@votre_compte' },
                    { icon: <Globe size={16} color="#6366F1" />, val: editWebsite, set: setEditWebsite, placeholder: 'https://votre-site.fr' },
                    { icon: <ExternalLink size={16} color="#F16521" />, val: editEtsy, set: setEditEtsy, placeholder: 'https://etsy.com/shop/...' },
                  ].map(({ icon, val, set, placeholder }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {icon}
                      <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: <AtSign size={15} color="#E1306C" />, val: creator?.instagram, label: 'Instagram' },
                    { icon: <Globe size={15} color="#6366F1" />, val: creator?.website, label: 'Site web' },
                    { icon: <ExternalLink size={15} color="#F16521" />, val: creator?.etsy, label: 'Etsy' },
                  ].filter(l => l.val).map(({ icon, val, label }) => (
                    <a key={label} href={val!.startsWith('http') ? val! : `https://${val}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1A1A1A', textDecoration: 'none', fontSize: '14px' }}>
                      {icon} {val}
                    </a>
                  ))}
                  {!creator?.instagram && !creator?.website && !creator?.etsy && (
                    <span style={{ color: '#9CA3AF', fontSize: '14px' }}>Aucun lien renseigné</span>
                  )}
                </div>
              )}
            </div>

            {/* Vérification */}
            <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} color="#6366F1" /> Vérification
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', border: `1px solid ${(creator?.siret_verified || editSiret) ? '#A7F3D0' : '#E5E7EB'}`, backgroundColor: (creator?.siret_verified || editSiret) ? '#ECFDF5' : '#FAFAFA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: editing ? '12px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={18} fill={(creator?.siret_verified || editSiret) ? '#059669' : 'none'} color={(creator?.siret_verified || editSiret) ? '#059669' : '#9CA3AF'} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>SIRET vérifié</p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Confirme que vous êtes un professionnel déclaré</p>
                      </div>
                    </div>
                    {editing && (
                      <button onClick={() => setEditSiret(!editSiret)}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: editSiret ? '#059669' : '#E5E7EB', color: editSiret ? '#FFF' : '#6B7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {editSiret ? '✓ Activé' : 'Activer'}
                      </button>
                    )}
                  </div>
                  {editing && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input value={siretNumber} onChange={e => { setSiretNumber(e.target.value.replace(/\D/g, '')); setSiretResult(null) }}
                          placeholder="14 chiffres" maxLength={14}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px' }} />
                        <button onClick={handleCheckSiret} disabled={siretNumber.length !== 14 || siretChecking}
                          style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: siretNumber.length === 14 ? '#6366F1' : '#E5E7EB', color: siretNumber.length === 14 ? '#FFF' : '#9CA3AF', fontSize: '13px', fontWeight: '700', cursor: siretNumber.length === 14 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                          {siretChecking ? '…' : 'Vérifier'}
                        </button>
                      </div>
                      {siretResult && (
                        <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', backgroundColor: siretResult.valid ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${siretResult.valid ? '#A7F3D0' : '#FECACA'}` }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: siretResult.valid ? '#059669' : '#DC2626' }}>
                            {siretResult.valid ? `✓ ${siretResult.nom} — SIRET valide. Un admin va confirmer votre badge.` : `✗ ${siretResult.error}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', border: `1px solid ${(creator?.insurance_verified || editInsurance) ? '#A7F3D0' : '#E5E7EB'}`, backgroundColor: (creator?.insurance_verified || editInsurance) ? '#ECFDF5' : '#FAFAFA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={18} fill={(creator?.insurance_verified || editInsurance) ? '#059669' : 'none'} color={(creator?.insurance_verified || editInsurance) ? '#059669' : '#9CA3AF'} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>RC Pro valide</p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Assurance Responsabilité Civile Professionnelle</p>
                      </div>
                    </div>
                    {editing && (
                      <button onClick={() => rcProRef.current?.click()} disabled={rcProUploading}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: editInsurance ? '#059669' : '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {rcProUploading ? 'Envoi…' : editInsurance ? '✓ Déposé' : 'Déposer'}
                      </button>
                    )}
                  </div>
                  {editing && (
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '8px 0 0' }}>Déposez votre attestation RC Pro (PDF ou image)</p>
                  )}
                  <input ref={rcProRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleRcProUpload} />
                </div>
              </div>
            </div>

            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{ padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        )}

        {/* ── Tab: Portfolio ── */}
        {tab === 'portfolio' && user && (
          <PortfolioGridEditor
            items={gridItems}
            userId={user.id}
            onChange={async (next) => {
              setGridItems(next)
              await supabase.from('creator_profiles').upsert({ user_id: user.id, portfolio_grid: next })
            }}
          />
        )}

        {/* ── Tab: Candidatures ── */}
        {tab === 'candidatures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                <Calendar size={40} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>Aucune candidature</p>
                <p style={{ fontSize: '14px', color: '#888888', marginBottom: '20px' }}>Explorez les événements et postulez pour exposer votre travail.</p>
                <button onClick={() => router.push('/events')} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFF', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Voir les événements
                </button>
              </div>
            ) : applications.map(app => {
              const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
              const ev = app.events
              return (
                <div key={app.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#F3F4F6', overflow: 'hidden', flexShrink: 0 }}>
                    {ev?.cover_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={ev.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366F1,#818CF8)' }}><Calendar size={24} color="#FFF" /></div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px' }}>{ev?.title ?? 'Événement supprimé'}</p>
                      <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                    </div>
                    {ev && (
                      <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 6px' }}>
                        📍 {ev.city ?? '—'} · 📅 {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {app.message && <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, fontStyle: 'italic' }}>"{app.message}"</p>}
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0' }}>Candidature envoyée le {new Date(app.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tab: Avis ── */}
        {tab === 'avis' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reviews.length > 0 && (
              <div style={{ padding: '20px 24px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#F59E0B', margin: 0, lineHeight: 1 }}>{avgRating}</p>
                  <Stars n={Math.round(Number(avgRating))} />
                </div>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px' }}>Note moyenne</p>
                  <p style={{ fontSize: '13px', color: '#888888', margin: 0 }}>Basée sur {reviews.length} avis d'organisateurs</p>
                </div>
              </div>
            )}
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                <Star size={40} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>Aucun avis reçu</p>
                <p style={{ fontSize: '14px', color: '#888888' }}>Les avis des organisateurs apparaîtront ici après chaque marché.</p>
              </div>
            ) : reviews.map(rev => (
              <div key={rev.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 4px' }}>{rev.profiles?.full_name ?? 'Organisateur'}</p>
                    <Stars n={rev.rating} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{new Date(rev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {rev.comment && <p style={{ fontSize: '14px', color: '#4B5563', margin: '8px 0 0', lineHeight: '1.6' }}>"{rev.comment}"</p>}
                {(rev.tags ?? []).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {rev.tags!.map(t => (
                      <span key={t} style={{ padding: '2px 10px', borderRadius: '20px', backgroundColor: '#F3F4F6', color: '#6B7280', fontSize: '12px', fontWeight: '600' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
