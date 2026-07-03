'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import {
  User, Mail, MapPin, AtSign, Globe, Edit3, Save, X,
  Star, CheckCircle, Calendar, LogOut, Upload, ExternalLink,
  Shield, FileText, XCircle, Trash2, Eye, EyeOff,
  TrendingUp, Users, BarChart2, MessageSquare, Package, CreditCard, ArrowUpRight,
  Send, Search, CheckCheck, Clock, Settings, AlertCircle, BadgeCheck,
  LayoutGrid, Award, ChevronRight,
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
  insurance_doc_url?: string | null
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
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })
  const [cropScale, setCropScale] = useState(1)
  const [cropDragging, setCropDragging] = useState(false)
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 })
  const [cropImageSize, setCropImageSize] = useState({ w: 0, h: 0 })
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropImgRef = useRef<HTMLImageElement | null>(null)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editShowRealName, setEditShowRealName] = useState(true)
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editPostalCode, setEditPostalCode] = useState('')
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<{ nom: string; region: string; departement: string; codesPostaux: string[] }[]>([])
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cityContainerRef = useRef<HTMLDivElement>(null)
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
        .select('full_name,bio,avatar_url,role,is_admin,username,show_real_name')
        .eq('id', u.id)
        .maybeSingle()

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
          supabase.from('creator_profiles').select('*').eq('user_id', u.id).maybeSingle(),
          supabase.from('applications').select('id,status,created_at,message,events(title,city,start_date,cover_image)').eq('creator_id', u.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('reviews').select('id,rating,comment,tags,created_at,profiles!reviewer_id(full_name,avatar_url)').eq('reviewed_id', u.id).order('created_at', { ascending: false }).limit(20),
        ])
        setCreator(creat)
        if (creat?.portfolio_grid) setGridItems(creat.portfolio_grid as GridItem[])
        else if (creat?.portfolio_images?.length) setGridItems(creat.portfolio_images.map((url: string) => ({ url, colSpan: 1 as const, rowSpan: 1 as const })))
        setApplications((apps as unknown as Application[]) ?? [])
        setReviews((revs as unknown as Review[]) ?? [])
        setEditName(prof?.full_name ?? u.user_metadata?.full_name ?? '')
        setEditUsername((prof as unknown as { username?: string })?.username ?? '')
        setEditShowRealName((prof as unknown as { show_real_name?: boolean })?.show_real_name ?? true)
        setEditBio(prof?.bio ?? '')
        setEditCity(creat?.city ?? '')
        setEditRegion(creat?.region ?? '')
        setEditPostalCode((creat as Record<string, unknown>)?.postal_code as string ?? '')
        setCityQuery(creat?.city ?? '')
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
    const isCreator = profile?.role === 'creator'
    const promises = [
      supabase.from('profiles').update({ full_name: editName, bio: editBio, username: editUsername || null, show_real_name: editShowRealName }).eq('id', user.id),
      ...(isCreator ? [supabase.from('creator_profiles').upsert({
        user_id: user.id, disciplines: editDisc,
        city: editCity, region: editRegion, postal_code: editPostalCode || null, travel_radius: editRadius,
        instagram: editInstagram, website: editWebsite, etsy: editEtsy,
      }, { onConflict: 'user_id' })] : []),
    ]
    const results = await Promise.all(promises)
    const hasError = results.some(r => r.error)
    if (hasError) {
      setToast('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setSaving(false)
      return
    }
    setProfile(p => p ? { ...p, full_name: editName, bio: editBio } : p)
    if (isCreator) setCreator(c => c ? { ...c, disciplines: editDisc, city: editCity, region: editRegion, travel_radius: editRadius, instagram: editInstagram, website: editWebsite, etsy: editEtsy } : c)
    setSaving(false)
    setEditing(false)
  }

  const handleCheckSiret = async () => {
    if (!user || siretNumber.length !== 14) return
    setSiretChecking(true)
    setSiretResult(null)
    try {
      await supabase.from('creator_profiles').upsert({ user_id: user.id, siret_number: siretNumber, siret_verified: false }, { onConflict: 'user_id' })
      const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
      if (admins?.length) {
        await supabase.from('notifications').insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            type: 'siret_pending',
            title: 'SIRET à vérifier',
            body: `${profile?.full_name ?? 'Créateur'} · ${siretNumber}`,
            link: '/profile?tab=admin&section=creators',
          }))
        )
      }
      setSiretResult({ valid: true, nom: 'Demande envoyée — un admin va vérifier votre SIRET.' })
    } catch {
      setSiretResult({ valid: false, error: 'Erreur lors de l\'envoi. Veuillez réessayer.' })
    }
    setSiretChecking(false)
  }

  const handleRcProUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setRcProUploading(true)
    const ext = file.name.split('.').pop()
    const { data: uploadData, error } = await supabase.storage.from('insurance-docs').upload(`${user.id}/rc-pro.${ext}`, file, { upsert: true })
    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('insurance-docs').getPublicUrl(uploadData.path)
      // Sauvegarde l'URL du doc mais NE vérifie PAS — l'admin doit valider
      await supabase.from('creator_profiles').update({ insurance_doc_url: publicUrl, insurance_verified: false }).eq('user_id', user.id)
      setCreator(c => c ? { ...c, insurance_doc_url: publicUrl, insurance_verified: false } : c)
      setEditInsurance(false)
      // Notif à tous les admins
      const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
      if (admins?.length) {
        await supabase.from('notifications').insert(
          admins.map(a => ({
            user_id: a.id,
            type: 'rc_pro_pending',
            title: 'RC Pro à vérifier',
            body: `Nouveau document de ${profile?.full_name ?? 'Créateur'}`,
            link: '/profile?tab=admin&section=creators',
          }))
        )
      }
      setToast('Document envoyé — en attente de validation par l\'équipe')
    }
    setRcProUploading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      cropImgRef.current = img
      setCropImageSize({ w: img.naturalWidth, h: img.naturalHeight })
      setCropOffset({ x: 0, y: 0 })
      setCropScale(1)
      setCropSrc(url)
    }
    img.src = url
  }

  const drawCrop = () => {
    const canvas = cropCanvasRef.current
    const img = cropImgRef.current
    if (!canvas || !img) return
    const SIZE = 300
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, SIZE, SIZE)
    const s = cropScale
    const sw = cropImageSize.w * s
    const sh = cropImageSize.h * s
    const x = SIZE / 2 - sw / 2 + cropOffset.x
    const y = SIZE / 2 - sh / 2 + cropOffset.y
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, x, y, sw, sh)
    ctx.restore()
    // circle border
    ctx.strokeStyle = '#6366F1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()
  }

  useEffect(() => { if (cropSrc) drawCrop() })

  const confirmCrop = async () => {
    if (!cropCanvasRef.current || !user) return
    setAvatarUploading(true)
    setCropSrc(null)
    cropCanvasRef.current.toBlob(async (blob) => {
      if (!blob) { setAvatarUploading(false); return }
      const path = `${user.id}/avatar.jpg`
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
      if (!error) {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        const url = `${data.publicUrl}?t=${Date.now()}`
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
        setProfile(p => p ? { ...p, avatar_url: url } : p)
        const storeUser = useAuthStore.getState().user
        if (storeUser) useAuthStore.getState().setUser({ ...storeUser, avatar_url: url })
      }
      setAvatarUploading(false)
    }, 'image/jpeg', 0.92)
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

        {/* ── Crop Modal ── */}
        {cropSrc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1A1A1A' }}>Recadrer la photo</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>Glisse pour repositionner · molette pour zoomer</p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <canvas
                  ref={cropCanvasRef}
                  width={300} height={300}
                  style={{ borderRadius: '50%', cursor: cropDragging ? 'grabbing' : 'grab', userSelect: 'none', display: 'block' }}
                  onMouseDown={e => { setCropDragging(true); setCropDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }) }}
                  onMouseMove={e => { if (!cropDragging) return; setCropOffset({ x: e.clientX - cropDragStart.x, y: e.clientY - cropDragStart.y }) }}
                  onMouseUp={() => setCropDragging(false)}
                  onMouseLeave={() => setCropDragging(false)}
                  onTouchStart={e => { const t = e.touches[0]; setCropDragging(true); setCropDragStart({ x: t.clientX - cropOffset.x, y: t.clientY - cropOffset.y }) }}
                  onTouchMove={e => { if (!cropDragging) return; const t = e.touches[0]; setCropOffset({ x: t.clientX - cropDragStart.x, y: t.clientY - cropDragStart.y }) }}
                  onTouchEnd={() => setCropDragging(false)}
                  onWheel={e => { e.preventDefault(); setCropScale(s => Math.min(4, Math.max(0.5, s - e.deltaY * 0.001))) }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Zoom</label>
                <input type="range" min="0.5" max="4" step="0.01" value={cropScale}
                  onChange={e => setCropScale(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#6366F1' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setCropSrc(null); if (cropImgRef.current) URL.revokeObjectURL(cropImgRef.current.src) }}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={confirmCrop}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}

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

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link href="/account"
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                <Settings size={15} /> Mon profil
              </Link>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#FEF2F2', color: '#E05A5A', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
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

  const completionMissing: string[] = []
  const isCreatorRole = profile?.role === 'creator' || profile?.role === 'artisan' || creator !== null
  if (isCreatorRole) {
    if (!profile?.full_name) completionMissing.push('Nom complet')
    if (!profile?.bio) completionMissing.push('Bio')
    if (!profile?.avatar_url) completionMissing.push('Photo de profil')
    if (!creator?.disciplines?.length) completionMissing.push('Disciplines')
    if (!creator?.city) completionMissing.push('Ville')
    if (!creator?.travel_radius) completionMissing.push('Rayon de déplacement')
  }
  const completionDone = 6 - completionMissing.length
  const acceptedCount = applications.filter(a => a.status === 'accepted').length

  const DISC_COLORS: Record<string, string> = {
    Tatouage:'#6366F1', Céramique:'#8B5CF6', Gravure:'#EC4899', Joaillerie:'#F59E0B',
    Bijoux:'#F59E0B', Illustration:'#06B6D4', Textile:'#10B981', Maroquinerie:'#84CC16',
    Sculpture:'#F97316', Photographie:'#3B82F6', Peinture:'#EC4899', Poterie:'#8B5CF6',
    Broderie:'#EC4899', Lutherie:'#F97316', Verrerie:'#06B6D4', Reliure:'#6366F1',
    'Cosmétique naturelle':'#10B981', Savonnerie:'#10B981', Coutellerie:'#6B7280',
    Bougies:'#F59E0B', Macramé:'#8B5CF6', Origami:'#06B6D4', Calligraphie:'#6366F1', Sérigraphie:'#EC4899',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes glow{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.7;transform:scale(1.08)}}`}</style>

      {/* ── Crop Modal ── */}
      {cropSrc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1A1A1A' }}>Recadrer la photo</h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>Glisse pour repositionner · molette pour zoomer</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <canvas
                ref={cropCanvasRef}
                width={300} height={300}
                style={{ borderRadius: '50%', cursor: cropDragging ? 'grabbing' : 'grab', userSelect: 'none', display: 'block' }}
                onMouseDown={e => { setCropDragging(true); setCropDragStart({ x: e.clientX - cropOffset.x, y: e.clientY - cropOffset.y }) }}
                onMouseMove={e => { if (!cropDragging) return; setCropOffset({ x: e.clientX - cropDragStart.x, y: e.clientY - cropDragStart.y }) }}
                onMouseUp={() => setCropDragging(false)}
                onMouseLeave={() => setCropDragging(false)}
                onTouchStart={e => { const t = e.touches[0]; setCropDragging(true); setCropDragStart({ x: t.clientX - cropOffset.x, y: t.clientY - cropOffset.y }) }}
                onTouchMove={e => { if (!cropDragging) return; const t = e.touches[0]; setCropOffset({ x: t.clientX - cropDragStart.x, y: t.clientY - cropDragStart.y }) }}
                onTouchEnd={() => setCropDragging(false)}
                onWheel={e => { e.preventDefault(); setCropScale(s => Math.min(4, Math.max(0.5, s - e.deltaY * 0.001))) }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Zoom</label>
              <input type="range" min="0.5" max="4" step="0.01" value={cropScale}
                onChange={e => setCropScale(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#6366F1' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setCropSrc(null); if (cropImgRef.current) URL.revokeObjectURL(cropImgRef.current.src) }}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFF', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={confirmCrop}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

        {/* ═══ DARK HERO ═══════════════════════════════════════════════════════════ */}
        <div style={{ position: 'relative', backgroundColor: '#06060f', overflow: 'hidden', paddingTop: '100px', paddingBottom: '48px' }}>
          {/* Dot grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
          {/* Glow blobs */}
          <div style={{ position: 'absolute', top: '10%', left: '20%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'glow 6s ease-in-out infinite', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '0%', right: '15%', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', animation: 'glow 8s ease-in-out infinite 2s', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: '112px', height: '112px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(99,102,241,0.4)', boxShadow: '0 0 32px rgba(99,102,241,0.25)', backgroundColor: '#1e1b4b' }}>
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
                      <span style={{ fontSize: '40px', fontWeight: '800', color: '#FFF' }}>{firstName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                  style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', border: '2.5px solid #06060f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.5)' }}>
                  {avatarUploading ? <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Upload size={13} color="#FFF" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom complet"
                    style={{ fontSize: '22px', fontWeight: '700', color: '#FFF', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 14px', marginBottom: '10px', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
                ) : (
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#FFFFFF', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{name}</h1>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ padding: '3px 12px', borderRadius: '99px', backgroundColor: 'rgba(99,102,241,0.25)', color: '#A5B4FC', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(99,102,241,0.3)' }}>
                    {profile?.role === 'artisan' ? 'Artisan' : 'Créateur'}
                  </span>
                  {creator?.siret_verified && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#6EE7B7', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <BadgeCheck size={12} /> SIRET
                    </span>
                  )}
                  {creator?.insurance_verified && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', backgroundColor: 'rgba(16,185,129,0.15)', color: '#6EE7B7', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <BadgeCheck size={12} /> RC Pro
                    </span>
                  )}
                  {avgRating && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#FCD34D', fontSize: '12px', fontWeight: '700', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <Star size={11} fill="#FCD34D" color="#FCD34D" /> {avgRating}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  {creator?.city && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                      <MapPin size={13} /> {creator.city}{creator.region ? `, ${creator.region}` : ''}
                    </span>
                  )}
                  {creator?.travel_radius && (
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                      · {RADIUS_LABELS[creator.travel_radius] ?? creator.travel_radius}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                    <Mail size={12} /> {user?.email}
                  </span>
                </div>

                {/* Disciplines preview */}
                {(creator?.disciplines ?? []).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {creator!.disciplines.slice(0, 4).map(d => (
                      <span key={d} style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>{d}</span>
                    ))}
                    {creator!.disciplines.length > 4 && (
                      <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>+{creator!.disciplines.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'flex-start' }}>
                  {editing ? (
                    <>
                      <button onClick={handleSave} disabled={saving}
                        style={{ padding: '10px 20px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#FFF', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setEditing(false)}
                        style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setEditing(true)}
                        style={{ padding: '10px 18px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#FFF', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                        <Edit3 size={14} /> Modifier le profil
                      </button>
                      <button onClick={() => router.push('/creators/' + user?.id)}
                        style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <ChevronRight size={14} /> Voir mon profil
                      </button>
                    </>
                  )}
              </div>

            </div>{/* end flex row */}
          </div>{/* end max-width */}
        </div>{/* end dark hero */}

        {/* ═══ CONTENT AREA ══════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px 80px', position: 'relative' }}>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '28px', marginBottom: '32px' }}>
            {[
              { label: 'Candidatures', value: applications.length, icon: <Calendar size={18} color="#6366F1" />, bg: '#EEF2FF', c: '#6366F1' },
              { label: 'Acceptées', value: acceptedCount, icon: <CheckCircle size={18} color="#059669" />, bg: '#ECFDF5', c: '#059669' },
              { label: 'Avis reçus', value: reviews.length, icon: <Star size={18} color="#F59E0B" />, bg: '#FFFBEB', c: '#F59E0B' },
              { label: 'Note moy.', value: avgRating ?? '—', icon: <Award size={18} color="#8B5CF6" />, bg: '#F5F3FF', c: '#8B5CF6' },
            ].map(s => (
              <div key={s.label} style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>{s.icon}</div>
                <p style={{ fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, fontWeight: '500' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Profile completion banner */}
          {isCreatorRole && completionMissing.length > 0 && (
            <div style={{ marginBottom: '24px', padding: '16px 20px', borderRadius: '14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={18} color="#D97706" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#92400E' }}>Profil complété {completionDone}/6</span>
                  <span style={{ fontSize: '12px', color: '#B45309', fontWeight: '600' }}>{Math.round((completionDone / 6) * 100)}%</span>
                </div>
                <div style={{ height: '6px', borderRadius: '99px', backgroundColor: '#FDE68A', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${(completionDone / 6) * 100}%`, borderRadius: '99px', background: 'linear-gradient(90deg,#F59E0B,#D97706)', transition: 'width 600ms ease' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {completionMissing.map(f => (
                    <span key={f} style={{ padding: '3px 10px', borderRadius: '99px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', fontSize: '12px', fontWeight: '600', color: '#92400E' }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pill tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '14px', width: 'fit-content', flexWrap: 'wrap' }}>
            {([
              { key: 'profil',       label: 'Profil',        icon: <User size={14} /> },
              { key: 'portfolio',    label: 'Portfolio',     icon: <LayoutGrid size={14} /> },
              { key: 'candidatures', label: `Candidatures${applications.length ? ` (${applications.length})` : ''}`, icon: <Calendar size={14} /> },
              { key: 'avis',         label: `Avis${reviews.length ? ` (${reviews.length})` : ''}`, icon: <Award size={14} /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600', transition: 'all 150ms ease',
                  backgroundColor: tab === t.key ? '#FFFFFF' : 'transparent',
                  color: tab === t.key ? '#1E293B' : '#64748B',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

        {/* ── Tab: Profil ── */}
        {tab === 'profil' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Bio */}
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#6366F1" /></div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Bio</h3>
              </div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Pseudo */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pseudo / Nom d'affichage</label>
                    <input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="ex : sophie.ceramiques"
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          await supabase.from('profiles').update({ username: editUsername || null }).eq('id', user!.id)
                          setToast('Pseudo enregistré ✓')
                        }
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#1A1A1A', backgroundColor: '#F8FAFC', boxSizing: 'border-box' }} />
                    <p style={{ fontSize: '12px', color: '#94A3B8', margin: '5px 0 0' }}>Appuyez sur <kbd style={{ padding: '1px 5px', borderRadius: '4px', backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '11px' }}>Entrée</kbd> pour enregistrer.</p>
                  </div>
                  {/* Toggle nom réel */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div onClick={() => setEditShowRealName(v => !v)}
                      style={{ width: '40px', height: '22px', borderRadius: '99px', backgroundColor: editShowRealName ? '#6366F1' : '#CBD5E1', position: 'relative', flexShrink: 0, transition: 'background 200ms', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', top: '3px', left: editShowRealName ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFF', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1E293B', margin: 0 }}>Afficher mon vrai nom</p>
                      <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>{editShowRealName ? 'Votre nom complet est visible publiquement' : 'Seul le pseudo est affiché'}</p>
                    </div>
                  </label>
                  {/* Bio */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Bio</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Décrivez votre activité, votre style, ce qui vous rend unique…" rows={4}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.7', outline: 'none', color: '#1A1A1A', backgroundColor: '#F8FAFC', boxSizing: 'border-box' }} />
                  </div>
                </div>
              ) : (
                <div>
                  {/* Pseudo affiché */}
                  {(profile as unknown as { username?: string })?.username && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#6366F1' }}>@{(profile as unknown as { username?: string }).username}</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>·</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{(profile as unknown as { show_real_name?: boolean })?.show_real_name !== false ? 'Nom visible' : 'Nom masqué'}</span>
                    </div>
                  )}
                  <p style={{ fontSize: '15px', color: profile?.bio ? '#334155' : '#94A3B8', lineHeight: '1.8', margin: 0 }}>
                    {profile?.bio ?? 'Aucune bio renseignée. Cliquez sur "Modifier le profil" pour en ajouter une.'}
                  </p>
                </div>
              )}
            </div>

            {/* Disciplines */}
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '14px' }}>🎨</span></div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Disciplines</h3>
              </div>
              {editing ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {DISCIPLINES.map(d => {
                    const c = DISC_COLORS[d] ?? '#6366F1'
                    const sel = editDisc.includes(d)
                    return (
                      <button key={d} onClick={() => toggleDisc(d)}
                        style={{ padding: '6px 14px', borderRadius: '99px', border: `1.5px solid ${sel ? c : '#E2E8F0'}`, backgroundColor: sel ? c + '18' : '#FFF', color: sel ? c : '#64748B', fontSize: '13px', fontWeight: sel ? '700' : '500', cursor: 'pointer', transition: 'all 150ms' }}>
                        {d}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(creator?.disciplines ?? []).length > 0
                    ? creator!.disciplines.map(d => {
                        const c = DISC_COLORS[d] ?? '#6366F1'
                        return <span key={d} style={{ padding: '6px 14px', borderRadius: '99px', backgroundColor: c + '18', color: c, fontSize: '13px', fontWeight: '700', border: `1px solid ${c}30` }}>{d}</span>
                      })
                    : <span style={{ color: '#94A3B8', fontSize: '14px' }}>Aucune discipline renseignée</span>
                  }
                </div>
              )}
            </div>

            {/* Localisation */}
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={14} color="#059669" /></div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Localisation & déplacement</h3>
              </div>
              {editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* City + postal autocomplete */}
                  <div ref={cityContainerRef} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        value={cityQuery}
                        onChange={e => {
                          const q = e.target.value
                          setCityQuery(q)
                          setEditCity(q)
                          setCityDropdownOpen(true)
                          if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
                          if (q.length < 2) { setCitySuggestions([]); return }
                          cityDebounceRef.current = setTimeout(async () => {
                            try {
                              const isPostal = /^\d+$/.test(q)
                              const url = isPostal
                                ? `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(q)}&fields=nom,region,departement,codesPostaux&boost=population&limit=6`
                                : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,region,departement,codesPostaux&boost=population&limit=6`
                              const r = await fetch(url)
                              const data = await r.json()
                              setCitySuggestions(data.map((c: { nom: string; region: { nom: string }; departement: { nom: string }; codesPostaux: string[] }) => ({
                                nom: c.nom,
                                region: c.region?.nom ?? '',
                                departement: c.departement?.nom ?? '',
                                codesPostaux: c.codesPostaux ?? [],
                              })))
                            } catch { setCitySuggestions([]) }
                          }, 250)
                        }}
                        onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                        onFocus={() => citySuggestions.length > 0 && setCityDropdownOpen(true)}
                        placeholder="Ville ou code postal"
                        autoComplete="off"
                        style={{ flex: 2, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <input
                        value={editPostalCode}
                        onChange={e => setEditPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                        placeholder="Code postal"
                        maxLength={5}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#F8FAFC', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    {cityDropdownOpen && citySuggestions.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', marginTop: '4px', overflow: 'hidden' }}>
                        {citySuggestions.map((s, i) => (
                          <button key={i} type="button"
                            onMouseDown={() => {
                              setEditCity(s.nom)
                              setEditRegion(s.region)
                              setCityQuery(s.nom)
                              if (s.codesPostaux?.length === 1) setEditPostalCode(s.codesPostaux[0])
                              setCityDropdownOpen(false)
                              setCitySuggestions([])
                            }}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: i < citySuggestions.length - 1 ? '1px solid #F3F4F6' : 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <div>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>{s.nom}</span>
                              <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '6px' }}>{s.departement} · {s.region}</span>
                            </div>
                            {s.codesPostaux?.length > 0 && (
                              <span style={{ fontSize: '12px', color: '#6366F1', fontWeight: '600', fontFamily: 'monospace', marginLeft: '8px', flexShrink: 0 }}>{s.codesPostaux[0]}{s.codesPostaux.length > 1 ? '…' : ''}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input value={editRegion} onChange={e => setEditRegion(e.target.value)} placeholder="Région (remplie automatiquement)" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#F8FAFC', outline: 'none', color: '#6B7280' }} />
                  <select value={editRadius} onChange={e => setEditRadius(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#F8FAFC', outline: 'none' }}>
                    <option value="5">Rayon 5 km</option>
                    <option value="10">Rayon 10 km</option>
                    <option value="25">Rayon 25 km</option>
                    <option value="national">France entière</option>
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155' }}>
                    <MapPin size={14} color="#94A3B8" /> {creator?.city ?? '—'}{creator?.region ? `, ${creator.region}` : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#334155' }}>
                    🚗 {RADIUS_LABELS[creator?.travel_radius ?? ''] ?? 'Non renseigné'}
                  </span>
                </div>
              )}
            </div>

            {/* Liens */}
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={14} color="#F97316" /></div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Liens</h3>
              </div>
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
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontFamily: 'inherit', backgroundColor: '#F8FAFC', outline: 'none' }} />
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
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                      {icon} {val}
                    </a>
                  ))}
                  {!creator?.instagram && !creator?.website && !creator?.etsy && (
                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Aucun lien renseigné</span>
                  )}
                </div>
              )}
            </div>

            {/* Vérification */}
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#FFFFFF', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BadgeCheck size={14} color="#059669" /></div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Vérification</h3>
              </div>
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
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px' }}>Entrez votre numéro SIRET (14 chiffres) — un admin le validera sous 24h.</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input value={siretNumber} onChange={e => { setSiretNumber(e.target.value.replace(/\D/g, '')); setSiretResult(null) }}
                          placeholder="14 chiffres" maxLength={14}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '2px' }} />
                        <button onClick={handleCheckSiret} disabled={siretNumber.length !== 14 || siretChecking}
                          style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: siretNumber.length === 14 ? '#6366F1' : '#E5E7EB', color: siretNumber.length === 14 ? '#FFF' : '#9CA3AF', fontSize: '13px', fontWeight: '700', cursor: siretNumber.length === 14 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                          {siretChecking ? '…' : 'Envoyer'}
                        </button>
                      </div>
                      {siretResult && (
                        <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', backgroundColor: siretResult.valid ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${siretResult.valid ? '#A7F3D0' : '#FECACA'}` }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: siretResult.valid ? '#059669' : '#DC2626' }}>
                            {siretResult.valid ? `✓ ${siretResult.nom}` : `✗ ${siretResult.error}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px', borderRadius: '10px', border: `1px solid ${creator?.insurance_verified ? '#A7F3D0' : creator?.insurance_doc_url ? '#FDE68A' : '#E5E7EB'}`, backgroundColor: creator?.insurance_verified ? '#ECFDF5' : creator?.insurance_doc_url ? '#FFFBEB' : '#FAFAFA' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle size={18}
                        fill={creator?.insurance_verified ? '#059669' : 'none'}
                        color={creator?.insurance_verified ? '#059669' : creator?.insurance_doc_url ? '#F59E0B' : '#9CA3AF'}
                      />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>RC Pro</p>
                        <p style={{ fontSize: '12px', color: creator?.insurance_verified ? '#059669' : creator?.insurance_doc_url ? '#D97706' : '#6B7280', margin: 0, fontWeight: '600' }}>
                          {creator?.insurance_verified ? '✓ Validé par l\'équipe' : creator?.insurance_doc_url ? '⏳ En attente de validation' : 'Assurance Responsabilité Civile Professionnelle'}
                        </p>
                      </div>
                    </div>
                    {editing && !creator?.insurance_verified && (
                      <button onClick={() => rcProRef.current?.click()} disabled={rcProUploading}
                        style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', backgroundColor: creator?.insurance_doc_url ? '#F59E0B' : '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        {rcProUploading ? 'Envoi…' : creator?.insurance_doc_url ? '↺ Remplacer' : 'Déposer'}
                      </button>
                    )}
                  </div>
                  {editing && !creator?.insurance_verified && (
                    <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '8px 0 0' }}>
                      {creator?.insurance_doc_url ? 'Document reçu — l\'équipe Nexart va le vérifier sous 24h.' : 'Déposez votre attestation RC Pro (PDF ou image)'}
                    </p>
                  )}
                  <input ref={rcProRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleRcProUpload} />
                </div>
              </div>
            </div>

            {/* Déconnexion */}
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
              style={{ padding: '14px', borderRadius: '12px', border: '1px solid #FEE2E2', backgroundColor: '#FFF', color: '#EF4444', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <LogOut size={16} /> Se déconnecter
            </button>

            {/* Supprimer le compte */}
            <button
              onClick={async () => {
                const confirmed = window.confirm('⚠️ Supprimer définitivement votre compte ?\n\nToutes vos données seront effacées et cette action est irréversible.')
                if (!confirmed) return
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) return
                const res = await fetch('/api/delete-account', {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${session.access_token}` },
                })
                if (res.ok) {
                  await supabase.auth.signOut()
                  router.push('/')
                } else {
                  const body = await res.json()
                  alert('Erreur : ' + (body.error ?? 'Impossible de supprimer le compte'))
                }
              }}
              style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Trash2 size={14} /> Supprimer mon compte
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
              await supabase.from('creator_profiles').upsert({ user_id: user.id, portfolio_grid: next }, { onConflict: 'user_id' })
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

        </div>{/* end content area */}

      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes glow{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.7;transform:scale(1.08)}}`}</style>
    </div>
  )
}
