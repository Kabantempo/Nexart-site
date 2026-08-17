'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
import { colors } from '@/lib/design-tokens'

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
  facebook: string | null; tiktok: string | null
  phone: string | null; price_min: number | null; price_max: number | null
  legal_status: string | null
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
  'Dessin','Brocante','Musique','Prêt-à-porter','Décoration','Littérature',
  'Pop culture','Cinéma','Cabinet de curiosités','Restauration','Costumes',
]
const RADIUS_LABELS: Record<string, string> = {
  '5': '5 km', '10': '10 km', '25': '25 km', national: 'France entière',
}
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: colors.status.pending.dot, bg: colors.red.bgFbeb },
  accepted:  { label: 'Acceptée',   color: colors.green.primary, bg: colors.green.bg },
  refused:   { label: 'Refusée',    color: colors.red.vivid, bg: colors.red.bg },
  draft:     { label: 'Brouillon',  color: 'var(--text-secondary)', bg: 'var(--bg-secondary)' },
  published: { label: 'Publié',     color: colors.green.primary, bg: colors.green.bg },
  closed:    { label: 'Fermé',      color: 'var(--text-secondary)', bg: colors.bg.subtle },
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
        <Star key={i} size={14} fill={i <= n ? colors.status.pending.dot : 'none'} color={i <= n ? colors.status.pending.dot : colors.gray["300"]} />
      ))}
    </span>
  )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      backgroundColor: ok ? colors.green.bg : colors.bg.subtle,
      color: ok ? colors.feedback.success.solid : 'var(--text-tertiary)',
    }}>
      <CheckCircle size={12} fill={ok ? colors.feedback.success.solid : 'none'} color={ok ? colors.feedback.success.solid : 'var(--text-tertiary)'} />
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
  const [editFacebook, setEditFacebook] = useState('')
  const [editTiktok, setEditTiktok] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editEtsy, setEditEtsy] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [editLegalStatus, setEditLegalStatus] = useState('')
  const [editBrandColor, setEditBrandColor] = useState<string>(colors.violet.primary)
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
          fetch('/api/admin/analytics', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }).then(r => r.json()).then(d => d?.users ? d : null),
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
        setCreator(creat as unknown as CreatorProfile)
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
        setEditRadius(creat?.travel_radius || '25')
        setEditDisc(creat?.disciplines ?? [])
        setEditInstagram(creat?.instagram ?? '')
        setEditFacebook((creat as any)?.facebook ?? '')
        setEditTiktok((creat as any)?.tiktok ?? '')
        setEditWebsite(creat?.website ?? '')
        setEditEtsy(creat?.etsy ?? '')
        setEditPhone((creat as any)?.phone ?? '')
        setEditPriceMin((creat as any)?.price_min?.toString() ?? '')
        setEditPriceMax((creat as any)?.price_max?.toString() ?? '')
        setEditLegalStatus((creat as any)?.legal_status ?? '')
        setEditBrandColor((creat as any)?.page_settings?.primary_color ?? colors.violet.primary)
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
        city: editCity, region: editRegion, postal_code: editPostalCode || null, travel_radius: (['5', '10', '25', 'national'].includes(editRadius) ? editRadius : '25') as '5' | '10' | '25' | 'national',
        instagram: editInstagram, website: editWebsite, etsy: editEtsy,
        facebook: editFacebook, tiktok: editTiktok,
        phone: editPhone || null,
        price_min: editPriceMin ? parseInt(editPriceMin) : null,
        price_max: editPriceMax ? parseInt(editPriceMax) : null,
        legal_status: editLegalStatus || null,
        page_settings: { primary_color: editBrandColor },
      } as any, { onConflict: 'user_id' })] : []),
    ]
    const results = await Promise.all(promises)
    const hasError = results.some(r => r.error)
    if (hasError) {
      setToast('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setSaving(false)
      return
    }
    setProfile(p => p ? { ...p, full_name: editName, bio: editBio, username: editUsername || null, show_real_name: editShowRealName } as any : p)
    if (isCreator) setCreator(c => c ? { ...c, disciplines: editDisc, city: editCity, region: editRegion, travel_radius: editRadius as '5' | '10' | '25' | 'national', instagram: editInstagram, website: editWebsite, etsy: editEtsy, facebook: editFacebook as any, tiktok: editTiktok as any, phone: (editPhone || null) as any, price_min: (editPriceMin ? parseInt(editPriceMin) : null) as any, price_max: (editPriceMax ? parseInt(editPriceMax) : null) as any, legal_status: (editLegalStatus || null) as any } : c)
    setSaving(false)
    setEditing(false)
  }

  const handleCheckSiret = async () => {
    if (!user || siretNumber.length !== 14) return
    setSiretChecking(true)
    setSiretResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/creator/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ siret: siretNumber }),
      })
      if (!res.ok) throw new Error('Erreur lors de l\'envoi')
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
      setCreator(c => c ? { ...c, insurance_doc_url: publicUrl, insurance_verified: false } : c)
      setEditInsurance(false)
      // Notif admins via API (admin client bypasses RLS)
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/creator/notify-rcpro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ insurance_doc_url: publicUrl }),
      })
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
    ctx.strokeStyle = colors.gray["700"]
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
    const { error } = await supabase.from('creator_profiles').upsert({ user_id: user.id, portfolio_videos: next } as any, { onConflict: 'user_id' })
    if (error) { console.error('portfolio_videos save error:', error); setPortfolioVideos(portfolioVideos) }
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="h-52 bg-[${colors.dark.base}] animate-pulse" />
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
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
        <div className="relative bg-[${colors.dark.base}] overflow-hidden pt-24 pb-12">
          {/* Banner image */}
          {profile?.banner_url && (
            <div className="absolute inset-0 z-0">
              <Image src={profile.banner_url} alt="" fill style={{ objectFit: 'cover', opacity: 0.25 }} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[${colors.dark.base}]/70 to-[${colors.dark.base}]" />
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
                    <Image src={profile.avatar_url} alt={name} width={112} height={112} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
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
                      Créateur
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
                            const { error } = await supabase.from('profiles').update({ username: editUsername || null }).eq('id', user!.id)
                            if (!error) {
                              setProfile(p => p ? { ...p, username: editUsername || null } as any : p)
                              setToast('Pseudo enregistré')
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400 text-gray-900" />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                      <div onClick={() => setEditShowRealName(v => !v)} className="relative shrink-0 cursor-pointer"
                        style={{ width: '40px', height: '22px', borderRadius: '99px', backgroundColor: editShowRealName ? colors.violet.primary : colors.gray["300slate"], transition: 'background 200ms' }}>
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
                      {[colors.violet.primary,colors.status.pending.dot,colors.green.primary,colors.red.vivid,colors.purple.primary,colors.fuchsia.primary,colors.blue.primary].map(c => (
                        <button key={c} onClick={() => setEditBrandColor(c)}
                          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ backgroundColor: c, borderColor: editBrandColor === c ? c : 'transparent', outline: editBrandColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: (creator as any)?.page_settings?.primary_color ?? colors.violet.primary }} />
                    <span className="text-sm text-gray-700">{((creator as any)?.page_settings?.primary_color ?? colors.violet.primary).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Liens */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Liens</p>
                {editing ? (
                  <div className="flex flex-col gap-2.5">
                    {([
                      { icon: <AtSign size={15} className="text-gray-400 shrink-0" />, val: editInstagram, set: setEditInstagram, placeholder: 'Instagram : @votre_compte' },
                      { icon: <span style={{ fontSize: 15, flexShrink: 0, color: colors.text.muted }}>f</span>, val: editFacebook, set: setEditFacebook, placeholder: 'Facebook : nom de page' },
                      { icon: <span style={{ fontSize: 15, flexShrink: 0, color: colors.text.muted }}>♪</span>, val: editTiktok, set: setEditTiktok, placeholder: 'TikTok : @votre_compte' },
                      { icon: <Globe size={15} className="text-gray-400 shrink-0" />, val: editWebsite, set: setEditWebsite, placeholder: 'Site web : https://...' },
                      { icon: <ExternalLink size={15} className="text-gray-400 shrink-0" />, val: editEtsy, set: setEditEtsy, placeholder: 'Etsy : https://etsy.com/shop/...' },
                    ] as { icon: React.ReactNode; val: string; set: (v: string) => void; placeholder: string }[]).map(({ icon, val, set, placeholder }, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        {icon}
                        <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {([
                      { icon: <AtSign size={14} className="text-gray-400" />, val: creator?.instagram, label: 'Instagram' },
                      { icon: <span style={{ fontSize: 14, color: colors.text.muted }}>f</span>, val: (creator as any)?.facebook, label: 'Facebook' },
                      { icon: <span style={{ fontSize: 14, color: colors.text.muted }}>♪</span>, val: (creator as any)?.tiktok, label: 'TikTok' },
                      { icon: <Globe size={14} className="text-gray-400" />, val: creator?.website, label: 'Site web' },
                      { icon: <ExternalLink size={14} className="text-gray-400" />, val: creator?.etsy, label: 'Etsy' },
                    ] as { icon: React.ReactNode; val: string | null | undefined; label: string }[]).filter(l => l.val).map(({ icon, val, label }) => (
                      <a key={label} href={val!.startsWith('http') ? val! : `https://${val}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-700 no-underline hover:text-indigo-600 transition-colors">
                        {icon} {val}
                      </a>
                    ))}
                    {!creator?.instagram && !(creator as any)?.facebook && !(creator as any)?.tiktok && !creator?.website && !creator?.etsy && (
                      <span className="text-sm text-gray-400">Aucun lien renseigné</span>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-gray-100" />

              {/* Infos commerciales */}
              <div className="px-6 py-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Infos commerciales</p>
                {editing ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span style={{ fontSize: 15, flexShrink: 0, color: colors.text.muted }}>📞</span>
                      <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Téléphone : 06 00 00 00 00"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <select value={editLegalStatus} onChange={e => setEditLegalStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400">
                      <option value="">Statut juridique (optionnel)</option>
                      <option value="auto">Auto-entrepreneur / micro-entreprise</option>
                      <option value="ei">EIRL / EI</option>
                      <option value="sarl">SARL / EURL</option>
                      <option value="sas">SAS / SASU</option>
                      <option value="association">Association</option>
                      <option value="particulier">Particulier</option>
                      <option value="autre">Autre</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="number" value={editPriceMin} onChange={e => setEditPriceMin(e.target.value)} placeholder="Prix min (€)" min={0}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                      <input type="number" value={editPriceMax} onChange={e => setEditPriceMax(e.target.value)} placeholder="Prix max (€)" min={0}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-indigo-400" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(creator as any)?.phone && (
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <span style={{ fontSize: 14 }}>📞</span> {(creator as any).phone}
                      </span>
                    )}
                    {(creator as any)?.legal_status && (
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <Shield size={14} className="text-gray-400" />
                        {({'auto':'Auto-entrepreneur','ei':'EIRL / EI','sarl':'SARL / EURL','sas':'SAS / SASU','association':'Association','particulier':'Particulier','autre':'Autre'} as Record<string,string>)[(creator as any).legal_status] ?? (creator as any).legal_status}
                      </span>
                    )}
                    {((creator as any)?.price_min != null || (creator as any)?.price_max != null) && (
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <CreditCard size={14} className="text-gray-400" />
                        {(creator as any).price_min != null && (creator as any).price_max != null
                          ? `${(creator as any).price_min} € – ${(creator as any).price_max} €`
                          : (creator as any).price_min != null ? `À partir de ${(creator as any).price_min} €` : `Jusqu'à ${(creator as any).price_max} €`}
                      </span>
                    )}
                    {!(creator as any)?.phone && !(creator as any)?.legal_status && (creator as any)?.price_min == null && (
                      <span className="text-sm text-gray-400">Aucune info commerciale renseignée</span>
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
                      <CheckCircle size={17} fill={(creator?.siret_verified || editSiret) ? colors.feedback.success.solid : 'none'} color={(creator?.siret_verified || editSiret) ? colors.feedback.success.solid : colors.gray["300"]} />
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
                        fill={creator?.insurance_verified ? colors.feedback.success.solid : 'none'}
                        color={creator?.insurance_verified ? colors.feedback.success.solid : creator?.insurance_doc_url ? colors.status.pending.dot : colors.gray["300"]} />
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
                        style={{ width: '44px', height: '24px', borderRadius: '99px', backgroundColor: profile?.is_organizer ? colors.violet.primary : colors.gray["300slate"], transition: 'background 200ms' }}>
                        <div style={{ position: 'absolute', top: '4px', left: profile?.is_organizer ? '23px' : '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  )}
                  {profile?.role !== 'creator' && profile?.role !== 'artisan' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 leading-none mb-0.5">Créateur</p>
                        <p className="text-xs text-gray-400">Postulez aux événements en tant que créateur</p>
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
                        style={{ width: '44px', height: '24px', borderRadius: '99px', backgroundColor: profile?.is_creator ? colors.violet.primary : colors.gray["300slate"], transition: 'background 200ms' }}>
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
                          await supabase.from('creator_profiles').upsert({ user_id: user!.id, open_to_collab: next }, { onConflict: 'user_id' })
                          setCreator(prev => prev ? { ...prev, open_to_collab: next } : { open_to_collab: next } as any)
                          showToast(next ? 'Collaborations activées' : 'Collaborations désactivées')
                        }}
                        className="relative shrink-0 cursor-pointer border-0 bg-transparent p-0"
                        style={{ width: '44px', height: '24px', borderRadius: '99px', backgroundColor: creator?.open_to_collab ? colors.purple.dark : colors.gray["300slate"], transition: 'background 200ms' }}>
                        <div style={{ position: 'absolute', top: '4px', left: creator?.open_to_collab ? '23px' : '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vérification SIRET créateur */}
            {isCreatorRole && !(profile?.role === 'organizer' || profile?.is_organizer) && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Vérification SIRET</p>
                      {creator?.siret_verified ? (
                        <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                          <BadgeCheck size={14} /> Vérifié
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">Obtenez le badge créateur vérifié</p>
                      )}
                    </div>
                    {!creator?.siret_verified && (
                      <a href="/creator/verify"
                        className="px-4 py-2 rounded-xl text-sm font-bold border-0 cursor-pointer no-underline"
                        style={{ backgroundColor: colors.violet.bg, color: colors.violet.primary }}>
                        Obtenir la vérification
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

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

            {/* Bouton Enregistrer en bas du formulaire */}
            {editing && (
              <div className="px-6 pb-2 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold border-0 cursor-pointer hover:bg-indigo-500 transition-colors">
                    <Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-500 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              </div>
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
                const { error } = await supabase
                  .from('creator_profiles')
                  .upsert({ user_id: user.id, portfolio_grid: next } as any, { onConflict: 'user_id' })
                if (error) console.error('portfolio_grid save error:', error)
              }}
            />

            {/* Videos section */}
            <div style={{ marginTop: '32px', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.text.primary, marginBottom: '4px' }}>Vidéos portfolio</h3>
              <p style={{ fontSize: '13px', color: colors.text.secondary, marginBottom: '16px' }}>YouTube, TikTok ou Instagram Reels (max 6)</p>

              {portfolioVideos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {portfolioVideos.map((url, i) => {
                    const embed = getVideoEmbed(url)
                    return (
                      <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${colors.border.default}`, backgroundColor: `${colors.text.black}`, aspectRatio: '16/9' }}>
                        {embed ? (
                          <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.text.secondary, fontSize: '12px' }}>URL non reconnue</div>
                        )}
                        <button
                          onClick={async () => {
                            const next = portfolioVideos.filter((_, j) => j !== i)
                            setPortfolioVideos(next)
                            const { error } = await supabase.from('creator_profiles').upsert({ user_id: user.id, portfolio_videos: next } as any, { onConflict: 'user_id' })
                            if (error) { console.error('portfolio_videos delete error:', error); setPortfolioVideos(portfolioVideos) }
                          }}
                          style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', color: colors.bg.primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', lineHeight: 1 }}
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
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
                    onKeyDown={async (e) => { if (e.key === 'Enter') { e.preventDefault(); await addVideo() } }}
                  />
                  <button
                    onClick={addVideo}
                    style={{ padding: '10px 18px', borderRadius: '10px', backgroundColor: colors.violet.primary, color: colors.bg.primary, border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                  done: true, active: false, color: colors.green.primary,
                },
                {
                  label: 'En examen',
                  sublabel: isDone ? 'Examinée' : 'En attente',
                  done: isDone, active: !isDone, color: isDone ? colors.green.primary : colors.status.pending.dot,
                },
                {
                  label: isAccepted ? 'Acceptée ✓' : isRefused ? 'Refusée' : 'Décision',
                  done: isDone, active: !isDone,
                  color: isAccepted ? colors.green.primary : isRefused ? colors.red.vivid : colors.text.muted,
                },
              ]

              return (
                <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  {/* Header */}
                  <div className="flex gap-3 items-start mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {ev?.cover_image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <Image src={ev.cover_image} alt={ev.title} width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
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
                            <div className="flex-1 h-[2px]" style={{ backgroundColor: steps[i-1].done ? steps[i-1].color : colors.border.default }} />
                          )}
                          <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                            style={{
                              borderColor: step.done || step.active ? step.color : colors.border.default,
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
                            <div className="flex-1 h-[2px]" style={{ backgroundColor: step.done ? step.color : colors.border.default }} />
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-center mt-1.5 leading-tight px-1"
                          style={{ color: step.done || step.active ? step.color : colors.text.muted }}>
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
                    <Image src={post.image_url} alt="" width={800} height={288} style={{ width: '100%', maxHeight: '288px', objectFit: 'cover' }} />
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
