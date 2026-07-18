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
  LayoutGrid, Award, ChevronRight, Rss, Heart, ImagePlus,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { PortfolioGridEditor, type GridItem } from '@/components/portfolio-grid-editor'
import { PastEventsGallery } from '@/components/ui/past-events-gallery'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  full_name: string; bio: string | null; avatar_url: string | null; banner_url?: string | null
  role: string | null; is_admin: boolean; subscription_tier?: string | null
  is_creator?: boolean; is_organizer?: boolean
}
type CreatorProfile = {
  disciplines: string[]; city: string | null; region: string | null
  travel_radius: string | null; portfolio_images: string[]
  website: string | null; instagram: string | null; etsy: string | null
  siret_verified: boolean; insurance_verified: boolean
  insurance_doc_url?: string | null
  open_to_collab?: boolean
  postal_code?: string | null
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
type DisciplineProposal = {
  id: string; name: string; status: string; created_at: string
  creator_id: string
  profiles?: { full_name: string } | null
}

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

function getVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube: youtu.be/ID or youtube.com/watch?v=ID or youtube.com/shorts/ID
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v') || u.pathname.split('/').pop()
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    // TikTok: tiktok.com/@user/video/ID
    if (u.hostname.includes('tiktok.com')) {
      const m = u.pathname.match(/\/video\/(\d+)/)
      if (m) return `https://www.tiktok.com/embed/v2/${m[1]}`
    }
    // Instagram: instagram.com/reel/CODE
    if (u.hostname.includes('instagram.com')) {
      const m = u.pathname.match(/\/reel\/([^/]+)/)
      if (m) return `https://www.instagram.com/reel/${m[1]}/embed`
    }
    return null
  } catch { return null }
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
  draft:     { label: 'Brouillon',  color: 'var(--text-secondary)', bg: '#F3F4F6' },
  published: { label: 'Publié',     color: '#10B981', bg: '#ECFDF5' },
  closed:    { label: 'Fermé',      color: 'var(--text-secondary)', bg: '#F3F4F6' },
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
      color: ok ? '#059669' : 'var(--text-tertiary)',
    }}>
      <CheckCircle size={12} fill={ok ? '#059669' : 'none'} color={ok ? '#059669' : 'var(--text-tertiary)'} />
      {label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [bannerUploading, setBannerUploading] = useState(false)

  // Creator state
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [gridItems, setGridItems] = useState<GridItem[]>([])
  const [portfolioVideos, setPortfolioVideos] = useState<string[]>([])
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [tab, setTab] = useState<'profil' | 'portfolio' | 'candidatures' | 'avis' | 'posts'>('profil')
  const [myPosts, setMyPosts] = useState<{ id: string; content: string; image_url: string | null; created_at: string }[]>([])
  const [postContent, setPostContent] = useState('')
  const [postImageFile, setPostImageFile] = useState<File | null>(null)
  const [postSaving, setPostSaving] = useState(false)
  const [profileViews, setProfileViews] = useState<number>(0)
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
  const [editBrandColor, setEditBrandColor] = useState('#6366F1')
  const [editSiret, setEditSiret] = useState(false)
  const [editInsurance, setEditInsurance] = useState(false)
  const [siretNumber, setSiretNumber] = useState('')
  const [siretChecking, setSiretChecking] = useState(false)
  const [siretResult, setSiretResult] = useState<{ valid: boolean; nom?: string; error?: string } | null>(null)
  const rcProRef = useRef<HTMLInputElement>(null)
  const [rcProUploading, setRcProUploading] = useState(false)

  // Organizer profile + verification state
  const [orgaProfile, setOrgaProfile] = useState<{
    siret_number: string | null; siret_verified: boolean
    verification_doc_url: string | null; verification_doc_verified: boolean
  } | null>(null)
  const [orgaSiretInput, setOrgaSiretInput] = useState('')
  const [orgaSiretChecking, setOrgaSiretChecking] = useState(false)
  const [orgaSiretResult, setOrgaSiretResult] = useState<{ valid: boolean; nom?: string; error?: string } | null>(null)
  const orgaDocRef = useRef<HTMLInputElement>(null)
  const [orgaDocUploading, setOrgaDocUploading] = useState(false)
  const [adminOrgaVerifs, setAdminOrgaVerifs] = useState<{
    user_id: string; siret_number: string | null; siret_verified: boolean
    verification_doc_url: string | null; verification_doc_verified: boolean
    profiles?: { full_name: string; avatar_url: string | null } | null
  }[]>([])
  const [orgaVerifSaving, setOrgaVerifSaving] = useState<string | null>(null)
  const [orgaVerifFilter, setOrgaVerifFilter] = useState<'pending' | 'all'>('pending')

  // Admin state
  const [adminTab, setAdminTab] = useState<'analytics' | 'verifications' | 'marches' | 'messages' | 'abonnements' | 'disciplines' | 'signalements'>('analytics')
  const [adminReports, setAdminReports] = useState<{ id: string; reporter_id: string; target_id: string; target_type: string; reason: string; status: string; created_at: string; reporter?: { full_name: string | null } }[]>([])
  const [adminDiscProposals, setAdminDiscProposals] = useState<DisciplineProposal[]>([])
  const [discProposalSaving, setDiscProposalSaving] = useState<string | null>(null)

  // Creator-side discipline proposal
  const [discProposalInput, setDiscProposalInput] = useState('')
  const [discProposalSending, setDiscProposalSending] = useState(false)
  const [myDiscProposals, setMyDiscProposals] = useState<DisciplineProposal[]>([])
  const [adminCreators, setAdminCreators] = useState<AdminCreator[]>([])
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([])
  const [adminFilter, setAdminFilter] = useState<'pending' | 'all'>('pending')
  const [adminSaving, setAdminSaving] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Admin abonnements state
  const [subSearch, setSubSearch] = useState('')
  const [subResults, setSubResults] = useState<{ id: string; full_name: string; email?: string; role: string; subscription_tier?: string }[]>([])
  const [subSearching, setSubSearching] = useState(false)
  const [subSaving, setSubSaving] = useState<string | null>(null)
  const [subToast, setSubToast] = useState<string | null>(null)

  // Admin messaging state
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [refuseModal, setRefuseModal] = useState<{ userId: string; field: 'siret_verified' | 'insurance_verified'; creatorName: string } | null>(null)
  const [refuseComment, setRefuseComment] = useState('')
  // Suivi local des refus (siret/insurance) pour afficher "Refusé" au lieu de "En attente"
  const [refusedSet, setRefusedSet] = useState<Set<string>>(new Set())
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
        .select('full_name,bio,avatar_url,banner_url,role,is_admin,username,show_real_name,subscription_tier,is_creator,is_organizer')
        .eq('id', u.id)
        .maybeSingle()

      setProfile(prof as Profile)

      if (prof?.is_admin) {
        const [{ data: creators }, { data: events }, analyticsRes, { data: discProps }] = await Promise.all([
          supabase.from('creator_profiles')
            .select('user_id,siret_number,siret_verified,insurance_verified,insurance_doc_url,profiles(full_name,avatar_url)')
            .order('user_id'),
          supabase.from('events')
            .select('id,title,city,start_date,event_type,status,cover_image,stand_count,stand_price,profiles(full_name)')
            .order('created_at', { ascending: false })
            .limit(50),
          fetch('/api/admin/analytics').then(r => r.json()),
          supabase.from('discipline_proposals')
            .select('id,name,status,created_at,creator_id,profiles!creator_id(full_name)')
            .order('created_at', { ascending: false }),
        ])
        setAdminCreators((creators as unknown as AdminCreator[]) ?? [])
        setAdminEvents((events as unknown as AdminEvent[]) ?? [])
        setAnalytics(analyticsRes as Analytics)
        setAdminDiscProposals((discProps as unknown as DisciplineProposal[]) ?? [])
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
        if ((creat as any)?.portfolio_videos?.length) setPortfolioVideos((creat as any).portfolio_videos)
        setApplications((apps as unknown as Application[]) ?? [])
        setReviews((revs as unknown as Review[]) ?? [])
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { count: viewCount } = await supabase.from('profile_views').select('*', { count: 'exact', head: true }).eq('profile_id', u.id).gte('viewed_at', thirtyDaysAgo)
        setProfileViews(viewCount ?? 0)
        const { data: postsData } = await supabase.from('creator_posts').select('id,content,image_url,created_at').eq('creator_id', u.id).order('created_at', { ascending: false }).limit(50)
        setMyPosts(postsData ?? [])
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
        setEditBrandColor((creat as any)?.page_settings?.primary_color ?? '#6366F1')
        setEditSiret(creat?.siret_verified ?? false)
        setEditInsurance(creat?.insurance_verified ?? false)
        setSiretNumber((creat as Record<string, unknown>)?.siret_number as string ?? '')
        // Load own discipline proposals
        const { data: myProps } = await supabase
          .from('discipline_proposals')
          .select('id,name,status,created_at,creator_id')
          .eq('creator_id', u.id)
          .order('created_at', { ascending: false })
        setMyDiscProposals((myProps as unknown as DisciplineProposal[]) ?? [])
        // Load organizer profile if also organizer
        if (prof?.is_organizer || prof?.role === 'organizer') {
          const { data: orgaP } = await supabase
            .from('organizer_profiles')
            .select('siret_number,siret_verified,verification_doc_url,verification_doc_verified')
            .eq('user_id', u.id)
            .maybeSingle()
          setOrgaProfile(orgaP)
          setOrgaSiretInput((orgaP as Record<string, unknown>)?.siret_number as string ?? '')
        }
      }
      // If admin: also load organizer verifications
      if (prof?.is_admin) {
        const { data: orgaVerifs } = await supabase
          .from('organizer_profiles')
          .select('user_id,siret_number,siret_verified,verification_doc_url,verification_doc_verified,profiles!user_id(full_name,avatar_url)')
          .order('user_id')
        setAdminOrgaVerifs((orgaVerifs as unknown as typeof adminOrgaVerifs) ?? [])
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
    const isCreator = profile?.role === 'creator' || profile?.role === 'artisan' || profile?.is_creator === true
    const promises = [
      supabase.from('profiles').update({ full_name: editName, bio: editBio, username: editUsername || null, show_real_name: editShowRealName }).eq('id', user.id),
      ...(isCreator ? [supabase.from('creator_profiles').upsert({
        user_id: user.id, disciplines: editDisc,
        city: editCity, region: editRegion, postal_code: editPostalCode || null, travel_radius: editRadius as '5' | '10' | '25' | 'national',
        instagram: editInstagram, website: editWebsite, etsy: editEtsy,
        page_settings: { primary_color: editBrandColor },
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
    if (isCreator) setCreator(c => c ? { ...c, disciplines: editDisc, city: editCity, region: editRegion, travel_radius: editRadius as '5' | '10' | '25' | 'national', instagram: editInstagram, website: editWebsite, etsy: editEtsy } : c)
    setSaving(false)
    setEditing(false)
  }

  const handleCheckSiret = async () => {
    if (!user || siretNumber.length !== 14) return
    setSiretChecking(true)
    setSiretResult(null)
    try {
      await supabase.from('creator_profiles').upsert({ user_id: user.id, siret_number: siretNumber, siret_verified: false } as any, { onConflict: 'user_id' })
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

  const handleOrgaSiretCheck = async () => {
    if (orgaSiretInput.length !== 14 || !user) return
    setOrgaSiretChecking(true)
    setOrgaSiretResult(null)
    try {
      const r = await fetch(`https://api.pappers.fr/v2/entreprise?siret=${orgaSiretInput}&api_token=`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      const nom = d.nom_entreprise || d.denomination
      if (nom) {
        await supabase.from('organizer_profiles').upsert({ user_id: user.id, siret_number: orgaSiretInput, siret_verified: false } as any, { onConflict: 'user_id' })
        setOrgaProfile(p => p ? { ...p, siret_number: orgaSiretInput, siret_verified: false } : { siret_number: orgaSiretInput, siret_verified: false, verification_doc_url: null, verification_doc_verified: false })
        const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
        if (admins?.length) await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.id, type: 'orga_siret_pending', title: 'SIRET orga à vérifier', body: `${profile?.full_name ?? 'Organisateur'} — ${orgaSiretInput}`, link: '/profile?tab=admin&section=orga' })))
        setOrgaSiretResult({ valid: true, nom })
        showToast('SIRET envoyé — validation sous 24h')
      } else {
        setOrgaSiretResult({ valid: false, error: 'Entreprise introuvable pour ce SIRET' })
      }
    } catch {
      // Fallback sans API key Pappers : juste sauvegarder et notifier
      await supabase.from('organizer_profiles').upsert({ user_id: user.id, siret_number: orgaSiretInput, siret_verified: false } as any, { onConflict: 'user_id' })
      setOrgaProfile(p => p ? { ...p, siret_number: orgaSiretInput } : { siret_number: orgaSiretInput, siret_verified: false, verification_doc_url: null, verification_doc_verified: false })
      const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
      if (admins?.length) await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.id, type: 'orga_siret_pending', title: 'SIRET orga à vérifier', body: `${profile?.full_name ?? 'Organisateur'} — ${orgaSiretInput}`, link: '/profile?tab=admin&section=orga' })))
      setOrgaSiretResult({ valid: true, nom: 'SIRET enregistré' })
      showToast('SIRET envoyé — validation sous 24h')
    }
    setOrgaSiretChecking(false)
  }

  const handleOrgaDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setOrgaDocUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/doc-orga.${ext}`
    const { data: uploadData, error } = await supabase.storage.from('organizer-docs').upload(path, file, { upsert: true })
    if (!error && uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('organizer-docs').getPublicUrl(uploadData.path)
      await supabase.from('organizer_profiles').upsert({ user_id: user.id, verification_doc_url: publicUrl, verification_doc_verified: false } as any, { onConflict: 'user_id' })
      setOrgaProfile(p => p ? { ...p, verification_doc_url: publicUrl, verification_doc_verified: false } : { siret_number: null, siret_verified: false, verification_doc_url: publicUrl, verification_doc_verified: false })
      const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true)
      if (admins?.length) await supabase.from('notifications').insert(admins.map(a => ({ user_id: a.id, type: 'orga_doc_pending', title: 'Document orga à vérifier', body: `Kbis/RNA de ${profile?.full_name ?? 'Organisateur'}`, link: '/profile?tab=admin&section=orga' })))
      showToast('Document envoyé — en attente de validation')
    }
    setOrgaDocUploading(false)
  }

  const handleAdminVerifyOrga = async (userId: string, field: 'siret_verified' | 'verification_doc_verified', value: boolean) => {
    setOrgaVerifSaving(`${userId}-${field}`)
    await supabase.from('organizer_profiles').update({ [field]: value, verified_at: new Date().toISOString(), verified_by: user?.id } as any).eq('user_id', userId)
    setAdminOrgaVerifs(prev => prev.map(o => o.user_id === userId ? { ...o, [field]: value } : o))
    setOrgaVerifSaving(null)
    showToast(value ? 'Vérifié' : 'Révoqué')
  }

  const handleProposeDisc = async () => {
    const name = discProposalInput.trim()
    if (!name || !user) return
    const already = myDiscProposals.find(p => p.name.toLowerCase() === name.toLowerCase() && p.status === 'pending')
    if (already) { showToast('Proposition déjà en attente'); return }
    setDiscProposalSending(true)
    const { data } = await supabase.from('discipline_proposals').insert({ creator_id: user.id, name }).select().single()
    if (data) {
      setMyDiscProposals(prev => [data as unknown as DisciplineProposal, ...prev])
      setDiscProposalInput('')
      showToast('Proposition envoyée')
    }
    setDiscProposalSending(false)
  }

  const handleAdminDiscProposal = async (id: string, action: 'approved' | 'rejected') => {
    if (!user) return
    setDiscProposalSaving(id)
    const proposal = adminDiscProposals.find(p => p.id === id)
    if (action === 'approved' && proposal) {
      // Add the discipline to the creator's profile
      const { data: cp } = await supabase.from('creator_profiles').select('disciplines').eq('user_id', proposal.creator_id).maybeSingle()
      const existing: string[] = cp?.disciplines ?? []
      if (!existing.includes(proposal.name)) {
        await supabase.from('creator_profiles').upsert({ user_id: proposal.creator_id, disciplines: [...existing, proposal.name] }, { onConflict: 'user_id' })
      }
    }
    await supabase.from('discipline_proposals').update({ status: action, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq('id', id)
    setAdminDiscProposals(prev => prev.map(p => p.id === id ? { ...p, status: action } : p))
    setDiscProposalSaving(null)
  }

  const correctImageOrientation = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const buf = ev.target?.result as ArrayBuffer
        if (!buf) { resolve(URL.createObjectURL(file)); return }
        // Lire l'orientation EXIF (tag 0x0112) dans les données JPEG
        let orientation = 1
        const view = new DataView(buf)
        if (view.getUint16(0) === 0xFFD8) {
          let offset = 2
          while (offset < view.byteLength) {
            if (view.getUint16(offset) === 0xFFE1) {
              if (view.getUint32(offset + 4) === 0x45786966) {
                const little = view.getUint16(offset + 10) === 0x4949
                const ifdOffset = offset + 10 + view.getUint32(offset + 14, little)
                const tags = view.getUint16(ifdOffset, little)
                for (let i = 0; i < tags; i++) {
                  if (view.getUint16(ifdOffset + 2 + 12 * i, little) === 0x0112) {
                    orientation = view.getUint16(ifdOffset + 2 + 12 * i + 8, little)
                    break
                  }
                }
              }
              break
            }
            offset += 2 + view.getUint16(offset + 2)
          }
        }
        if (orientation === 1) { resolve(URL.createObjectURL(file)); return }
        const img = new window.Image()
        img.onload = () => {
          const w = img.naturalWidth
          const h = img.naturalHeight
          const canvas = document.createElement('canvas')
          const swapped = orientation >= 5
          canvas.width = swapped ? h : w
          canvas.height = swapped ? w : h
          const ctx = canvas.getContext('2d')!
          const t: Record<number, () => void> = {
            2: () => { ctx.transform(-1, 0, 0, 1, w, 0) },
            3: () => { ctx.transform(-1, 0, 0, -1, w, h) },
            4: () => { ctx.transform(1, 0, 0, -1, 0, h) },
            5: () => { ctx.transform(0, 1, 1, 0, 0, 0) },
            6: () => { ctx.transform(0, 1, -1, 0, h, 0) },
            7: () => { ctx.transform(0, -1, -1, 0, h, w) },
            8: () => { ctx.transform(0, -1, 1, 0, 0, w) },
          }
          t[orientation]?.()
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/jpeg', 0.95))
          URL.revokeObjectURL(img.src)
        }
        img.src = URL.createObjectURL(file)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    setBannerUploading(true)
    const correctedDataUrl = await correctImageOrientation(file)
    const blob = await fetch(correctedDataUrl).then(r => r.blob())
    const path = `${user.id}/banner.jpg`
    const { error } = await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      await supabase.from('profiles').update({ banner_url: url }).eq('id', user.id)
      setProfile(p => p ? { ...p, banner_url: url } : p)
    }
    setBannerUploading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''
    const correctedUrl = await correctImageOrientation(file)
    const img = new window.Image()
    img.onload = () => {
      cropImgRef.current = img
      setCropImageSize({ w: img.naturalWidth, h: img.naturalHeight })
      setCropOffset({ x: 0, y: 0 })
      setCropScale(1)
      setCropSrc(correctedUrl)
    }
    img.src = correctedUrl
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
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()
  }

  useEffect(() => { if (cropSrc) drawCrop() })

  // Realtime — mise à jour siret_verified / insurance_verified en temps réel pour le créateur
  useEffect(() => {
    if (!user || profile?.is_admin) return
    const channel = supabase
      .channel(`creator_profile:${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'creator_profiles',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as { siret_verified?: boolean; insurance_verified?: boolean }
        setCreator(c => c ? { ...c, ...updated } : c)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, profile?.is_admin]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const addVideo = async () => {
    const url = newVideoUrl.trim()
    if (!url || portfolioVideos.includes(url) || portfolioVideos.length >= 6 || !user) return
    const next = [...portfolioVideos, url]
    setPortfolioVideos(next)
    setNewVideoUrl('')
    await supabase.from('creator_profiles').update({ portfolio_videos: next } as any).eq('user_id', user.id)
  }

  // ─── Admin handlers ─────────────────────────────────────────────────────────

  const handleVerifyCreator = async (userId: string, field: 'siret_verified' | 'insurance_verified', value: boolean, comment?: string) => {
    setAdminSaving(`${userId}-${field}`)
    await supabase.from('creator_profiles').update({ [field]: value } as any).eq('user_id', userId)
    setAdminCreators(prev => prev.map(c => c.user_id === userId ? { ...c, [field]: value } : c))
    const key = `${userId}-${field}`
    if (!value) {
      setRefusedSet(prev => new Set([...prev, key]))
    } else {
      setRefusedSet(prev => { const s = new Set(prev); s.delete(key); return s })
    }

    if (!value && comment?.trim()) {
      const label = field === 'siret_verified' ? 'SIRET' : 'RC Pro'
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'verification_refused',
        title: `Vérification ${label} refusée`,
        body: comment.trim(),
        link: '/profile',
      })
    } else if (value) {
      const label = field === 'siret_verified' ? 'SIRET' : 'RC Pro'
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'verification_accepted',
        title: `Vérification ${label} validée OK`,
        body: `Votre ${label} a été vérifié et validé par l'équipe Nexart.`,
        link: '/profile',
      })
    }

    // Email de notification
    const creatorName = adminCreators.find(c => c.user_id === userId)?.profiles?.full_name
    fetch('/api/verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, field, accepted: value, comment, creator_name: creatorName }),
    }).catch(() => {})

    setAdminSaving(null)
    showToast(value ? '✓ Vérifié — email envoyé' : '✗ Refusé — email envoyé')
  }

  const handleRefuseConfirm = async () => {
    if (!refuseModal) return
    await handleVerifyCreator(refuseModal.userId, refuseModal.field, false, refuseComment)
    setRefuseModal(null)
    setRefuseComment('')
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
    <div className="min-h-screen bg-gray-50">
      <div className="h-52 bg-[#06060f] animate-pulse" />
      <div className="max-w-[900px] mx-auto px-4 pt-8 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
        <div className="h-10 w-80 rounded-xl bg-gray-100 animate-pulse mb-7" />
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
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

        {/* ── Refuse Modal ── */}
        {refuseModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setRefuseModal(null); setRefuseComment('') } }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Refuser la vérification
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {refuseModal.field === 'siret_verified' ? 'SIRET' : 'RC Pro'} de <strong>{refuseModal.creatorName}</strong>
              </p>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Motif du refus <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>(envoyé en notification)</span>
              </label>
              <textarea
                value={refuseComment}
                onChange={(e) => setRefuseComment(e.target.value)}
                placeholder="Ex : Le document est illisible, le SIRET ne correspond pas au nom..."
                rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#374151' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => { setRefuseModal(null); setRefuseComment('') }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleRefuseConfirm}
                  disabled={!refuseComment.trim() || adminSaving !== null}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: !refuseComment.trim() ? '#F3F4F6' : '#111827', color: !refuseComment.trim() ? 'var(--text-tertiary)' : '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: !refuseComment.trim() ? 'not-allowed' : 'pointer' }}>
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Crop Modal ── */}
        {cropSrc && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Recadrer la photo</h3>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>Glisse pour repositionner · molette pour zoomer</p>
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
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Zoom</label>
                <input type="range" min="0.5" max="4" step="0.01" value={cropScale}
                  onChange={e => setCropScale(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#374151' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setCropSrc(null); if (cropImgRef.current) URL.revokeObjectURL(cropImgRef.current.src) }}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={confirmCrop}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', backgroundColor: '#111827', color: '#FFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
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
              <div style={{ width: '88px', height: '88px', borderRadius: '50%', backgroundColor: '#374151', overflow: 'hidden', border: '3px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {profile?.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '32px', fontWeight: '800', color: '#FFF' }}>{firstName[0]?.toUpperCase()}</span>
                }
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#374151', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {avatarUploading ? <div style={{ width: '10px', height: '10px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Upload size={11} color="#FFF" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </div>

            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{name}</h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>
                  <Shield size={12} /> Administrateur
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={13} /> {user?.email}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link href="/account"
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
                <Settings size={15} /> Mon profil
              </Link>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { label: 'Créateurs', value: adminCreators.length },
              { label: 'SIRET en attente', value: adminCreators.filter(c => !c.siret_verified && c.siret_number).length },
              { label: 'RC Pro en attente', value: adminCreators.filter(c => !c.insurance_verified && c.insurance_doc_url).length },
              { label: 'Marchés publiés', value: adminEvents.filter(e => e.status === 'published').length },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, minWidth: '140px', padding: '16px 20px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontWeight: '600' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E5E7EB', marginBottom: '28px' }}>
            {([
              { k: 'analytics', label: 'Analytiques' },
              { k: 'verifications', label: `Vérifications${pendingCreators.length > 0 ? ` (${pendingCreators.length})` : ''}` },
              { k: 'disciplines', label: `Disciplines${adminDiscProposals.filter(p => p.status === 'pending').length > 0 ? ` (${adminDiscProposals.filter(p => p.status === 'pending').length})` : ''}` },
              { k: 'marches', label: `Marchés (${adminEvents.length})` },
              { k: 'messages', label: `Messages${adminMessages.length > 0 ? ` (${adminMessages.length})` : ''}` },
              { k: 'abonnements', label: 'Abonnements' },
              { k: 'signalements', label: `Signalements${adminReports.filter(r => r.status === 'pending').length > 0 ? ` (${adminReports.filter(r => r.status === 'pending').length})` : ''}` },
            ] as const).map(t => (
              <button key={t.k} onClick={async () => {
                setAdminTab(t.k)
                if (t.k === 'analytics' && !analytics && !analyticsLoading) {
                  setAnalyticsLoading(true)
                  fetch('/api/admin/analytics').then(r => r.json()).then(d => { setAnalytics(d); setAnalyticsLoading(false) })
                }
                if (t.k === 'signalements' && adminReports.length === 0) {
                  const { data } = await supabase.from('reports').select('*, reporter:reporter_id(full_name)').order('created_at', { ascending: false }).limit(100)
                  setAdminReports((data as unknown as typeof adminReports) || [])
                }
              }}
                style={{
                  padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                  fontSize: '14px', fontWeight: adminTab === t.k ? '700' : '500',
                  color: adminTab === t.k ? '#111827' : 'var(--text-secondary)',
                  borderBottom: adminTab === t.k ? '2px solid #111827' : '2px solid transparent',
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
                  <div style={{ width: '36px', height: '36px', border: '3px solid #6B7280', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <>
                  {/* KPIs Utilisateurs */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <Users size={16} color="#6B7280" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Utilisateurs</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                      {[
                        { label: 'Total', value: analytics.users.total, sub: 'comptes créés' },
                        { label: 'Créateurs', value: analytics.users.creators, sub: `${analytics.users.total ? Math.round(analytics.users.creators / analytics.users.total * 100) : 0}% du total` },
                        { label: 'Organisateurs', value: analytics.users.organizers, sub: `${analytics.users.total ? Math.round(analytics.users.organizers / analytics.users.total * 100) : 0}% du total` },
                        { label: 'Cette semaine', value: analytics.users.new_week, sub: 'nouveaux inscrits', up: analytics.users.new_week > 0 },
                        { label: 'Ce mois', value: analytics.users.new_month, sub: 'nouveaux inscrits' },
                        { label: "Aujourd'hui", value: analytics.users.new_today, sub: 'inscrits aujourd\'hui' },
                      ].map(kpi => (
                        <div key={kpi.label} style={{ padding: '16px 18px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <p style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{kpi.value}</p>
                            {kpi.up && <ArrowUpRight size={16} color="#6B7280" />}
                          </div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 2px' }}>{kpi.label}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{kpi.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Croissance 30 jours */}
                  <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <TrendingUp size={16} color="#6B7280" />
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Inscriptions — 30 derniers jours</h3>
                    </div>
                    {analytics.dailySignups.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Aucune donnée</p>
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
                                  backgroundColor: d.count > 0 ? '#374151' : 'var(--border-color)',
                                  transition: 'height 0.3s ease',
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
                  <div style={{ display: 'grid', gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: '16px' }}>

                    {/* Événements */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Calendar size={16} color="#6B7280" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Événements</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{analytics.events.total}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { label: 'Publiés', value: analytics.events.published, color: 'var(--text-primary)' },
                          { label: 'Brouillons', value: analytics.events.draft, color: 'var(--text-primary)' },
                          { label: 'Fermés', value: analytics.events.closed, color: 'var(--text-primary)' },
                        ].map(item => {
                          const pct = analytics.events.total ? (item.value / analytics.events.total) * 100 : 0
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.value}</span>
                              </div>
                              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: item.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                        {analytics.eventTypes.length > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Par type</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {analytics.eventTypes.map(et => (
                                <span key={et.event_type} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                  {et.event_type} · {et.count}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Candidatures */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Package size={16} color="#6B7280" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Candidatures</h3>
                        <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{analytics.applications.total}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                          { label: 'En attente', value: analytics.applications.pending, color: 'var(--text-primary)' },
                          { label: 'Acceptées', value: analytics.applications.accepted, color: 'var(--text-primary)' },
                          { label: 'Refusées', value: analytics.applications.refused, color: 'var(--text-primary)' },
                        ].map(item => {
                          const pct = analytics.applications.total ? (item.value / analytics.applications.total) * 100 : 0
                          return (
                            <div key={item.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{item.label}</span>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>{item.value}</span>
                              </div>
                              <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: item.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                        {analytics.applications.total > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                              Taux d&apos;acceptation : <strong style={{ color: 'var(--text-primary)' }}>
                                {Math.round(analytics.applications.accepted / analytics.applications.total * 100)}%
                              </strong>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vérifications + Messages */}
                  <div style={{ display: 'grid', gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: '16px' }}>

                    {/* Vérifications */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Shield size={16} color="#6B7280" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Vérifications</h3>
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
                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>{v.label}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v.ok}/{v.total} · {v.pending > 0 && <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>{v.pending} en attente</span>}</span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#374151', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Messages + Abonnements */}
                    <div style={{ padding: '20px 24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <MessageSquare size={16} color="#6B7280" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Activité</h3>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Messages envoyés</span>
                          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{analytics.messages.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Ratio créateurs/orga</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
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
                        <BarChart2 size={16} color="#6B7280" />
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>KPI Business</h3>
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
                            { label: 'Conversion créateurs', value: `${convCr}%`, sub: `${k.conversionCreator.active}/${k.conversionCreator.total} actifs`, target: '> 40 %' },
                            { label: 'Conversion organisateurs', value: `${convOrg}%`, sub: `${k.conversionOrganizer.active}/${k.conversionOrganizer.total} actifs`, target: '> 60 %' },
                            { label: 'Taux de remplissage', value: `${fill}%`, sub: `${k.fillRate.filled_stands}/${k.fillRate.total_stands} stands`, target: '> 70 %' },
                            { label: 'Liquidité marketplace', value: liq !== null ? `${liq}h` : '—', sub: liq !== null ? '1ère candidature' : 'Pas de données', target: '< 48h' },
                            { label: 'Rétention J30', value: ret !== null ? `${ret}%` : '—', sub: ret !== null ? `${k.retention30.retained}/${k.retention30.cohort_total}` : 'Cohorte vide', target: '> 40 %' },
                          ].map(kpi => (
                            <div key={kpi.label} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                              <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 2px', lineHeight: 1 }}>{kpi.value}</p>
                              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 2px' }}>{kpi.label}</p>
                              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>{kpi.sub}</p>
                              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', margin: 0 }}>Cible : {kpi.target}</p>
                            </div>
                          ))
                        })()}
                      </div>

                      <div style={{ padding: '16px 20px', borderRadius: '12px', border: '1px dashed #E5E7EB', backgroundColor: 'var(--bg-secondary)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <CreditCard size={15} color="#9CA3AF" />
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>KPI financiers (Stripe requis)</span>
                        {['MRR', 'GMV', 'ARPU', 'Churn', 'LTV/CAC'].map(f => (
                          <span key={f} style={{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
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
            <div className="flex flex-col gap-0">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {([
                  { k: 'pending', label: `En attente (${pendingCreators.length})` },
                  { k: 'all', label: `Tous (${adminCreators.length})` },
                ] as const).map(f => (
                  <button key={f.k} onClick={() => setAdminFilter(f.k)}
                    style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: adminFilter === f.k ? '#111827' : '#F3F4F6', color: adminFilter === f.k ? '#FFF' : '#4B5563' }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {displayedCreators.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                  <CheckCircle size={40} color="#10B981" style={{ marginBottom: '12px' }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Tout est vérifié ✓</p>
                  <p style={{ fontSize: '14px', color: '#888' }}>Aucune demande en attente.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {displayedCreators.map(c => (
                    <div key={c.user_id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {c.profiles?.avatar_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={c.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <User size={18} color="#FFF" />
                          }
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{c.profiles?.full_name ?? 'Créateur'}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'monospace' }}>{c.user_id.slice(0, 8)}…</p>
                        </div>
                        {/* Ban toggle */}
                        <button
                          onClick={async () => {
                            const banned = (c.profiles as unknown as { is_banned?: boolean })?.is_banned
                            await supabase.from('profiles').update({ is_banned: !banned }).eq('id', c.user_id)
                            setAdminCreators(prev => prev.map(x => x.user_id === c.user_id
                              ? { ...x, profiles: x.profiles ? { ...x.profiles, is_banned: !banned } as typeof x.profiles : x.profiles }
                              : x
                            ))
                          }}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            backgroundColor: (c.profiles as unknown as { is_banned?: boolean })?.is_banned ? '#FEF2F2' : '#F3F4F6',
                            borderColor: (c.profiles as unknown as { is_banned?: boolean })?.is_banned ? '#FECACA' : 'var(--border-color)',
                            color: (c.profiles as unknown as { is_banned?: boolean })?.is_banned ? '#EF4444' : '#6B7280',
                          }}>
                          {(c.profiles as unknown as { is_banned?: boolean })?.is_banned ? 'Débannir' : 'Bannir'}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>

                        {/* SIRET block */}
                        {(() => {
                          const siretRefused = refusedSet.has(`${c.user_id}-siret_verified`)
                          const siretStatus = c.siret_verified ? 'verified' : siretRefused ? 'refused' : 'pending'
                          return (
                            <div style={{ flex: 1, minWidth: '240px', padding: '14px', borderRadius: '10px', border: `1px solid ${siretStatus === 'refused' ? '#FECACA' : 'var(--border-color)'}`, backgroundColor: siretStatus === 'refused' ? '#FFF5F5' : '#FAFAFA' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>SIRET</p>
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                                  backgroundColor: siretStatus === 'verified' ? '#374151' : siretStatus === 'refused' ? '#FEE2E2' : 'var(--border-color)',
                                  color: siretStatus === 'verified' ? '#FFF' : siretStatus === 'refused' ? '#EF4444' : '#6B7280' }}>
                                  {siretStatus === 'verified' ? 'Vérifié' : siretStatus === 'refused' ? 'Refusé' : 'En attente'}
                                </span>
                              </div>
                              {c.siret_number ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '1px', margin: 0, fontFamily: 'monospace' }}>{c.siret_number}</p>
                                  <a href={`https://pappers.fr/entreprise/${c.siret_number}`} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>
                                    <ExternalLink size={10} /> Pappers
                                  </a>
                                </div>
                              ) : (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>Non renseigné</p>
                              )}
                              {siretStatus === 'pending' && c.siret_number && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', true)}
                                    disabled={adminSaving === `${c.user_id}-siret_verified`}
                                    style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: '#111827', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <CheckCircle size={12} /> Valider
                                  </button>
                                  <button onClick={() => { setRefuseModal({ userId: c.user_id, field: 'siret_verified', creatorName: c.profiles?.full_name || 'ce créateur' }); setRefuseComment('') }}
                                    disabled={adminSaving === `${c.user_id}-siret_verified`}
                                    style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                    <XCircle size={13} />
                                  </button>
                                </div>
                              )}
                              {siretStatus === 'refused' && (
                                <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', true)}
                                  style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Re-examiner
                                </button>
                              )}
                              {siretStatus === 'verified' && (
                                <button onClick={() => handleVerifyCreator(c.user_id, 'siret_verified', false)}
                                  style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  Révoquer
                                </button>
                              )}
                            </div>
                          )
                        })()}

                        {/* RC Pro block */}
                        {(() => {
                          const insRefused = refusedSet.has(`${c.user_id}-insurance_verified`)
                          const insStatus = c.insurance_verified ? 'verified' : insRefused ? 'refused' : c.insurance_doc_url ? 'doc' : 'none'
                          return (
                            <div style={{ flex: 1, minWidth: '240px', padding: '14px', borderRadius: '10px', border: `1px solid ${insStatus === 'refused' ? '#FECACA' : 'var(--border-color)'}`, backgroundColor: insStatus === 'refused' ? '#FFF5F5' : '#FAFAFA' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>RC Pro</p>
                                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                                  backgroundColor: insStatus === 'verified' ? '#374151' : insStatus === 'refused' ? '#FEE2E2' : insStatus === 'doc' ? '#EEF2FF' : 'var(--border-color)',
                                  color: insStatus === 'verified' ? '#FFF' : insStatus === 'refused' ? '#EF4444' : insStatus === 'doc' ? '#6366F1' : '#6B7280' }}>
                                  {insStatus === 'verified' ? 'Vérifié' : insStatus === 'refused' ? 'Refusé' : insStatus === 'doc' ? 'Doc reçu' : 'Aucun doc'}
                                </span>
                              </div>
                              {c.insurance_doc_url ? (
                                <a href={c.insurance_doc_url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600', marginBottom: '10px' }}>
                                  <FileText size={13} /> Voir le document <ExternalLink size={11} />
                                </a>
                              ) : (
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>Aucun document</p>
                              )}
                              {insStatus === 'doc' && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', true)}
                                    disabled={adminSaving === `${c.user_id}-insurance_verified`}
                                    style={{ flex: 1, padding: '7px', borderRadius: '7px', border: 'none', backgroundColor: '#111827', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <CheckCircle size={12} /> Valider
                                  </button>
                                  <button onClick={() => { setRefuseModal({ userId: c.user_id, field: 'insurance_verified', creatorName: c.profiles?.full_name || 'ce créateur' }); setRefuseComment('') }}
                                    disabled={adminSaving === `${c.user_id}-insurance_verified`}
                                    style={{ padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                    <XCircle size={13} />
                                  </button>
                                </div>
                              )}
                              {insStatus === 'refused' && (
                                <button onClick={() => { setRefusedSet(prev => { const s = new Set(prev); s.delete(`${c.user_id}-insurance_verified`); return s }) }}
                                  style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                                  Re-examiner
                                </button>
                              )}
                              {insStatus === 'verified' && (
                                <button onClick={() => handleVerifyCreator(c.user_id, 'insurance_verified', false)}
                                  style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  Révoquer
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Organisateurs ── */}
              {(() => {
              const pendingOrgas = adminOrgaVerifs.filter(o => !o.siret_verified && !o.verification_doc_verified && (o.siret_number || o.verification_doc_url))
              const displayOrgas = orgaVerifFilter === 'pending' ? pendingOrgas : adminOrgaVerifs.filter(o => o.siret_number || o.verification_doc_url)
              return (
                <div style={{ marginTop: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Organisateurs à vérifier</h3>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {([
                        { k: 'pending', label: `En attente (${pendingOrgas.length})` },
                        { k: 'all', label: `Tous (${adminOrgaVerifs.filter(o => o.siret_number || o.verification_doc_url).length})` },
                      ] as const).map(f => (
                        <button key={f.k} onClick={() => setOrgaVerifFilter(f.k)}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', backgroundColor: orgaVerifFilter === f.k ? '#111827' : '#F3F4F6', color: orgaVerifFilter === f.k ? '#FFF' : '#4B5563' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {displayOrgas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                      <CheckCircle size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '14px', color: '#888' }}>Aucune demande organisateur en attente</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {displayOrgas.map(o => (
                        <div key={o.user_id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                              {o.profiles?.avatar_url
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={o.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <User size={16} color="#FFF" />}
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{o.profiles?.full_name ?? 'Organisateur'}</p>
                              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontFamily: 'monospace' }}>{o.user_id.slice(0, 8)}…</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {/* SIRET */}
                            {o.siret_number && (
                              <div style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SIRET</p>
                                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: o.siret_verified ? '#ECFDF5' : '#F3F4F6', color: o.siret_verified ? '#059669' : '#6B7280' }}>
                                    {o.siret_verified ? 'Vérifié' : 'En attente'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '1px', margin: 0 }}>{o.siret_number}</p>
                                  <a href={`https://pappers.fr/entreprise/${o.siret_number}`} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: '11px', color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>Pappers →</a>
                                </div>
                                {!o.siret_verified && (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleAdminVerifyOrga(o.user_id, 'siret_verified', true)} disabled={orgaVerifSaving === `${o.user_id}-siret_verified`}
                                      style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                      <CheckCircle size={12} /> Valider
                                    </button>
                                    <button onClick={() => handleAdminVerifyOrga(o.user_id, 'siret_verified', false)} disabled={orgaVerifSaving === `${o.user_id}-siret_verified`}
                                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                      <XCircle size={13} />
                                    </button>
                                  </div>
                                )}
                                {o.siret_verified && (
                                  <button onClick={() => handleAdminVerifyOrga(o.user_id, 'siret_verified', false)}
                                    style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Révoquer</button>
                                )}
                              </div>
                            )}
                            {/* Document */}
                            {o.verification_doc_url && (
                              <div style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document</p>
                                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: o.verification_doc_verified ? '#ECFDF5' : '#EEF2FF', color: o.verification_doc_verified ? '#059669' : '#6366F1' }}>
                                    {o.verification_doc_verified ? 'Vérifié' : 'Doc reçu'}
                                  </span>
                                </div>
                                <a href={o.verification_doc_url} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '600', marginBottom: '8px' }}>
                                  <FileText size={13} /> Voir le document <ExternalLink size={11} />
                                </a>
                                {!o.verification_doc_verified && (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button onClick={() => handleAdminVerifyOrga(o.user_id, 'verification_doc_verified', true)} disabled={orgaVerifSaving === `${o.user_id}-verification_doc_verified`}
                                      style={{ flex: 1, padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: '#111827', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                      <CheckCircle size={12} /> Valider
                                    </button>
                                  </div>
                                )}
                                {o.verification_doc_verified && (
                                  <button onClick={() => handleAdminVerifyOrga(o.user_id, 'verification_doc_verified', false)}
                                    style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Révoquer</button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
            </div>
          )}

          {/* ── Tab: Disciplines ── */}
          {adminTab === 'disciplines' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-bold text-gray-900">Propositions de disciplines</h2>
                <span className="text-xs text-gray-400">{adminDiscProposals.filter(p => p.status === 'pending').length} en attente</span>
              </div>
              {adminDiscProposals.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200">
                  <LayoutGrid size={32} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Aucune proposition pour le moment</p>
                </div>
              ) : (
                adminDiscProposals.map(p => (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Par {(p as unknown as { profiles?: { full_name?: string } })?.profiles?.full_name ?? 'Créateur'} · {new Date(p.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {p.status === 'pending' ? (
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleAdminDiscProposal(p.id, 'approved')}
                          disabled={discProposalSaving === p.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold border-0 cursor-pointer hover:bg-emerald-500 transition-colors disabled:opacity-50">
                          <CheckCircle size={13} /> Approuver
                        </button>
                        <button
                          onClick={() => handleAdminDiscProposal(p.id, 'rejected')}
                          disabled={discProposalSaving === p.id}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold border-0 cursor-pointer hover:bg-gray-200 transition-colors disabled:opacity-50">
                          <XCircle size={13} /> Refuser
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                        p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'
                      }`}>
                        {p.status === 'approved' ? 'Approuvée' : 'Refusée'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Tab: Marchés ── */}
          {adminTab === 'marches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {adminEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                  <Calendar size={40} color="#D1D5DB" style={{ marginBottom: '12px' }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Aucun marché créé</p>
                </div>
              ) : adminEvents.map(ev => {
                const sc = STATUS_CONFIG[ev.status] ?? STATUS_CONFIG.draft
                return (
                  <div key={ev.id} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--border-color)' }}>
                      {ev.cover_image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={ev.cover_image} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={20} color="#FFF" /></div>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', backgroundColor: sc.bg, color: sc.color, flexShrink: 0 }}>{sc.label}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                        {EVENT_TYPE_LABELS[ev.event_type] ?? ev.event_type}
                        {ev.city ? ` · ${ev.city}` : ''}
                        {ev.start_date ? ` · ${new Date(ev.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                      </p>
                      {ev.profiles?.full_name && (
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>par {ev.profiles.full_name}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleEventStatus(ev.id, ev.status)}
                        disabled={adminSaving === ev.id}
                        title={ev.status === 'published' ? 'Mettre en brouillon' : 'Publier'}
                        style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ev.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button
                        onClick={() => { if (window.confirm(`Supprimer "${ev.title}" ?`)) handleDeleteEvent(ev.id) }}
                        disabled={deletingEvent === ev.id}
                        title="Supprimer"
                        style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                  <Send size={16} color="#6B7280" />
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Nouveau message</h3>
                </div>

                {/* Recipient search */}
                <div style={{ marginBottom: '14px', position: 'relative' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Destinataire</label>
                  {msgRecipient ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: '2px solid #374151', backgroundColor: 'var(--bg-secondary)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {msgRecipient.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={msgRecipient.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '13px', fontWeight: '800', color: '#FFF' }}>{msgRecipient.full_name[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>{msgRecipient.full_name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>{msgRecipient.role ?? 'utilisateur'}</p>
                      </div>
                      <button onClick={() => { setMsgRecipient(null); setMsgSearch('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
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
                        style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                      {msgSuggestions.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '4px', overflow: 'hidden' }}>
                          {msgSuggestions.map(s => (
                            <button key={s.id} onClick={() => { setMsgRecipient(s); setMsgSearch(s.full_name); setMsgSuggestions([]) }}
                              style={{ width: '100%', padding: '10px 14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                {s.avatar_url
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <span style={{ fontSize: '12px', fontWeight: '800', color: '#FFF' }}>{s.full_name[0]?.toUpperCase()}</span>
                                }
                              </div>
                              <div>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{s.full_name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, textTransform: 'capitalize' }}>{s.role ?? 'utilisateur'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {msgSearch.length >= 2 && msgSuggestions.length === 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '14px', marginTop: '4px', textAlign: 'center' }}>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Aucun utilisateur trouvé</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Objet <span style={{ color: '#D1D5DB', fontWeight: '400' }}>(optionnel)</span></label>
                  <input
                    value={msgSubject}
                    onChange={e => setMsgSubject(e.target.value)}
                    placeholder="Ex : Votre compte a été vérifié"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Message</label>
                  <textarea
                    value={msgContent}
                    onChange={e => setMsgContent(e.target.value)}
                    placeholder="Tapez votre message ici…"
                    rows={4}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', lineHeight: '1.6', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSendMessage}
                    disabled={msgSending || !msgRecipient || !msgContent.trim()}
                    style={{
                      padding: '11px 24px', borderRadius: '8px', border: 'none',
                      backgroundColor: msgRecipient && msgContent.trim() ? '#111827' : 'var(--border-color)',
                      color: msgRecipient && msgContent.trim() ? '#FFF' : 'var(--text-tertiary)',
                      fontSize: '14px', fontWeight: '700', cursor: msgRecipient && msgContent.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: 'none',
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
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Envoyés</h3>
                  <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontWeight: '600' }}>{adminMessages.length}</span>
                </div>

                {adminMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
                    <MessageSquare size={32} color="#D1D5DB" style={{ marginBottom: '10px' }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Aucun message envoyé</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adminMessages.map(msg => (
                      <div key={msg.id} style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
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
                              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{msg.recipient?.full_name ?? 'Utilisateur'}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px', textTransform: 'capitalize' }}>{msg.recipient?.role ?? ''}</span>
                              {msg.subject && <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', margin: '2px 0 0' }}>{msg.subject}</p>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {msg.read_at
                                ? <span title="Lu"><CheckCheck size={13} color="#10B981" /></span>
                                : <span title="Non lu"><Clock size={13} color="#9CA3AF" /></span>
                              }
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                {' '}
                                {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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

          {/* ── Tab: Abonnements ── */}
          {adminTab === 'abonnements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px' }}>Modifier l&apos;abonnement d&apos;un utilisateur</h3>

                {/* Recherche */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    value={subSearch}
                    onChange={async e => {
                      const q = e.target.value
                      setSubSearch(q)
                      if (q.length < 2) { setSubResults([]); return }
                      setSubSearching(true)
                      try {
                        const res = await fetch(`/api/admin/search-users?q=${encodeURIComponent(q)}`)
                        const json = await res.json()
                        setSubResults(json.users || [])
                      } catch {
                        setSubResults([])
                      }
                      setSubSearching(false)
                    }}
                    placeholder="Rechercher un utilisateur par nom…"
                    style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', backgroundColor: 'var(--bg-primary)' }}
                  />
                  {subSearching && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                      <div style={{ width: '14px', height: '14px', border: '2px solid var(--border-color)', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  )}
                </div>

                {subToast && (
                  <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: '#065F46', fontWeight: '600', margin: 0 }}>{subToast}</p>
                  </div>
                )}

                {/* Résultats */}
                {subResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {subResults.map(u => {
                      const TIERS = [
                        { value: 'free',        label: 'Gratuit',         role: 'creator' },
                        { value: 'boost',       label: 'Boost — 5,99€',   role: 'creator' },
                        { value: 'pro',         label: 'Pro — 14,99€',    role: 'creator' },
                        { value: 'premium',     label: 'Premium — 29,99€',role: 'creator' },
                        { value: 'org_pro',     label: 'Org Pro — 29€',   role: 'organizer' },
                        { value: 'org_studio',  label: 'Org Studio — 79€',role: 'organizer' },
                      ]
                      const relevantTiers = u.role === 'organizer'
                        ? TIERS.filter(t => t.role === 'organizer' || t.value === 'free')
                        : TIERS.filter(t => t.role === 'creator')

                      const currentTier = u.subscription_tier || 'free'
                      const TIER_COLORS: Record<string, string> = {
                        free: 'var(--text-tertiary)', boost: '#6366F1', pro: '#8B5CF6',
                        premium: '#EC4899', org_pro: '#0EA5E9', org_studio: '#F59E0B',
                      }

                      return (
                        <div key={u.id} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          {/* Avatar */}
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF' }}>{u.full_name?.[0]?.toUpperCase()}</span>
                          </div>

                          {/* Infos */}
                          <div style={{ flex: 1, minWidth: '140px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 3px' }}>{u.full_name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{u.role}</span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: TIER_COLORS[currentTier] || 'var(--text-tertiary)', backgroundColor: 'var(--bg-secondary)', padding: '2px 7px', borderRadius: '99px' }}>
                                {currentTier}
                              </span>
                            </div>
                          </div>

                          {/* Sélecteur tier */}
                          <select
                            value={currentTier}
                            onChange={async e => {
                              const newTier = e.target.value
                              setSubSaving(u.id)
                              const res = await fetch('/api/admin/set-tier', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ user_id: u.id, tier: newTier }),
                              })
                              if (res.ok) {
                                setSubResults(prev => prev.map(x => x.id === u.id ? { ...x, subscription_tier: newTier } : x))
                                setSubToast(`✓ Abonnement de ${u.full_name} changé en "${newTier}"`)
                                setTimeout(() => setSubToast(null), 3000)
                              } else {
                                const d = await res.json().catch(() => ({}))
                                setSubToast(`Erreur Erreur : ${d.error || 'inconnue'}`)
                                setTimeout(() => setSubToast(null), 4000)
                              }
                              setSubSaving(null)
                            }}
                            disabled={subSaving === u.id}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', fontFamily: 'inherit', backgroundColor: 'var(--bg-primary)', cursor: 'pointer', minWidth: '180px' }}
                          >
                            {relevantTiers.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>

                          {subSaving === u.id && (
                            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {subSearch.length >= 2 && !subSearching && subResults.length === 0 && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Aucun utilisateur trouvé</p>
                )}

                <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                    ⚠️ Ces changements sont immédiats. Ils ne créent pas d&apos;abonnement Stripe — uniquement une mise à jour manuelle en base. À utiliser pour les tests ou les exceptions clients.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Signalements ── */}
          {adminTab === 'signalements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Signalements ({adminReports.filter(r => r.status === 'pending').length} en attente)
                </h3>
              </div>
              {adminReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '12px', border: '1px dashed #E5E7EB', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Aucun signalement
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {adminReports.map(r => (
                    <div key={r.id} style={{ padding: '14px 16px', borderRadius: '10px', border: `1px solid ${r.status === 'pending' ? '#FDE68A' : 'var(--border-color)'}`, backgroundColor: r.status === 'pending' ? '#FFFBEB' : '#FAFAFA', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 2px' }}>
                          {r.target_type === 'creator' ? 'Créateur' : r.target_type === 'event' ? 'Événement' : 'Post'} signalé
                          <span style={{ fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '6px' }}>par {r.reporter?.full_name || 'utilisateur'}</span>
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 2px' }}>{r.reason}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', shrink: 0 } as React.CSSProperties}>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={async () => {
                              await supabase.from('reports').update({ status: 'reviewed' }).eq('id', r.id)
                              setAdminReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'reviewed' } : x))
                            }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                              Vu
                            </button>
                            <button onClick={async () => {
                              await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id)
                              setAdminReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'dismissed' } : x))
                            }} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                              Ignorer
                            </button>
                          </>
                        )}
                        {r.status !== 'pending' && (
                          <span style={{ fontSize: '12px', fontWeight: '600', color: r.status === 'reviewed' ? '#10B981' : 'var(--text-tertiary)', padding: '4px 8px', borderRadius: '6px', backgroundColor: r.status === 'reviewed' ? '#ECFDF5' : '#F3F4F6' }}>
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

        </motion.div>

        {toast && (
          <div style={{ position: 'fixed', bottom: '24px', right: '16px', left: '16px', maxWidth: '400px', marginLeft: 'auto', padding: '12px 20px', borderRadius: '10px', backgroundColor: 'var(--text-primary)', color: '#FFF', fontSize: '14px', fontWeight: '600', zIndex: 999, animation: 'fadeIn 0.2s ease' }}>
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
  const isCreatorRole = profile?.role === 'creator' || profile?.role === 'artisan' || profile?.is_creator === true || creator !== null
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

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes glow{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.7;transform:scale(1.08)}}`}</style>

      {/* ── Crop Modal ── */}
      {cropSrc && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[380px] shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 mb-1">Recadrer la photo</h3>
            <p className="text-sm text-gray-400 mb-5">Glisse pour repositionner · molette pour zoomer</p>
            <div className="flex justify-center mb-5">
              <canvas
                ref={cropCanvasRef}
                width={300} height={300}
                className="rounded-full block select-none"
                style={{ cursor: cropDragging ? 'grabbing' : 'grab' }}
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
            <div className="mb-4">
              <label className="text-xs text-gray-400 font-semibold block mb-1.5">Zoom</label>
              <input type="range" min="0.5" max="4" step="0.01" value={cropScale}
                onChange={e => setCropScale(parseFloat(e.target.value))}
                className="w-full accent-indigo-600" />
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => { setCropSrc(null); if (cropImgRef.current) URL.revokeObjectURL(cropImgRef.current.src) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold cursor-pointer hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={confirmCrop}
                className="flex-1 py-2.5 rounded-xl border-0 bg-indigo-600 text-white text-sm font-bold cursor-pointer hover:bg-indigo-500 transition-colors">
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

        {/* ═══ DARK HERO ═══════════════════════════════════════════════════════════ */}
        <div className="relative bg-[#06060f] overflow-hidden pt-24 pb-12">
          {/* Banner image */}
          {profile?.banner_url && (
            <div className="absolute inset-0 z-0">
              <img src={profile.banner_url} alt="" className="w-full h-full object-cover opacity-25" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#06060f]/70 to-[#06060f]" />
            </div>
          )}
          {!profile?.banner_url && (
            <>
              <div className="absolute inset-0 opacity-[0.10] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="absolute top-[10%] left-[20%] w-80 h-80 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', animation: 'glow 6s ease-in-out infinite' }} />
              <div className="absolute bottom-0 right-[15%] w-60 h-60 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', animation: 'glow 8s ease-in-out infinite 2s' }} />
            </>
          )}
          {/* Banner upload button (edit mode) */}
          {editing && (
            <button onClick={() => bannerRef.current?.click()}
              className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white/60 text-xs font-semibold hover:bg-white/20 transition-all">
              {bannerUploading
                ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Upload size={12} />}
              {profile?.banner_url ? 'Changer la bannière' : 'Ajouter une bannière'}
            </button>
          )}
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />

          <div className="max-w-[900px] mx-auto px-6 relative z-10">
            <div className="flex gap-7 items-start flex-wrap">

              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 bg-gray-900">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-600">
                      <span className="text-4xl font-black text-white">{firstName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                  className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center cursor-pointer">
                  {avatarUploading
                    ? <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full" style={{ animation: 'spin 1s linear infinite' }} />
                    : <Upload size={13} className="text-white" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-[200px]">
                {editing ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom complet"
                    className="text-[22px] font-bold text-white bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 mb-2.5 w-full outline-none" />
                ) : (
                  <h1 className="text-2xl sm:text-[26px] font-black text-white mb-1.5 tracking-tight">{name}</h1>
                )}

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {(profile?.role === 'creator' || profile?.role === 'artisan' || (profile?.is_creator && profile?.role !== 'organizer')) && (
                    <span className="px-3 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      {profile?.role === 'artisan' ? 'Artisan' : 'Créateur'}
                    </span>
                  )}
                  {(profile?.role === 'organizer' || profile?.is_organizer) && (
                    <span className="px-3 py-0.5 rounded-full bg-violet-500/25 text-violet-300 text-xs font-bold border border-violet-500/30">
                      Organisateur
                    </span>
                  )}
                  {(profile?.role === 'organizer' && profile?.is_creator) && (
                    <span className="px-3 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      Créateur
                    </span>
                  )}
                  {creator?.siret_verified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/20">
                      <BadgeCheck size={12} /> SIRET
                    </span>
                  )}
                  {creator?.insurance_verified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/20">
                      <BadgeCheck size={12} /> RC Pro
                    </span>
                  )}
                  {avgRating && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                      <Star size={11} fill="currentColor" /> {avgRating}
                    </span>
                  )}
                  {(() => {
                    const tier = profile?.subscription_tier ?? 'free'
                    const tierLabel: Record<string, string> = {
                      free: 'Gratuit', boost: 'Boost', pro: 'Pro', premium: 'Premium', org_pro: 'Org Pro', org_studio: 'Org Studio',
                    }
                    return (
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/50 text-xs font-semibold border border-white/15">
                        {tierLabel[tier] ?? 'Gratuit'}
                      </span>
                    )
                  })()}
                </div>

                <div className="flex gap-3 flex-wrap mb-3.5 text-[13px] text-white/50">
                  {creator?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {creator.city}{creator.region ? `, ${creator.region}` : ''}
                    </span>
                  )}
                  {creator?.travel_radius && (
                    <span>· {RADIUS_LABELS[creator.travel_radius] ?? creator.travel_radius}</span>
                  )}
                  <span className="flex items-center gap-1 text-white/35">
                    <Mail size={12} /> {user?.email}
                  </span>
                </div>

                {(creator?.disciplines ?? []).length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {creator!.disciplines.slice(0, 4).map(d => (
                      <span key={d} className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/7 text-white/60 border border-white/10">{d}</span>
                    ))}
                    {creator!.disciplines.length > 4 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-white/35 border border-white/8">+{creator!.disciplines.length - 4}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 self-start">
                {editing ? (
                  <>
                    <button onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold border-0 cursor-pointer hover:bg-indigo-500 transition-colors whitespace-nowrap">
                      <Save size={14} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white/8 text-white/60 border border-white/12 text-sm cursor-pointer hover:bg-white/12 transition-colors">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold border-0 cursor-pointer hover:bg-indigo-500 transition-colors whitespace-nowrap">
                      <Edit3 size={14} /> Modifier le profil
                    </button>
                    <button onClick={() => router.push('/creators/' + user?.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/6 text-white/50 border border-white/10 text-sm cursor-pointer hover:bg-white/10 transition-colors whitespace-nowrap">
                      <ChevronRight size={14} /> Voir mon profil
                    </button>
                  </>
                )}
              </div>

            </div>{/* end flex row */}
          </div>{/* end max-width */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/6" />
        </div>{/* end dark hero */}

        {/* ═══ CONTENT AREA ══════════════════════════════════════════════════════ */}
        <div className="max-w-[900px] mx-auto px-4 pb-20">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-7 mb-8">
            {[
              { label: 'Candidatures', value: applications.length, icon: <Calendar size={18} className="text-indigo-600" /> },
              { label: 'Acceptées',    value: acceptedCount,       icon: <CheckCircle size={18} className="text-indigo-600" /> },
              { label: 'Avis reçus',  value: reviews.length,      icon: <Star size={18} className="text-indigo-600" /> },
              { label: 'Note moy.',   value: avgRating ?? '—',    icon: <Award size={18} className="text-indigo-600" /> },
              { label: 'Vues ce mois', value: profileViews,       icon: <Eye size={18} className="text-indigo-600" /> },
            ].map(s => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">{s.icon}</div>
                <p className="text-2xl font-black text-gray-900 leading-none mb-1">{s.value}</p>
                <p className="text-[11px] font-semibold text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Profile completion banner */}
          {isCreatorRole && completionMissing.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-indigo-900">Profil complété {completionDone}/6</span>
                  <span className="text-xs font-semibold text-indigo-600">{Math.round((completionDone / 6) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-indigo-200 overflow-hidden mb-2.5">
                  <div className="h-full rounded-full bg-indigo-600 transition-all duration-700" style={{ width: `${(completionDone / 6) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {completionMissing.map(f => (
                    <span key={f} className="px-2.5 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-xs font-semibold text-indigo-700">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pill tabs */}
          <div className="flex gap-1 mb-7 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
            {([
              { key: 'profil',       label: 'Profil',        icon: <User size={14} /> },
              { key: 'portfolio',    label: 'Portfolio',     icon: <LayoutGrid size={14} /> },
              { key: 'candidatures', label: `Candidatures${applications.length ? ` (${applications.length})` : ''}`, icon: <Calendar size={14} /> },
              { key: 'avis',         label: `Avis${reviews.length ? ` (${reviews.length})` : ''}`, icon: <Award size={14} /> },
              { key: 'posts',        label: `Posts${myPosts.length ? ` (${myPosts.length})` : ''}`,   icon: <Rss size={14} /> },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 border-0 cursor-pointer ${
                  tab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

        {/* ── Tab: Profil ── */}
        {tab === 'profil' && (
          <div className="flex flex-col gap-5">

            {/* Carte unique avec toutes les sections */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

              {/* Bio */}
              <div className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bio</p>
                </div>
                {editing ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">Pseudo / Nom d&apos;affichage</label>
                      <input value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="ex : sophie.ceramiques"
                        onKeyDown={async e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            await supabase.from('profiles').update({ username: editUsername || null }).eq('id', user!.id)
                            setToast('Pseudo enregistré')
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400 text-gray-900" />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                      <div onClick={() => setEditShowRealName(v => !v)} className="relative shrink-0 cursor-pointer"
                        style={{ width: '40px', height: '22px', borderRadius: '99px', backgroundColor: editShowRealName ? '#6366F1' : '#CBD5E1', transition: 'background 200ms' }}>
                        <div style={{ position: 'absolute', top: '3px', left: editShowRealName ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-none mb-0.5">Afficher mon vrai nom</p>
                        <p className="text-xs text-gray-400">{editShowRealName ? 'Visible publiquement' : 'Seul le pseudo est affiché'}</p>
                      </div>
                    </label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Décrivez votre activité, votre style, ce qui vous rend unique…" rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-y outline-none focus:border-indigo-400 text-gray-900 leading-relaxed" />
                  </div>
                ) : (
                  <div>
                    {(profile as unknown as { username?: string })?.username && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-indigo-600">@{(profile as unknown as { username?: string }).username}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{(profile as unknown as { show_real_name?: boolean })?.show_real_name !== false ? 'Nom visible' : 'Nom masqué'}</span>
                      </div>
                    )}
                    <p className={`text-sm leading-relaxed ${profile?.bio ? 'text-gray-600' : 'text-gray-400'}`}>
                      {profile?.bio ?? 'Aucune bio renseignée — cliquez sur "Modifier le profil".'}
                    </p>
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Disciplines */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Disciplines</p>
                {editing ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {DISCIPLINES.map(d => {
                        const sel = editDisc.includes(d)
                        return (
                          <button key={d} onClick={() => toggleDisc(d)}
                            className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all border ${
                              sel ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-bold' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 font-medium'
                            }`}>
                            {d}
                          </button>
                        )
                      })}
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-[11px] font-semibold text-gray-400 mb-2">Proposer une discipline manquante</p>
                      <div className="flex gap-2">
                        <input value={discProposalInput} onChange={e => setDiscProposalInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleProposeDisc()}
                          placeholder="Ex : Poterie Raku, Marionnettes..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                        <button onClick={handleProposeDisc} disabled={!discProposalInput.trim() || discProposalSending}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold border-0 cursor-pointer hover:bg-indigo-500 disabled:opacity-40">
                          {discProposalSending ? '…' : 'Proposer'}
                        </button>
                      </div>
                      {myDiscProposals.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-1.5">
                          {myDiscProposals.map(p => (
                            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50">
                              <span className="text-sm text-gray-700">{p.name}</span>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : p.status === 'rejected' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                                {p.status === 'approved' ? 'Approuvée' : p.status === 'rejected' ? 'Refusée' : 'En attente'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(creator?.disciplines ?? []).length > 0
                      ? creator!.disciplines.map(d => (
                          <span key={d} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100">{d}</span>
                        ))
                      : <span className="text-sm text-gray-400">Aucune discipline renseignée</span>
                    }
                    {myDiscProposals.filter(p => p.status === 'pending').length > 0 && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-100">
                        <Clock size={11} /> {myDiscProposals.filter(p => p.status === 'pending').length} en attente
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Localisation */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Localisation & déplacement</p>
                {editing ? (
                  <div className="flex flex-col gap-2.5">
                    <div ref={cityContainerRef} className="relative">
                      <div className="flex gap-2.5">
                        <input value={cityQuery}
                          onChange={e => {
                            const q = e.target.value
                            setCityQuery(q); setEditCity(q); setCityDropdownOpen(true)
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
                                  nom: c.nom, region: c.region?.nom ?? '', departement: c.departement?.nom ?? '', codesPostaux: c.codesPostaux ?? [],
                                })))
                              } catch { setCitySuggestions([]) }
                            }, 250)
                          }}
                          onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                          onFocus={() => citySuggestions.length > 0 && setCityDropdownOpen(true)}
                          placeholder="Ville ou code postal" autoComplete="off"
                          className="flex-[2] px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                        <input value={editPostalCode}
                          onChange={e => setEditPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                          placeholder="Code postal" maxLength={5}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono outline-none focus:border-indigo-400" />
                      </div>
                      {cityDropdownOpen && citySuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                          {citySuggestions.map((s, i) => (
                            <button key={i} type="button"
                              onMouseDown={() => { setEditCity(s.nom); setEditRegion(s.region); setCityQuery(s.nom); if (s.codesPostaux?.length === 1) setEditPostalCode(s.codesPostaux[0]); setCityDropdownOpen(false); setCitySuggestions([]) }}
                              className={`flex justify-between items-center w-full px-3.5 py-2.5 border-0 bg-transparent cursor-pointer text-left hover:bg-gray-50 ${i < citySuggestions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                              <div>
                                <span className="text-sm font-semibold text-gray-900">{s.nom}</span>
                                <span className="text-xs text-gray-400 ml-1.5">{s.departement} · {s.region}</span>
                              </div>
                              {s.codesPostaux?.length > 0 && <span className="text-xs text-indigo-600 font-semibold font-mono ml-2 shrink-0">{s.codesPostaux[0]}{s.codesPostaux.length > 1 ? '…' : ''}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input value={editRegion} onChange={e => setEditRegion(e.target.value)} placeholder="Région (remplie automatiquement)"
                      className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 outline-none" />
                    <select value={editRadius} onChange={e => setEditRadius(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none">
                      <option value="5">Rayon 5 km</option>
                      <option value="10">Rayon 10 km</option>
                      <option value="25">Rayon 25 km</option>
                      <option value="national">France entière</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm text-gray-700">
                      <MapPin size={14} className="text-gray-400" /> {creator?.city ?? '—'}{creator?.region ? `, ${creator.region}` : ''}
                    </span>
                    {creator?.travel_radius && (
                      <span className="text-sm text-gray-500">{RADIUS_LABELS[creator.travel_radius] ?? creator.travel_radius}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Couleur de marque */}
              <div className="px-6 py-5 border-t border-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Couleur de marque</p>
                {editing ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={editBrandColor}
                      onChange={e => setEditBrandColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 bg-white"
                      style={{ appearance: 'none' }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{editBrandColor.toUpperCase()}</p>
                      <p className="text-xs text-gray-400">Appliquée sur votre page publique</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      {['#6366F1','#F59E0B','#10B981','#EF4444','#8B5CF6','#EC4899','#0EA5E9'].map(c => (
                        <button key={c} onClick={() => setEditBrandColor(c)}
                          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ backgroundColor: c, borderColor: editBrandColor === c ? c : 'transparent', outline: editBrandColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: (creator as any)?.page_settings?.primary_color ?? '#6366F1' }} />
                    <span className="text-sm text-gray-700">{((creator as any)?.page_settings?.primary_color ?? '#6366F1').toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Liens */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Liens</p>
                {editing ? (
                  <div className="flex flex-col gap-2.5">
                    {[
                      { icon: <AtSign size={15} className="text-gray-400 shrink-0" />, val: editInstagram, set: setEditInstagram, placeholder: '@votre_compte' },
                      { icon: <Globe size={15} className="text-gray-400 shrink-0" />, val: editWebsite, set: setEditWebsite, placeholder: 'https://votre-site.fr' },
                      { icon: <ExternalLink size={15} className="text-gray-400 shrink-0" />, val: editEtsy, set: setEditEtsy, placeholder: 'https://etsy.com/shop/...' },
                    ].map(({ icon, val, set, placeholder }, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        {icon}
                        <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {[
                      { icon: <AtSign size={14} className="text-gray-400" />, val: creator?.instagram, label: 'Instagram' },
                      { icon: <Globe size={14} className="text-gray-400" />, val: creator?.website, label: 'Site web' },
                      { icon: <ExternalLink size={14} className="text-gray-400" />, val: creator?.etsy, label: 'Etsy' },
                    ].filter(l => l.val).map(({ icon, val, label }) => (
                      <a key={label} href={val!.startsWith('http') ? val! : `https://${val}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-700 no-underline hover:text-indigo-600 transition-colors">
                        {icon} {val}
                      </a>
                    ))}
                    {!creator?.instagram && !creator?.website && !creator?.etsy && (
                      <span className="text-sm text-gray-400">Aucun lien renseigné</span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Vérification */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Vérification</p>
                <div className="flex flex-col gap-3">
                  {/* SIRET */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={17} fill={(creator?.siret_verified || editSiret) ? '#059669' : 'none'} color={(creator?.siret_verified || editSiret) ? '#059669' : '#D1D5DB'} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">SIRET vérifié</p>
                        <p className="text-xs text-gray-400">Professionnel déclaré</p>
                      </div>
                    </div>
                    {editing && (
                      <button onClick={() => setEditSiret(!editSiret)}
                        className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border-0 ${editSiret ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {editSiret ? 'Activé' : 'Activer'}
                      </button>
                    )}
                  </div>
                  {editing && (
                    <div className="ml-8">
                      <p className="text-xs text-gray-400 mb-2">Entrez votre SIRET (14 chiffres) — validé par un admin sous 24h.</p>
                      <div className="flex gap-2">
                        <input value={siretNumber} onChange={e => { setSiretNumber(e.target.value.replace(/\D/g, '')); setSiretResult(null) }}
                          placeholder="14 chiffres" maxLength={14}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono tracking-widest outline-none" />
                        <button onClick={handleCheckSiret} disabled={siretNumber.length !== 14 || siretChecking}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer ${siretNumber.length === 14 ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                          {siretChecking ? '…' : 'Envoyer'}
                        </button>
                      </div>
                      {siretResult && (
                        <div className={`mt-2 px-3.5 py-2 rounded-xl border text-sm font-semibold ${siretResult.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                          {siretResult.valid ? siretResult.nom : siretResult.error}
                        </div>
                      )}
                    </div>
                  )}
                  {/* RC Pro */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={17}
                        fill={creator?.insurance_verified ? '#059669' : 'none'}
                        color={creator?.insurance_verified ? '#059669' : creator?.insurance_doc_url ? '#F59E0B' : '#D1D5DB'} />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">RC Pro</p>
                        <p className={`text-xs font-medium ${creator?.insurance_verified ? 'text-emerald-600' : creator?.insurance_doc_url ? 'text-amber-500' : 'text-gray-400'}`}>
                          {creator?.insurance_verified ? 'Validé par l\'équipe' : creator?.insurance_doc_url ? 'En attente de validation' : 'Responsabilité Civile Professionnelle'}
                        </p>
                      </div>
                    </div>
                    {editing && !creator?.insurance_verified && (
                      <button onClick={() => rcProRef.current?.click()} disabled={rcProUploading}
                        className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer border-0 text-white ${creator?.insurance_doc_url ? 'bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                        {rcProUploading ? 'Envoi…' : creator?.insurance_doc_url ? 'Remplacer' : 'Déposer'}
                      </button>
                    )}
                  </div>
                  {editing && !creator?.insurance_verified && (
                    <p className="text-[11px] text-gray-400 ml-8">
                      {creator?.insurance_doc_url ? 'Document reçu — vérification sous 24h.' : 'Déposez votre attestation (PDF ou image)'}
                    </p>
                  )}
                  <input ref={rcProRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleRcProUpload} />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Double rôle */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Rôles</p>
                <div className="flex flex-col gap-4">
                  {/* Toggle organisateur — caché si c'est déjà le rôle principal sans secondaire possible */}
                  {profile?.role !== 'organizer' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">Organisateur</p>
                        <p className="text-xs text-gray-400">Créez et gérez vos propres marchés</p>
                      </div>
                      <button
                        onClick={async () => {
                          const next = !profile?.is_organizer
                          await supabase.from('profiles').update({ is_organizer: next }).eq('id', user!.id)
                          setProfile(prev => prev ? { ...prev, is_organizer: next } : prev)
                          const su = useAuthStore.getState().user; if (su) useAuthStore.getState().setUser({ ...su, is_organizer: next })
                          showToast(next ? 'Rôle organisateur activé' : 'Rôle organisateur désactivé')
                        }}
                        className="relative shrink-0 cursor-pointer border-0 bg-transparent p-0"
                        style={{ width: '44px', height: '24px', borderRadius: '99px', backgroundColor: profile?.is_organizer ? '#6366F1' : '#CBD5E1', transition: 'background 200ms' }}>
                        <div style={{ position: 'absolute', top: '4px', left: profile?.is_organizer ? '23px' : '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  )}
                  {profile?.role !== 'creator' && profile?.role !== 'artisan' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">Créateur</p>
                        <p className="text-xs text-gray-400">Postulez aux événements en tant qu'artisan</p>
                      </div>
                      <button
                        onClick={async () => {
                          const next = !profile?.is_creator
                          await supabase.from('profiles').update({ is_creator: next }).eq('id', user!.id)
                          setProfile(prev => prev ? { ...prev, is_creator: next } : prev)
                          const su = useAuthStore.getState().user; if (su) useAuthStore.getState().setUser({ ...su, is_creator: next })
                          showToast(next ? 'Rôle créateur activé' : 'Rôle créateur désactivé')
                        }}
                        className="relative shrink-0 cursor-pointer border-0 bg-transparent p-0"
                        style={{ width: '44px', height: '24px', borderRadius: '99px', backgroundColor: profile?.is_creator ? '#6366F1' : '#CBD5E1', transition: 'background 200ms' }}>
                        <div style={{ position: 'absolute', top: '4px', left: profile?.is_creator ? '23px' : '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  )}
                  {/* Toggle collab — pour les créateurs */}
                  {isCreatorRole && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">Ouvert aux collaborations</p>
                        <p className="text-xs text-gray-400">Les autres créateurs pourront vous proposer des collabs</p>
                      </div>
                      <button
                        onClick={async () => {
                          const next = !creator?.open_to_collab
                          await supabase.from('creator_profiles').update({ open_to_collab: next }).eq('user_id', user!.id)
                          setCreator(prev => prev ? { ...prev, open_to_collab: next } : prev)
                          showToast(next ? 'Collaborations activées' : 'Collaborations désactivées')
                        }}
                        className="relative shrink-0 cursor-pointer border-0 bg-transparent p-0"
                        style={{ width: '44px', height: '24px', borderRadius: '99px', backgroundColor: creator?.open_to_collab ? '#7C3AED' : '#CBD5E1', transition: 'background 200ms' }}>
                        <div style={{ position: 'absolute', top: '4px', left: creator?.open_to_collab ? '23px' : '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vérification organisateur */}
            {(profile?.role === 'organizer' || profile?.is_organizer) && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="px-6 py-5">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vérification organisateur</p>
                    {(orgaProfile?.siret_verified || orgaProfile?.verification_doc_verified) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                        <BadgeCheck size={10} /> Vérifié
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    {/* SIRET */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-800">SIRET</p>
                        {orgaProfile?.siret_verified
                          ? <span className="text-xs font-bold text-emerald-600">Vérifié</span>
                          : orgaProfile?.siret_number
                          ? <span className="text-xs font-semibold text-amber-500">En attente</span>
                          : null
                        }
                      </div>
                      {orgaProfile?.siret_verified ? (
                        <p className="text-sm text-gray-600 font-mono">{orgaProfile.siret_number}</p>
                      ) : (
                        <div className="flex gap-2">
                          <input value={orgaSiretInput} onChange={e => { setOrgaSiretInput(e.target.value.replace(/\D/g, '')); setOrgaSiretResult(null) }}
                            placeholder="14 chiffres" maxLength={14}
                            className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono tracking-widest outline-none focus:border-indigo-400" />
                          <button onClick={handleOrgaSiretCheck} disabled={orgaSiretInput.length !== 14 || orgaSiretChecking}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer ${orgaSiretInput.length === 14 ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            {orgaSiretChecking ? '…' : 'Envoyer'}
                          </button>
                        </div>
                      )}
                      {orgaSiretResult && (
                        <div className={`mt-2 px-3.5 py-2 rounded-xl border text-sm font-semibold ${orgaSiretResult.valid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                          {orgaSiretResult.valid ? orgaSiretResult.nom : orgaSiretResult.error}
                        </div>
                      )}
                    </div>
                    {/* Document (Kbis / RNA) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Document officiel</p>
                          <p className="text-xs text-gray-400">Kbis, extrait RNA, statuts association…</p>
                        </div>
                        {orgaProfile?.verification_doc_verified
                          ? <span className="text-xs font-bold text-emerald-600">Vérifié</span>
                          : orgaProfile?.verification_doc_url
                          ? <span className="text-xs font-semibold text-amber-500">En attente</span>
                          : null
                        }
                      </div>
                      {orgaProfile?.verification_doc_verified ? (
                        <p className="text-xs text-emerald-600 font-semibold">Document validé par l'équipe Nexart</p>
                      ) : (
                        <button onClick={() => orgaDocRef.current?.click()} disabled={orgaDocUploading}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer text-white ${orgaProfile?.verification_doc_url ? 'bg-amber-500 hover:bg-amber-400' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                          {orgaDocUploading ? 'Envoi…' : orgaProfile?.verification_doc_url ? 'Remplacer le document' : 'Déposer un document'}
                        </button>
                      )}
                      <input ref={orgaDocRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleOrgaDocUpload} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Éditions passées organisateur */}
            {(profile?.role === 'organizer' || profile?.is_organizer) && user?.id && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="px-6 py-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Éditions passées</p>
                  <PastEventsGallery organizerId={user.id} />
                </div>
              </>
            )}

            {/* Déconnexion + Supprimer */}
            <div className="flex flex-col gap-2">
              <button onClick={async () => {
                  if (!user) return
                  const [{ data: p }, { data: cp }, { data: apps }, { data: convs }] = await Promise.all([
                    supabase.from('profiles').select('*').eq('id', user.id).single(),
                    supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle(),
                    supabase.from('applications').select('*').eq('creator_id', user.id),
                    supabase.from('conversations').select('id').or(`creator_id.eq.${user.id},organizer_id.eq.${user.id}`),
                  ])
                  const payload = { profil: p, creator_profile: cp, candidatures: apps, conversations_ids: convs?.map(c => c.id), exported_at: new Date().toISOString() }
                  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `nexart-mes-donnees-${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(url)
                }}
                className="w-full py-2.5 rounded-2xl border border-gray-200 bg-transparent text-gray-500 text-sm cursor-pointer flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                Exporter mes données (RGPD)
              </button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
                className="w-full py-3 rounded-2xl border border-red-200 bg-white text-red-500 text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                <LogOut size={15} /> Se déconnecter
              </button>
              <button onClick={async () => {
                  const confirmed = window.confirm('Supprimer définitivement votre compte ?\n\nToutes vos données seront effacées.')
                  if (!confirmed) return
                  const { data: { session } } = await supabase.auth.getSession()
                  if (!session) return
                  const res = await fetch('/api/delete-account', { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } })
                  if (res.ok) { await supabase.auth.signOut(); router.push('/') }
                  else { const body = await res.json(); alert('Erreur : ' + (body.error ?? 'Impossible de supprimer le compte')) }
                }}
                className="w-full py-2.5 rounded-2xl border border-gray-200 bg-transparent text-gray-400 text-sm cursor-pointer flex items-center justify-center gap-1.5 hover:text-gray-600 transition-colors">
                <Trash2 size={13} /> Supprimer mon compte
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Portfolio ── */}
        {tab === 'portfolio' && user && (
          <>
            <PortfolioGridEditor
              items={gridItems}
              userId={user.id}
              maxPhotos={profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'premium' ? 30 : profile?.subscription_tier === 'boost' ? 30 : 10}
              onChange={async (next) => {
                setGridItems(next)
                await supabase.from('creator_profiles').upsert({ user_id: user.id, portfolio_grid: next }, { onConflict: 'user_id' })
              }}
            />

            {/* Videos section */}
            <div style={{ marginTop: '32px', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', marginBottom: '4px' }}>Vidéos portfolio</h3>
              <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>YouTube, TikTok ou Instagram Reels (max 6)</p>

              {portfolioVideos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {portfolioVideos.map((url, i) => {
                    const embed = getVideoEmbed(url)
                    return (
                      <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', backgroundColor: '#000', aspectRatio: '16/9' }}>
                        {embed ? (
                          <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px' }}>URL non reconnue</div>
                        )}
                        <button
                          onClick={async () => {
                            const next = portfolioVideos.filter((_, j) => j !== i)
                            setPortfolioVideos(next)
                            await supabase.from('creator_profiles').update({ portfolio_videos: next } as any).eq('user_id', user.id)
                          }}
                          style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', lineHeight: 1 }}
                        >×</button>
                      </div>
                    )
                  })}
                </div>
              )}

              {portfolioVideos.length < 6 && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://youtu.be/... ou tiktok.com/@..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E5E7EB', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                    onKeyDown={async (e) => { if (e.key === 'Enter') { e.preventDefault(); await addVideo() } }}
                  />
                  <button
                    onClick={addVideo}
                    style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: '#6366F1', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Ajouter
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Tab: Candidatures ── */}
        {tab === 'candidatures' && (
          <div className="flex flex-col gap-3">
            {applications.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-gray-200">
                <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-700 mb-1">Aucune candidature</p>
                <p className="text-sm text-gray-400 mb-5">Explorez les événements et postulez pour exposer votre travail.</p>
                <button onClick={() => router.push('/events')}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold border-0 cursor-pointer hover:bg-indigo-500 transition-colors">
                  Voir les événements
                </button>
              </div>
            ) : applications.map(app => {
              const ev = app.events
              const isAccepted = app.status === 'accepted'
              const isRefused  = app.status === 'refused'
              const isDone     = isAccepted || isRefused

              type Step = { label: string; sublabel?: string; done: boolean; active: boolean; color: string }
              const steps: Step[] = [
                {
                  label: 'Envoyée',
                  sublabel: new Date(app.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
                  done: true, active: false, color: '#10B981',
                },
                {
                  label: 'En examen',
                  sublabel: isDone ? 'Examinée' : 'En attente',
                  done: isDone, active: !isDone, color: isDone ? '#10B981' : '#F59E0B',
                },
                {
                  label: isAccepted ? 'Acceptée ✓' : isRefused ? 'Refusée' : 'Décision',
                  done: isDone, active: !isDone,
                  color: isAccepted ? '#10B981' : isRefused ? '#EF4444' : '#9CA3AF',
                },
              ]

              return (
                <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  {/* Header */}
                  <div className="flex gap-3 items-start mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {ev?.cover_image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={ev.cover_image} alt={ev.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center bg-indigo-600"><Calendar size={20} className="text-white" /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{ev?.title ?? 'Événement supprimé'}</p>
                      {ev && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {ev.city ?? '—'} · {new Date(ev.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-start">
                    {steps.map((step, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="flex items-center w-full">
                          {i > 0 && (
                            <div className="flex-1 h-[2px]" style={{ backgroundColor: steps[i-1].done ? steps[i-1].color : '#E5E7EB' }} />
                          )}
                          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{
                              borderColor: step.done || step.active ? step.color : '#E5E7EB',
                              backgroundColor: step.done ? step.color : 'white',
                            }}>
                            {step.done
                              ? <CheckCircle size={12} color="white" fill="white" />
                              : step.active
                                ? <div className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
                                : null
                            }
                          </div>
                          {i < steps.length - 1 && (
                            <div className="flex-1 h-[2px]" style={{ backgroundColor: step.done ? step.color : '#E5E7EB' }} />
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-center mt-1.5 leading-tight px-1"
                          style={{ color: step.done || step.active ? step.color : '#9CA3AF' }}>
                          {step.label}
                        </p>
                        {step.sublabel && (
                          <p className="text-[9px] text-gray-400 text-center mt-0.5 px-1 leading-tight">{step.sublabel}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {app.message && (
                    <p className="text-xs text-gray-500 italic mt-4 pt-4 border-t border-gray-100">&ldquo;{app.message}&rdquo;</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Tab: Avis ── */}
        {tab === 'avis' && (
          <div className="flex flex-col gap-3">
            {reviews.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-5 shadow-sm mb-1">
                <div className="text-center">
                  <p className="text-4xl font-black text-indigo-600 leading-none">{avgRating}</p>
                  <Stars n={Math.round(Number(avgRating))} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-0.5">Note moyenne</p>
                  <p className="text-xs text-gray-400">Basée sur {reviews.length} avis d&apos;organisateurs</p>
                </div>
              </div>
            )}
            {reviews.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-gray-200">
                <Star size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-700 mb-1">Aucun avis reçu</p>
                <p className="text-sm text-gray-400">Les avis des organisateurs apparaîtront ici après chaque marché.</p>
              </div>
            ) : reviews.map(rev => (
              <div key={rev.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{rev.profiles?.full_name ?? 'Organisateur'}</p>
                    <Stars n={rev.rating} />
                  </div>
                  <span className="text-xs text-gray-400">{new Date(rev.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {rev.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">"{rev.comment}"</p>}
                {(rev.tags ?? []).length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {rev.tags!.map(t => (
                      <span key={t} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="flex flex-col gap-4">
            {/* Create post form */}
            {user && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-3">Publier un post</p>
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  placeholder="Partagez une création, une actualité, une inspiration…"
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-y outline-none focus:border-indigo-400 text-gray-900 leading-relaxed mb-3"
                />
                {postImageFile && (
                  <div className="relative w-24 h-24 mb-3 rounded-xl overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(postImageFile)} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setPostImageFile(null)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white">
                      <X size={11} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-indigo-600 transition-colors">
                    <ImagePlus size={16} />
                    <span>Ajouter une photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => setPostImageFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <button
                    disabled={postSaving || !postContent.trim()}
                    onClick={async () => {
                      if (!user || !postContent.trim()) return
                      setPostSaving(true)
                      let imageUrl: string | null = null
                      if (postImageFile) {
                        const ext = postImageFile.name.split('.').pop()
                        const path = `posts/${user.id}/${Date.now()}.${ext}`
                        await supabase.storage.from('avatars').upload(path, postImageFile, { upsert: true })
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
                        imageUrl = urlData.publicUrl
                      }
                      const { data: newPost } = await supabase.from('creator_posts').insert({
                        creator_id: user.id,
                        content: postContent.trim(),
                        ...(imageUrl ? { image_url: imageUrl } : {}),
                      }).select('id,content,image_url,created_at').single()
                      if (newPost) setMyPosts(prev => [newPost, ...prev])
                      setPostContent('')
                      setPostImageFile(null)
                      setPostSaving(false)
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-40 hover:bg-indigo-500 transition-colors">
                    {postSaving ? 'Publication…' : 'Publier'}
                  </button>
                </div>
              </div>
            )}

            {/* Posts list */}
            {myPosts.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-gray-200">
                <Rss size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-base font-semibold text-gray-700 mb-1">Aucun post publié</p>
                <p className="text-sm text-gray-400">Partagez vos créations et actualités avec vos abonnés.</p>
              </div>
            ) : myPosts.map(post => (
              <div key={post.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <button
                    onClick={async () => {
                      await supabase.from('creator_posts').delete().eq('id', post.id)
                      setMyPosts(prev => prev.filter(p => p.id !== post.id))
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">{post.content}</p>
                {post.image_url && (
                  <div className="rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image_url} alt="" className="w-full max-h-72 object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        </div>{/* end content area */}

      </motion.div>
    </div>
  )
}
