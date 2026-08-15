'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { Application, Event } from '@/lib/types'
import {
  Calendar, Users, CheckCircle, Clock, X, ArrowRight,
  MessageSquare, User, Heart, List, CalendarDays, AlertCircle,
  MapPin, ShoppingBag, BarChart2, Zap, Star, ExternalLink, Eye,
  Bell, Plus, CreditCard, LogOut,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import DocumentsPanel from '@/components/documents-panel'
import { NexModal } from '@/components/ui/nex-modal'
import { NexTabs } from '@/components/ui/nex-tabs'
const CreditsWidget = dynamic(() => import('@/components/credits-widget').then(m => ({ default: m.CreditsWidget })), { ssr: false })
const ReferralWidget = dynamic(() => import('@/components/referral-widget').then(m => ({ default: m.ReferralWidget })), { ssr: false })
const BoostButton = dynamic(() => import('@/components/boost-button').then(m => ({ default: m.BoostButton })), { ssr: false })
import { useCountUp } from '@/lib/hooks/use-count-up'
import StripeConnectBanner, { StripeConnectAlert } from '@/components/ui/stripe-connect-banner'
import { colors } from '@/lib/design-tokens'

function AnimatedNumber({ value }: { value: number }) {
  const animated = useCountUp(value)
  return <>{animated}</>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:  { label: 'En attente', color: colors.status.pending.text,  bg: colors.status.pending.bg,  dot: colors.status.pending.dot  },
  accepted: { label: 'Acceptée',   color: colors.status.accepted.text, bg: colors.status.accepted.bg, dot: colors.status.accepted.dot },
  refused:  { label: 'Refusée',    color: colors.status.refused.text,  bg: colors.status.refused.bg,  dot: colors.status.refused.dot  },
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free:       { label: 'Essentiel',  color: 'var(--text-secondary)',  bg: colors.border.default },
  boost:      { label: 'Boost',      color: colors.violet.primary, bg: 'rgba(99,102,241,0.12)'   },
  pro:        { label: 'Pro',        color: '#7C3AED', bg: 'rgba(124,58,237,0.12)'   },
  premium:    { label: 'Premium',    color: colors.feedback.warning.solid, bg: 'rgba(217,119,6,0.12)'    },
  org_pro:    { label: 'Org Pro',    color: colors.feedback.success.solid, bg: 'rgba(5,150,105,0.12)'    },
  org_studio: { label: 'Studio',     color: '#E11D48', bg: 'rgba(225,29,72,0.12)'    },
}

const PROFILE_STEPS = [
  { key: 'bio',           label: 'Écrire une bio',       link: '/profile?tab=infos' },
  { key: 'disciplines',   label: 'Choisir vos disciplines', link: '/profile?tab=disciplines' },
  { key: 'city',          label: 'Ajouter votre ville',  link: '/profile?tab=infos' },
  { key: 'photos',        label: 'Ajouter 3 photos portfolio', link: '/profile?tab=portfolio' },
  { key: 'link',          label: 'Ajouter un lien web',  link: '/profile?tab=infos' },
  { key: 'availabilities',label: 'Renseigner vos disponibilités', link: '/profile?tab=disponibilites' },
] as const

// ─── Skeletons ────────────────────────────────────────────────────────────────

function KpiRowSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: '80px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px 16px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--border-color)', flexShrink: 0, marginTop: '6px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: '12px', backgroundColor: 'var(--border-color)', borderRadius: '4px', width: '60%', marginBottom: '6px' }} />
            <div style={{ height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '4px', width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SidebarSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ height: '120px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: '100px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()

  const [applications, setApplications] = useState<(Application & { event?: Event })[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [pendingApps, setPendingApps] = useState<PendingApp[]>([])
  const [loading, setLoading] = useState(true)
  const [profileViewCount, setProfileViewCount] = useState(0)
  const [profileViewDays, setProfileViewDays] = useState<{ date: string; count: number }[]>([])
  const [missingStepKeys, setMissingStepKeys] = useState<string[]>([])
  const [subscriptionTier, setSubscriptionTier] = useState('free')
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null)
  const [paymentBanner, setPaymentBanner] = useState<'success' | 'cancelled' | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [dashTab, setDashTab] = useState<'creator' | 'organizer'>('creator')
  const [accessToken, setAccessToken] = useState<string>('')
  const [connectAlertParams, setConnectAlertParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search).get('payment')
    if (p === 'success') { setPaymentBanner('success'); window.history.replaceState({}, '', '/dashboard') }
    if (p === 'cancelled') { setPaymentBanner('cancelled'); window.history.replaceState({}, '', '/dashboard') }
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('stripe_connect')) { setConnectAlertParams(sp); window.history.replaceState({}, '', '/dashboard') }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (profile) {
        if (profile.is_banned) { await supabase.auth.signOut(); router.push('/banned'); return }
        setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url, is_creator: profile.is_creator, is_organizer: profile.is_organizer, is_admin: profile.is_admin })
        setAccessToken(session.access_token)
        if (!profile.onboarding_done) { router.push('/onboarding'); return }
        setSubscriptionTier((profile as any).subscription_tier ?? 'free')
        setSubscriptionStatus((profile as any).subscription_status ?? null)
        setSubscriptionEndsAt((profile as any).subscription_ends_at ?? null)
      }
    })
  }, [router, setUser])

  // Check profile completion for creator banner
  useEffect(() => {
    if (!user) return
    const checkProfile = async () => {
      const isCreator = user.is_creator || user.role === 'creator'
      if (!isCreator) return
      const [{ data: p }, { data: cp }] = await Promise.all([
        supabase.from('profiles').select('bio').eq('id', user.id).maybeSingle(),
        supabase.from('creator_profiles').select('disciplines, city, portfolio_images, portfolio_grid, availability').eq('user_id', user.id).maybeSingle(),
      ])
      const photos = (cp?.portfolio_grid as any)?.length || cp?.portfolio_images?.length || 0
      const missing: string[] = []
      if (!p?.bio) missing.push('bio')
      if (!cp?.disciplines?.length) missing.push('disciplines')
      if (!cp?.city) missing.push('city')
      if (photos < 3) missing.push('photos')
      // 'link' step check deferred — website column lives in creator_profiles
      if (!cp?.availability) missing.push('availabilities')
      setMissingStepKeys(missing)
    }
    checkProfile()
  }, [user])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      setLoading(true)
      const hasCreator = user.is_creator || user.role === 'creator'
      const hasOrganizer = user.is_organizer || user.role === 'organizer'
      await Promise.all([
        hasCreator ? (async () => {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
          const [{ data: apps }, { data: views }] = await Promise.all([
            supabase.from('applications').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
            supabase.from('profile_views').select('viewed_at' as any).eq('profile_id', user.id).gte('viewed_at' as any, thirtyDaysAgo),
          ])
          if (apps?.length) {
            const { data: eventsData } = await supabase.from('events').select('*').in('id', apps.map(a => a.event_id))
            setApplications(apps.map(a => ({ ...a, event: eventsData?.find(e => e.id === a.event_id) })) as any)
          }
          if (views) {
            setProfileViewCount(views.length)
            const byDay: Record<string, number> = {}
            views.forEach(v => {
              const day = (v as any).viewed_at.slice(0, 10)
              byDay[day] = (byDay[day] ?? 0) + 1
            })
            const days = Array.from({ length: 30 }, (_, i) => {
              const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
              const key = d.toISOString().slice(0, 10)
              return { date: key, count: byDay[key] ?? 0 }
            })
            setProfileViewDays(days)
          }
        })() : Promise.resolve(),
        hasOrganizer ? (async () => {
          const { data: eventsData } = await supabase.from('events').select('*').eq('organizer_id', user.id).order('created_at', { ascending: false })
          setEvents((eventsData || []) as unknown as Event[])
          if (eventsData?.length) {
            const { data: pending } = await supabase
              .from('applications')
              .select('id, creator_id, event_id, message, created_at, boosted_at, profiles(full_name, avatar_url)')
              .in('event_id', eventsData.map(e => e.id))
              .eq('status', 'pending')
              .order('boosted_at', { ascending: false, nullsFirst: false })
              .order('created_at', { ascending: false })
            setPendingApps((pending as unknown as PendingApp[]) || [])
          }
        })() : Promise.resolve(),
      ])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  const handleOpenPortal = async () => {
    if (!user) return
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, returnUrl: window.location.href }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <KpiRowSkeleton />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '20px' }}>
            <FeedSkeleton />
            <SidebarSkeleton />
          </div>
        </div>
      </div>
    )
  }

  const hasCreator = user.is_creator || user.role === 'creator'
  const hasOrganizer = user.is_organizer || user.role === 'organizer'
  const firstName = user.full_name?.split(' ')[0] ?? 'vous'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const isAdmin = user.is_admin === true
  const roleLabel = [
    hasCreator && 'Créateur',
    hasOrganizer && 'Organisateur',
    isAdmin && 'Admin',
  ].filter(Boolean).join(' · ') || 'Visiteur'

  const acceptedApps = applications.filter(a => a.status === 'accepted')
  const pendingAppsCreator = applications.filter(a => a.status === 'pending')
  const refusedApps = applications.filter(a => a.status === 'refused')
  const acceptanceRate = applications.length > 0 ? Math.round((acceptedApps.length / applications.length) * 100) : 0
  const publishedEvents = events.filter(e => e.status === 'published')

  const tierCfg = TIER_CONFIG[subscriptionTier] ?? TIER_CONFIG.free
  const isPaid = subscriptionTier !== 'free'

  // First missing profile step for banner
  const firstMissingStep = PROFILE_STEPS.find(s => missingStepKeys.includes(s.key))
  const profilePct = Math.round(((PROFILE_STEPS.length - missingStepKeys.length) / PROFILE_STEPS.length) * 100)

  // Next accepted event (creator)
  const nextAcceptedEvent = acceptedApps
    .filter(a => a.event?.start_date && new Date(a.event.start_date) > new Date())
    .sort((a, b) => new Date(a.event!.start_date).getTime() - new Date(b.event!.start_date).getTime())[0]

  // Next event (organizer)
  const nextEvent = events
    .filter(e => e.start_date && new Date(e.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0]

  // Late apps (pending > 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const lateApps = pendingApps.filter(a => new Date(a.created_at).getTime() < sevenDaysAgo)

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dash-grid { grid-template-columns: 1fr; }
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        input, textarea, select {
          color: var(--text-primary) !important;
          background-color: var(--bg-secondary) !important;
          border-color: var(--border-color) !important;
        }
        input::placeholder, textarea::placeholder { color: var(--text-tertiary) !important; }
        option { background-color: var(--bg-secondary); color: var(--text-primary); }
        .mobile-quick-bar {
          display: none;
        }
        @media (max-width: 768px) {
          .sidebar-quick-actions { display: none; }
          .mobile-quick-bar {
            display: flex;
            position: sticky;
            bottom: 0;
            z-index: 40;
            background: var(--bg-primary);
            border-top: 1px solid var(--border-color);
            padding: 10px 16px;
            gap: 4px;
            justify-content: space-around;
            box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
          }
          .mobile-quick-bar a {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 6px 10px;
            border-radius: 8px;
            text-decoration: none;
            color: var(--text-secondary);
            font-size: 10px;
            font-weight: 500;
            flex: 1;
          }
          .mobile-quick-bar a:active { background: var(--bg-secondary); }
        }
      `}</style>

      {/* Payment banners */}
      {paymentBanner === 'success' && (
        <div style={{ backgroundColor: colors.feedback.success.solid, color: '#fff', fontSize: '13px', fontWeight: 600, textAlign: 'center', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <CheckCircle size={15} /> Abonnement activé — bienvenue dans la nouvelle dimension Nexart !
          <button onClick={() => setPaymentBanner(null)} style={{ marginLeft: '8px', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={13} /></button>
        </div>
      )}
      {paymentBanner === 'cancelled' && (
        <div style={{ backgroundColor: colors.feedback.warning.solid, color: '#fff', fontSize: '13px', fontWeight: 600, textAlign: 'center', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          Paiement annulé — votre abonnement n&apos;a pas été modifié.
          <button onClick={() => setPaymentBanner(null)} style={{ marginLeft: '8px', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${colors.border.default}`, padding: '20px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Tableau de bord</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>{greeting}, {firstName}</h1>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px', backgroundColor: colors.violet.primary, color: '#fff', flexShrink: 0 }}>{roleLabel}</span>
              {isPaid && (
                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: tierCfg.bg, color: tierCfg.color, flexShrink: 0 }}>
                  <Zap size={9} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />{tierCfg.label}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/notifications" style={{ width: '36px', height: '36px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <Bell size={16} />
            </Link>
            {hasCreator && (
              <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Voir les marchés <ArrowRight size={13} />
              </Link>
            )}
            {hasOrganizer && !hasCreator && (
              <Link href="/events/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                <Plus size={13} /> Créer un événement
              </Link>
            )}
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
              <LogOut size={13} /> Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 24px 40px' }}>

        {/* Tab switcher */}
        {hasCreator && hasOrganizer && (
          <div style={{ marginBottom: '20px' }}>
            <NexTabs
              tabs={[
                { key: 'creator',   icon: <Users size={13} />,    label: 'Créateur' },
                { key: 'organizer', icon: <Calendar size={13} />, label: 'Organisateur' },
              ]}
              activeTab={dashTab}
              onChange={key => setDashTab(key as typeof dashTab)}
              ariaLabel="Vue du tableau de bord"
            />
          </div>
        )}

        {/* Profile completion banner (creator only) */}
        {hasCreator && dashTab === 'creator' && firstMissingStep && (
          <Link href={firstMissingStep.link} style={{ display: 'block', textDecoration: 'none', marginBottom: '16px' }}>
            <div style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.3)', backgroundColor: 'rgba(99,102,241,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={15} color={colors.violet.primary} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Profil incomplet — {profilePct}%</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Étape suivante : {firstMissingStep.label}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.violet.primary }}>Compléter →</span>
              </div>
              <div style={{ height: '3px', borderRadius: '4px', backgroundColor: 'rgba(99,102,241,0.2)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ height: '100%', borderRadius: '4px', backgroundColor: colors.violet.primary, width: `${profilePct}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </Link>
        )}

        {/* Billing card */}
        <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${isPaid ? 'rgba(99,102,241,0.3)' : colors.border.default}`, backgroundColor: isPaid ? 'rgba(99,102,241,0.12)' : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isPaid ? 'rgba(99,102,241,0.25)' : 'var(--bg-secondary)', flexShrink: 0 }}>
            <CreditCard size={16} color={isPaid ? colors.violet.primary : colors.text.muted} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Abonnement</span>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '20px', backgroundColor: tierCfg.bg, color: tierCfg.color }}>{tierCfg.label}</span>
              {subscriptionStatus === 'active' && <span style={{ fontSize: '11px', color: colors.status.accepted.text, fontWeight: 600 }}>Actif</span>}
            </div>
            {isPaid && subscriptionEndsAt ? (
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Renouvellement le {new Date(subscriptionEndsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Passez à un plan payant pour débloquer plus de fonctionnalités</p>
            )}
          </div>
          {isPaid ? (
            <button onClick={handleOpenPortal} disabled={portalLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: portalLoading ? 0.6 : 1, flexShrink: 0 }}>
              <ExternalLink size={12} /> {portalLoading ? 'Chargement…' : 'Gérer'}
            </button>
          ) : (
            <Link href="/offres" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', border: '0.5px solid #6366F1', color: colors.violet.primary, fontSize: '12px', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
              Voir les offres <ArrowRight size={12} />
            </Link>
          )}
        </div>

        {/* KPI row — per tab */}
        {!loading && dashTab === 'creator' && hasCreator && (
          <div className="kpi-grid" style={{ marginBottom: '20px' }}>
            <KpiCard label="Candidatures" value={applications.length} color={colors.violet.primary} />
            <KpiCard label="Acceptées" value={acceptedApps.length} color={colors.status.accepted.text} />
            <KpiCard label="Taux d'acceptation" value={`${acceptanceRate}%`} color="#D97706" />
            <KpiCard label="Vues profil (30j)" value={profileViewCount} color={colors.violet.primary} />
          </div>
        )}
        {!loading && dashTab === 'organizer' && hasOrganizer && (
          <>
            {connectAlertParams && <StripeConnectAlert searchParams={connectAlertParams} />}
            {accessToken && <StripeConnectBanner token={accessToken} />}
          </>
        )}
        {!loading && dashTab === 'organizer' && hasOrganizer && (
          <div className="kpi-grid" style={{ marginBottom: '20px' }}>
            <KpiCard label="Événements" value={events.length} color={colors.violet.primary} />
            <KpiCard label="Publiés" value={publishedEvents.length} color={colors.status.accepted.text} />
            <KpiCard label="En attente" value={pendingApps.length} color="#D97706" />
            <KpiCard label="Candidatures tardives" value={lateApps.length} color={lateApps.length > 0 ? colors.feedback.danger.solid : colors.text.muted} />
          </div>
        )}
        {loading && <KpiRowSkeleton />}

        {/* Creator tab */}
        {(dashTab === 'creator' || (!hasOrganizer && !isAdmin)) && (
          <div className="dash-grid">
            <div>
              {loading ? <FeedSkeleton /> : hasCreator ? (
                <CreatorMainContent
                  applications={applications}
                  userId={user.id}
                  profileViewCount={profileViewCount}
                  profileViewDays={profileViewDays}
                />
              ) : <VisitorContent />}
            </div>
            <div>
              {loading ? <SidebarSkeleton /> : hasCreator ? (
                <CreatorSidebar userId={user.id} nextEvent={nextAcceptedEvent} />
              ) : null}
            </div>
          </div>
        )}

        {/* Organizer tab */}
        {dashTab === 'organizer' && hasOrganizer && (
          <div className="dash-grid">
            <div>
              {loading ? <FeedSkeleton /> : (
                <OrganizerMainContent
                  events={events}
                  pendingApps={pendingApps}
                  setPendingApps={setPendingApps}
                  lateApps={lateApps}
                  userId={user.id}
                  selectedEventId={selectedEventId}
                  setSelectedEventId={setSelectedEventId}
                />
              )}
            </div>
            <div>
              {loading ? <SidebarSkeleton /> : (
                <OrganizerSidebar events={events} nextEvent={nextEvent} selectedEventId={selectedEventId} />
              )}
            </div>
          </div>
        )}

      </div>

      {/* Mobile sticky quick actions bar */}
      {!loading && (
        <div className="mobile-quick-bar">
          {(dashTab === 'creator' || (!hasOrganizer && !isAdmin)) && hasCreator ? (
            <>
              <a href="/events"><Calendar size={18} /><span>Marchés</span></a>
              <a href="/profile"><User size={18} /><span>Profil</span></a>
              <a href={`/boutique/${user.id}`}><ShoppingBag size={18} /><span>Boutique</span></a>
              <a href="/analytics"><BarChart2 size={18} /><span>Stats</span></a>
              <a href="/carte"><MapPin size={18} /><span>Carte</span></a>
            </>
          ) : dashTab === 'organizer' && hasOrganizer ? (
            <>
              <a href="/events/create"><Plus size={18} /><span>Créer</span></a>
              <a href="/organizer/analytics"><BarChart2 size={18} /><span>Analytics</span></a>
              <a href="/messages"><MessageSquare size={18} /><span>Messages</span></a>
              <a href="/calendrier"><CalendarDays size={18} /><span>Calendrier</span></a>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border-color)', borderLeft: color ? `3px solid ${color}` : '1px solid var(--border-color)' }}>
      <div style={{ fontSize: '24px', fontWeight: 500, color: color ?? 'var(--text-primary)', lineHeight: 1, marginBottom: '4px' }}>
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  )
}

// ─── Creator main content (left column) ──────────────────────────────────────

function CreatorMainContent({
  applications,
  userId,
  profileViewCount,
  profileViewDays,
}: {
  applications: (Application & { event?: Event })[]
  userId: string
  profileViewCount: number
  profileViewDays: { date: string; count: number }[]
}) {
  const [tab, setTab] = useState<'candidatures' | 'calendrier' | 'paiements'>('candidatures')
  const [recommended, setRecommended] = useState<(Event & { _score?: number; _reason?: string })[]>([])
  const [paidApps, setPaidApps] = useState<(Application & { event?: Event })[]>([])
  const appliedEventIds = new Set(applications.map(a => a.event_id))
  const appliedOrgaIds = new Set(applications.map(a => (a.event as any)?.organizer_id).filter(Boolean))

  useEffect(() => {
    const load = async () => {
      const { data: cp } = await supabase.from('creator_profiles').select('disciplines, city, region').eq('user_id', userId).maybeSingle()
      if (!cp?.disciplines?.length) return
      const { data: evs } = await supabase.from('events').select('*').eq('status', 'published').gt('start_date', new Date().toISOString()).limit(50)
      if (!evs) return
      const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      const scored = evs
        .filter(e => !appliedEventIds.has(e.id))
        .map(e => {
          const tags: string[] = (e as any).discipline_tags ?? []
          const matchDisc = tags.some((t: string) => cp.disciplines.includes(t))
          if (!matchDisc) return null
          let score = 0; let reason = 'Correspond à vos disciplines'
          const discMatches = tags.filter((t: string) => cp.disciplines.includes(t)).length
          score += discMatches * 3
          if (cp.region && (e as any).region === cp.region) { score += 2; reason = `Dans votre région` }
          if (cp.city && e.city === cp.city) { score += 1; reason = `Dans votre ville` }
          if (e.start_date && e.start_date <= in60days) score += 1
          if (appliedOrgaIds.has((e as any).organizer_id)) { score += 2; reason = `Organisateur que vous connaissez` }
          return { ...e, _score: score, _reason: reason }
        })
        .filter(Boolean) as (Event & { _score: number; _reason: string })[]
      scored.sort((a, b) => b._score - a._score)
      setRecommended(scored.slice(0, 3))
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const paidCount = applications.filter(a => a.status === 'paid').length

  useEffect(() => {
    if (tab === 'paiements' && !paidApps.length) {
      setPaidApps(applications.filter(a => a.status === 'paid' || a.status === 'refunded'))
    }
  }, [tab, applications, paidApps.length])

  const tabs = [
    { key: 'candidatures', label: `Candidatures (${applications.length})` },
    { key: 'calendrier', label: 'Calendrier' },
    ...(paidCount > 0 ? [{ key: 'paiements', label: `Mes paiements (${paidCount})` }] : []),
  ]

  return (
    <div>
      {/* Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <NexTabs
          tabs={tabs}
          activeTab={tab}
          onChange={key => setTab(key as typeof tab)}
          variant="underline"
          ariaLabel="Sections créateur"
        />
      </div>

      {tab === 'candidatures' && (
        <ApplicationsFeed applications={applications} />
      )}
      {tab === 'calendrier' && (
        <CalendarView applications={applications} />
      )}
      {tab === 'paiements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paidApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <CreditCard size={32} color="var(--bg-secondary)" style={{ margin: '0 auto 12px' }} />
              <p>Aucun paiement de stand pour le moment</p>
            </div>
          ) : paidApps.map(a => (
            <Link key={a.id} href={`/events/${a.event_id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.event?.title ?? 'Événement'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  {a.event?.start_date ? new Date(a.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                  {a.event?.stand_price ? ` · ${a.event.stand_price} €` : ''}
                </p>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '8px',
                backgroundColor: a.status === 'refunded' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                color: a.status === 'refunded' ? '#f87171' : '#4ade80',
              }}>
                {a.status === 'refunded' ? 'Remboursé' : 'Payé ✓'}
              </span>
            </Link>
          ))}
        </div>
      )}


      {/* Mes documents — affiché seulement si une candidature acceptée est liée à un événement */}
      {applications.find(a => a.status === 'accepted' && a.event_id) && (
        <div style={{ marginTop: '32px' }}>
          <DocumentsPanel eventId={applications.find(a => a.status === 'accepted' && a.event_id)!.event_id} role="creator" />
        </div>
      )}

      {/* Recommandations */}
      {recommended.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Pour vous</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Sélectionnés selon vos disciplines</p>
            </div>
            <Link href="/events" style={{ fontSize: '12px', fontWeight: 600, color: colors.violet.primary, textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommended.map(ev => (
              <Link key={ev.id} href={`/events/${ev.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    {ev.start_date && new Date(ev.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    {ev.city ? ` · ${ev.city}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(99,102,241,0.15)', color: colors.violet.primary, flexShrink: 0 }}>
                  {(ev as any)._reason ?? 'Recommandé'}
                </span>
                <ArrowRight size={13} color={colors.violet.primary} style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Applications feed ────────────────────────────────────────────────────────

function ApplicationsFeed({ applications }: { applications: (Application & { event?: Event })[] }) {
  if (applications.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '10px', border: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <Calendar size={36} color="var(--bg-secondary)" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Aucune candidature pour le moment</p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 16px' }}>Explorez les événements disponibles et postulez</p>
        <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Voir les événements <ArrowRight size={13} />
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {applications.map(app => {
        const status = app.status as 'pending' | 'accepted' | 'refused'
        const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
        const isBoosted = (app as any).boosted_at && new Date(new Date((app as any).boosted_at).getTime() + 48 * 60 * 60 * 1000) > new Date()
        return (
          <div key={app.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${status === 'accepted' ? 'rgba(22,163,74,0.3)' : status === 'refused' ? 'rgba(220,38,38,0.3)' : colors.border.default}`, backgroundColor: status === 'accepted' ? 'rgba(22,163,74,0.1)' : status === 'refused' ? 'rgba(220,38,38,0.1)' : 'var(--bg-secondary)' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: sc.dot, flexShrink: 0, marginTop: '5px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {app.event?.title || 'Événement inconnu'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {app.event?.start_date && new Date(app.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                {app.event?.city ? ` · ${app.event.city}` : ''}
              </p>
              {isBoosted && (
                <span title="Candidature boostée — remontée en haut de la liste de l'organisateur pendant 48h" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', backgroundColor: colors.violet.primary, color: '#fff', marginTop: '4px', cursor: 'help' }}>
                  <Zap size={9} fill="white" /> Boosté
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
              {status === 'pending' && (
                <BoostButton
                  type="boost_application"
                  refId={app.id}
                  boostedUntil={(app as any).boosted_at ? new Date(new Date((app as any).boosted_at).getTime() + 48 * 60 * 60 * 1000).toISOString() : null}
                />
              )}
              {app.event && (
                <Link href={`/events/${app.event_id}`} style={{ color: colors.violet.primary, fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  Voir <ArrowRight size={11} />
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({ applications }: { applications: (Application & { event?: Event })[] }) {
  const sorted = [...applications]
    .filter(a => a.event?.start_date)
    .sort((a, b) => new Date(a.event!.start_date).getTime() - new Date(b.event!.start_date).getTime())

  const grouped: Record<string, typeof sorted> = {}
  sorted.forEach(a => {
    const key = new Date(a.event!.start_date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(a)
  })

  if (Object.keys(grouped).length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Aucune candidature avec date d&apos;événement</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Object.entries(grouped).map(([month, apps]) => (
        <div key={month}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1, height: '0.5px', backgroundColor: 'var(--border-color)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: '20px', backgroundColor: 'var(--bg-secondary)', textTransform: 'capitalize' }}>{month}</span>
            <div style={{ flex: 1, height: '0.5px', backgroundColor: 'var(--border-color)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', borderLeft: '2px solid var(--border-color)' }}>
            {apps.map(app => {
              const sc = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
              const d = new Date(app.event!.start_date)
              return (
                <Link key={app.id} href={`/events/${app.event_id}`} style={{ textDecoration: 'none', display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ width: '40px', flexShrink: 0, textAlign: 'center', backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: '8px', padding: '6px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: colors.violet.primary, lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.event?.title}</p>
                    {app.event?.city && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{app.event.city}</p>}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, flexShrink: 0 }}>
                    {sc.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Creator sidebar ──────────────────────────────────────────────────────────

function CreatorSidebar({ userId, nextEvent }: { userId: string; nextEvent?: Application & { event?: Event } }) {
  const QUICK_ACTIONS = [
    { href: '/events',           icon: <Calendar size={15} />,    label: 'Marchés' },
    { href: '/profile',          icon: <User size={15} />,        label: 'Mon profil' },
    { href: `/boutique/${userId}`, icon: <ShoppingBag size={15} />, label: 'Ma boutique' },
    { href: '/analytics',        icon: <BarChart2 size={15} />,   label: 'Analytics' },
    { href: '/carte',            icon: <MapPin size={15} />,      label: 'Carte' },
    { href: '/profile?tab=disponibilites', icon: <Clock size={15} />, label: 'Dispos' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Quick actions */}
      <div className="sidebar-quick-actions">
        <SidebarCard title="Actions rapides">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.href} href={a.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '10px 6px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 500, textAlign: 'center' }}>
                <span style={{ color: colors.violet.primary }}>{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </SidebarCard>
      </div>

      {/* Credits */}
      <CreditsWidget />

      {/* Referral */}
      <ReferralWidget />

      {/* Next event */}
      {nextEvent?.event && (
        <SidebarCard title="Prochain marché">
          <Link href={`/events/${nextEvent.event_id}`} style={{ textDecoration: 'none' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{nextEvent.event.title}</p>
            {nextEvent.event.start_date && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                {new Date(nextEvent.event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <CountdownBadge date={nextEvent.event.start_date} />
          </Link>
        </SidebarCard>
      )}
    </div>
  )
}

// ─── Organizer main content (left column) ────────────────────────────────────

type PendingApp = { id: string; creator_id: string; event_id: string; message: string | null; created_at: string; boosted_at?: string | null; profiles: { full_name: string | null; avatar_url: string | null } | null }

function OrganizerMainContent({
  events,
  pendingApps,
  setPendingApps,
  lateApps,
  userId,
  selectedEventId,
  setSelectedEventId,
}: {
  events: Event[]
  pendingApps: PendingApp[]
  setPendingApps: React.Dispatch<React.SetStateAction<PendingApp[]>>
  lateApps: PendingApp[]
  userId: string
  selectedEventId: string
  setSelectedEventId: React.Dispatch<React.SetStateAction<string>>
}) {
  const [tab, setTab] = useState<'candidatures' | 'retard' | 'messages'>('candidatures')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [refuseModal, setRefuseModal] = useState<{ appId: string; eventTitle?: string; creatorId?: string } | null>(null)
  const [refuseReasons, setRefuseReasons] = useState<string[]>([])
  const [reviewModal, setReviewModal] = useState<{ eventId: string; eventTitle: string; creatorId: string; creatorName: string } | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [pendingReviews, setPendingReviews] = useState<{ eventId: string; eventTitle: string; creatorId: string; creatorName: string; creatorAvatar: string | null }[]>([])

  // Marquer candidatures comme vues
  useEffect(() => {
    const unviewed = pendingApps.filter(a => !(a as any).viewed_at).map(a => a.id)
    if (!unviewed.length) return
    supabase.from('applications').update({ viewed_at: new Date().toISOString() } as any).in('id', unviewed).then(() => {})
  }, [pendingApps])

  // Default selected event = prochain événement (only when not yet set from parent)
  useEffect(() => {
    if (!events.length || selectedEventId) return
    const next = events.filter(e => e.start_date && new Date(e.start_date) > new Date()).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0]
    setSelectedEventId(next?.id ?? events[0].id)
  }, [events, selectedEventId, setSelectedEventId])

  // Pending reviews
  useEffect(() => {
    const loadPendingReviews = async () => {
      const pastEvents = events.filter(e => e.end_date && new Date(e.end_date) < new Date())
      if (!pastEvents.length) return
      const { data: apps } = await supabase.from('applications').select('id, creator_id, event_id, profiles(full_name, avatar_url)').in('event_id', pastEvents.map(e => e.id)).eq('status', 'accepted')
      if (!apps?.length) return
      const { data: existingReviews } = await supabase.from('reviews').select('reviewed_id, event_id').eq('reviewer_id', userId)
      const reviewed = new Set((existingReviews ?? []).map(r => `${r.event_id}:${r.reviewed_id}`))
      const pending = (apps as unknown as { id: string; creator_id: string; event_id: string; profiles: { full_name: string | null; avatar_url: string | null } | null }[])
        .filter(a => !reviewed.has(`${a.event_id}:${a.creator_id}`))
        .map(a => ({
          eventId: a.event_id,
          eventTitle: pastEvents.find(e => e.id === a.event_id)?.title ?? 'Événement',
          creatorId: a.creator_id,
          creatorName: a.profiles?.full_name ?? 'Créateur',
          creatorAvatar: a.profiles?.avatar_url ?? null,
        }))
      setPendingReviews(pending)
    }
    if (events.length) loadPendingReviews()
  }, [events, userId])

  const REFUSE_OPTIONS = [
    { key: 'full',       label: 'Événement complet' },
    { key: 'discipline', label: 'Discipline hors-cible' },
    { key: 'profile',    label: 'Profil incomplet' },
    { key: 'geo',        label: 'Zone géographique' },
    { key: 'other',      label: 'Autre raison' },
  ]

  const handleStatus = async (appId: string, status: 'accepted' | 'refused', eventTitle?: string, creatorId?: string) => {
    setUpdatingId(appId)
    await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId)
    if (creatorId && eventTitle) {
      await supabase.from('notifications').insert({
        user_id: creatorId,
        type: status === 'accepted' ? 'application_accepted' : 'application_rejected',
        title: status === 'accepted' ? 'Candidature acceptée' : 'Candidature non retenue',
        body: status === 'accepted' ? `Votre candidature pour "${eventTitle}" a été acceptée !` : `Votre candidature pour "${eventTitle}" n'a pas été retenue.`,
        link: `/events/${pendingApps.find(a => a.id === appId)?.event_id}`,
      })
    }
    setPendingApps(prev => prev.filter(a => a.id !== appId))
    setUpdatingId(null)
  }

  const confirmRefuse = async () => {
    if (!refuseModal) return
    const { appId, eventTitle, creatorId } = refuseModal
    setUpdatingId(appId)
    await (supabase.from('applications') as any).update({
      status: 'refused',
      rejection_reason: refuseReasons.length ? { reasons: refuseReasons } : null,
      updated_at: new Date().toISOString(),
    }).eq('id', appId)
    if (creatorId && eventTitle) {
      const reasonLabel = refuseReasons.length
        ? ` Raison : ${refuseReasons.map(r => REFUSE_OPTIONS.find(o => o.key === r)?.label ?? r).join(', ')}.`
        : ''
      await supabase.from('notifications').insert({
        user_id: creatorId,
        type: 'application_rejected',
        title: 'Candidature non retenue',
        body: `Votre candidature pour "${eventTitle}" n'a pas été retenue.${reasonLabel}`,
        link: `/events/${pendingApps.find(a => a.id === appId)?.event_id}`,
      })
    }
    setPendingApps(prev => prev.filter(a => a.id !== appId))
    setUpdatingId(null)
    setRefuseModal(null)
    setRefuseReasons([])
  }

  const submitReview = async () => {
    if (!reviewModal || reviewRating === 0) return
    setReviewSubmitting(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: reviewModal.eventId, reviewer_id: userId, reviewed_id: reviewModal.creatorId, reviewer_role: 'organizer', rating: reviewRating, comment: reviewComment.trim() || null }),
    })
    setPendingReviews(prev => prev.filter(r => !(r.eventId === reviewModal.eventId && r.creatorId === reviewModal.creatorId)))
    setReviewModal(null); setReviewRating(0); setReviewComment(''); setReviewSubmitting(false)
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)
  const selectedEventPending = pendingApps.filter(a => a.event_id === selectedEventId)

  const tabs: { key: 'candidatures' | 'retard' | 'messages'; label: string; badge?: number }[] = [
    { key: 'candidatures', label: `Candidatures (${pendingApps.length})` },
    { key: 'retard', label: 'À traiter', badge: lateApps.length },
    { key: 'messages', label: 'Messages' },
  ]

  const displayApps = tab === 'retard' ? lateApps : pendingApps

  return (
    <div>
      {/* Avis à laisser */}
      {pendingReviews.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.3)', backgroundColor: 'rgba(217,119,6,0.1)' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>Avis à laisser ({pendingReviews.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingReviews.slice(0, 3).map(r => (
              <div key={`${r.eventId}:${r.creatorId}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: colors.violet.primary, flexShrink: 0, overflow: 'hidden' }}>
                  {r.creatorAvatar ? <Image src={r.creatorAvatar} alt="" width={32} height={32} style={{ objectFit: 'cover', width: '100%', height: '100%' }} /> : r.creatorName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{r.creatorName}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.eventTitle}</p>
                </div>
                <button onClick={() => { setReviewModal(r); setReviewRating(0); setReviewComment('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '7px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <Star size={11} /> Noter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidatures tabs */}
      <div style={{ marginBottom: '16px' }}>
        <NexTabs
          tabs={tabs}
          activeTab={tab}
          onChange={key => setTab(key as typeof tab)}
          variant="underline"
          ariaLabel="Sections organisateur"
        />
      </div>

      {tab === 'messages' ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <MessageSquare size={32} color="var(--bg-secondary)" style={{ margin: '0 auto 12px' }} />
          <p>Ouvrez la messagerie pour communiquer avec vos exposants</p>
          <Link href="/messages" style={{ display: 'inline-block', marginTop: '12px', padding: '8px 16px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Messagerie
          </Link>
        </div>
      ) : displayApps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: '10px', border: '1px dashed var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '13px' }}>
          {tab === 'retard' ? 'Aucune candidature en retard ✓' : 'Aucune candidature en attente'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayApps.slice(0, 10).map(app => {
            const ev = events.find(e => e.id === app.event_id)
            const isBoosted = app.boosted_at && new Date(app.boosted_at).getTime() + 48 * 3600 * 1000 > Date.now()
            const daysPending = Math.floor((Date.now() - new Date(app.created_at).getTime()) / (24 * 60 * 60 * 1000))
            return (
              <motion.div key={app.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${isBoosted ? 'rgba(99,102,241,0.3)' : colors.border.default}`, backgroundColor: isBoosted ? 'rgba(99,102,241,0.12)' : 'var(--bg-secondary)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: colors.violet.primary, flexShrink: 0, overflow: 'hidden' }}>
                  {app.profiles?.avatar_url
                    ? <Image src={app.profiles.avatar_url} alt="" width={32} height={32} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                    : (app.profiles?.full_name?.[0] || '?')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <Link href={`/creators/${app.creator_id}`} style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {app.profiles?.full_name || 'Créateur'}
                    </Link>
                    {isBoosted && (
                      <span title="Ce créateur a boosté sa candidature — il est remonté en haut de votre liste" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '20px', backgroundColor: colors.violet.primary, color: '#fff', cursor: 'help' }}>
                        <Zap size={8} fill="white" /> Boosté
                      </span>
                    )}
                    {tab === 'retard' && (
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '20px', backgroundColor: 'rgba(220,38,38,0.2)', color: '#f87171' }}>
                        {daysPending}j
                      </span>
                    )}
                  </div>
                  {ev && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>}
                  {app.message && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>&ldquo;{app.message}&rdquo;</p>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => handleStatus(app.id, 'accepted', ev?.title, app.creator_id)} disabled={updatingId === app.id}
                    style={{ padding: '5px 10px', borderRadius: '7px', backgroundColor: colors.feedback.success.solid, color: '#fff', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', opacity: updatingId === app.id ? 0.5 : 1 }}>
                    Accepter
                  </button>
                  <button onClick={() => { setRefuseModal({ appId: app.id, eventTitle: ev?.title, creatorId: app.creator_id }); setRefuseReasons([]) }} disabled={updatingId === app.id}
                    style={{ padding: '5px 10px', borderRadius: '7px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)', color: colors.feedback.danger.solid, fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: updatingId === app.id ? 0.5 : 1 }}>
                    Refuser
                  </button>
                </div>
              </motion.div>
            )
          })}
          {pendingApps.length > 10 && tab !== 'retard' && (
            <Link href={`/events/${events[0]?.id}/exhibitors`} style={{ display: 'block', textAlign: 'center', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, color: colors.violet.primary, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Tout voir ({pendingApps.length}) →
            </Link>
          )}
        </div>
      )}

      {/* Grille outils */}
      {events.length > 0 && (
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Outils événement</h2>
            {events.length > 1 && (
              <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
                style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { href: `/events/${selectedEventId}/exhibitors`, icon: <Users size={16} />, label: 'Exposants', sub: `${selectedEventPending.length} en attente` },
              { href: `/events/${selectedEventId}/waitlist`,   icon: <Clock size={16} />,     label: 'Liste d\'attente', sub: '' },
              { href: `/events/${selectedEventId}/campaigns`,  icon: <MessageSquare size={16} />, label: 'Campagnes', sub: '' },
              { href: `/events/${selectedEventId}/team`,       icon: <Users size={16} />,        label: 'Équipe', sub: '' },
              { href: `/events/${selectedEventId}/volunteers`, icon: <Heart size={16} />,        label: 'Bénévoles', sub: '' },
              { href: `/events/${selectedEventId}/settings/marketing`, icon: <Star size={16} />, label: 'Marketing', sub: '' },
              { href: `/events/${selectedEventId}/analytics`,  icon: <BarChart2 size={16} />,    label: 'Analytics', sub: '' },
              { href: `/api/events/${selectedEventId}/exhibitors/export`, icon: <ArrowRight size={16} />, label: 'Export CSV', sub: '', target: '_blank' },
            ].map(tool => (
              <Link key={tool.href} href={tool.href} target={(tool as any).target} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 10px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
                <span style={{ color: colors.violet.primary }}>{tool.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{tool.label}</span>
                {tool.sub && <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{tool.sub}</span>}
              </Link>
            ))}
          </div>

          {/* Events list */}
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Mes événements</h2>
              <Link href="/events/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                <Plus size={12} /> Créer
              </Link>
            </div>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', borderRadius: '10px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>Aucun événement créé</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {events.slice(0, 5).map(event => {
                  const statusCfg = {
                    published: { label: 'Publié', color: colors.status.accepted.text, bg: 'rgba(22,163,74,0.12)', dot: colors.status.accepted.text },
                    draft: { label: 'Brouillon', color: colors.feedback.warning.solid, bg: 'rgba(217,119,6,0.12)', dot: colors.feedback.warning.solid },
                    closed: { label: 'Fermé', color: 'var(--text-secondary)', bg: 'var(--bg-secondary)', dot: 'var(--border-color)' },
                  }[event.status] ?? { label: event.status, color: 'var(--text-secondary)', bg: colors.bg.secondary, dot: colors.text.muted }
                  const ep = pendingApps.filter(a => a.event_id === event.id).length
                  return (
                    <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</p>
                        {event.start_date && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '1px 0 0' }}>{new Date(event.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {ep > 0 && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', backgroundColor: 'rgba(217,119,6,0.15)', color: '#fbbf24' }}>{ep} en attente</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', backgroundColor: statusCfg.bg, color: statusCfg.color }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: statusCfg.dot }} />
                          {statusCfg.label}
                        </span>
                      </div>
                    </Link>
                  )
                })}
                {events.length > 5 && (
                  <Link href="/events" style={{ display: 'block', textAlign: 'center', padding: '8px', color: colors.violet.primary, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                    Voir tous ({events.length})
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <NexModal
        isOpen={!!refuseModal}
        onClose={() => setRefuseModal(null)}
        title="Raison du refus"
        subtitle="Optionnel — aide le créateur à améliorer sa candidature"
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setRefuseModal(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Annuler</button>
            <button onClick={confirmRefuse} disabled={!refuseModal || updatingId === refuseModal.appId}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: colors.feedback.danger.solid, color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: refuseModal && updatingId === refuseModal.appId ? 0.5 : 1 }}>
              Confirmer
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {REFUSE_OPTIONS.map(opt => (
            <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
              <input type="checkbox" checked={refuseReasons.includes(opt.key)}
                onChange={e => setRefuseReasons(prev => e.target.checked ? [...prev, opt.key] : prev.filter(r => r !== opt.key))} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </NexModal>

      <NexModal
        isOpen={!!reviewModal}
        onClose={() => { setReviewModal(null); setReviewRating(0); setReviewComment('') }}
        title="Laisser un avis"
        subtitle={reviewModal ? `Pour ${reviewModal.creatorName} — ${reviewModal.eventTitle}` : ''}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setReviewModal(null); setReviewRating(0); setReviewComment('') }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Annuler</button>
            <button onClick={submitReview} disabled={reviewRating === 0 || reviewSubmitting}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: reviewRating === 0 || reviewSubmitting ? 0.5 : 1 }}>
              {reviewSubmitting ? 'Envoi…' : 'Publier'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setReviewRating(n)} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} aria-pressed={n <= reviewRating} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
              <Star size={26} fill={n <= reviewRating ? colors.status.pending.dot : 'none'} color={n <= reviewRating ? colors.status.pending.dot : 'var(--border-color)'} aria-hidden="true" />
            </button>
          ))}
        </div>
        <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Commentaire optionnel…" rows={3}
          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontSize: '13px', resize: 'none', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }} />
      </NexModal>
    </div>
  )
}

// ─── Organizer sidebar ────────────────────────────────────────────────────────

function OrganizerSidebar({ events, nextEvent, selectedEventId }: { events: Event[]; nextEvent?: Event; selectedEventId: string }) {
  const [bulkModal, setBulkModal] = useState(false)
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkDone, setBulkDone] = useState(false)
  const [checklist, setChecklist] = useState<{ title: string; description?: string; completed?: boolean }[]>([])

  useEffect(() => {
    if (!selectedEventId) return
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch(`/api/events/${selectedEventId}/checklists`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      setChecklist(json.checklist?.items ?? [])
    })
  }, [selectedEventId])

  const handleBulkSend = async () => {
    if (!selectedEventId || !bulkSubject.trim() || !bulkMessage.trim()) return
    setBulkSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setBulkSending(false); return }
    const { data: accepted } = await supabase
      .from('applications')
      .select('creator_id')
      .eq('event_id', selectedEventId)
      .eq('status', 'accepted')
    const creatorIds = (accepted ?? []).map((a: any) => a.creator_id)
    if (!creatorIds.length) { setBulkSending(false); return }
    await fetch('/api/organizer/bulk-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ event_id: selectedEventId, creator_ids: creatorIds, subject: bulkSubject, message: bulkMessage }),
    })
    setBulkSending(false)
    setBulkDone(true)
    setTimeout(() => { setBulkModal(false); setBulkDone(false); setBulkSubject(''); setBulkMessage('') }, 1500)
  }

  const pending = checklist.filter(i => !i.completed).slice(0, 4)

  const QUICK_ACTIONS = [
    { href: '/events/create',      icon: <Plus size={15} />,       label: 'Créer événement' },
    { href: '/organizer/analytics', icon: <BarChart2 size={15} />, label: 'Analytics' },
    { href: '/messages',            icon: <MessageSquare size={15} />, label: 'Messages' },
    { href: '/calendrier',          icon: <CalendarDays size={15} />, label: 'Calendrier' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="sidebar-quick-actions">
        <SidebarCard title="Actions rapides">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
            {QUICK_ACTIONS.map(a => (
              <Link key={a.href} href={a.href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', padding: '12px 8px', borderRadius: '8px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 500, textAlign: 'center' }}>
                <span style={{ color: colors.violet.primary }}>{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
          {selectedEventId && (
            <button
              onClick={() => setBulkModal(true)}
              style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px 12px', borderRadius: '8px', border: '0.5px solid #6366F1', backgroundColor: 'rgba(99,102,241,0.06)', color: colors.violet.primary, fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              <MessageSquare size={13} /> Message groupé
            </button>
          )}
        </SidebarCard>
      </div>

      {selectedEventId && pending.length > 0 && (
        <SidebarCard title="Checklist">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pending.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '4px', border: '1.5px solid var(--border-color)', flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{item.title}</p>
                  {item.description && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
          <Link href={`/events/${selectedEventId}/settings/checklist`} style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', color: colors.violet.primary, fontWeight: 600, textDecoration: 'none' }}>
            Tout voir →
          </Link>
        </SidebarCard>
      )}

      {nextEvent && (
        <SidebarCard title="Prochain événement">
          <Link href={`/events/${nextEvent.id}`} style={{ textDecoration: 'none' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>{nextEvent.title}</p>
            {nextEvent.start_date && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                {new Date(nextEvent.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
            <CountdownBadge date={nextEvent.start_date} />
          </Link>
        </SidebarCard>
      )}

      {/* Bulk message modal */}
      <NexModal
        isOpen={bulkModal}
        onClose={() => { setBulkModal(false); setBulkDone(false); setBulkSubject(''); setBulkMessage('') }}
        title="Message groupé"
        subtitle="Envoie un message à tous les créateurs acceptés de cet événement"
        size="md"
        footer={!bulkDone ? (
          <button
            onClick={handleBulkSend}
            disabled={bulkSending || !bulkSubject.trim() || !bulkMessage.trim()}
            style={{ width: '100%', padding: '11px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: bulkSending ? 'not-allowed' : 'pointer', opacity: bulkSending || !bulkSubject.trim() || !bulkMessage.trim() ? 0.6 : 1 }}
          >
            {bulkSending ? 'Envoi en cours…' : 'Envoyer à tous les créateurs acceptés'}
          </button>
        ) : undefined}
      >
        {bulkDone ? (
          <p style={{ textAlign: 'center', color: colors.status.accepted.text, fontWeight: 600, padding: '20px 0', margin: 0 }}>✓ Messages envoyés !</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Sujet</label>
              <input
                value={bulkSubject}
                onChange={e => setBulkSubject(e.target.value)}
                placeholder="Ex : Informations importantes"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Message</label>
              <textarea
                value={bulkMessage}
                onChange={e => setBulkMessage(e.target.value)}
                rows={5}
                placeholder="Écrivez votre message à tous les créateurs acceptés…"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)' }}
              />
            </div>
          </div>
        )}
      </NexModal>
    </div>
  )
}

// ─── Shared sidebar card ──────────────────────────────────────────────────────

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: '10px', border: `1px solid ${colors.border.default}`, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
      </div>
      <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-secondary)' }}>
        {children}
      </div>
    </div>
  )
}

// ─── Countdown badge ──────────────────────────────────────────────────────────

function CountdownBadge({ date }: { date: string }) {
  if (!date) return null
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  if (days < 0) return null
  const color = days <= 7 ? colors.feedback.danger.solid : days <= 30 ? colors.feedback.warning.solid : colors.status.accepted.text
  const bg = days <= 7 ? 'rgba(220,38,38,0.15)' : days <= 30 ? 'rgba(217,119,6,0.15)' : 'rgba(22,163,74,0.15)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', backgroundColor: bg, color }}>
      <Clock size={11} /> {days === 0 ? "Aujourd'hui" : `Dans ${days}j`}
    </span>
  )
}

// ─── Visitor content ──────────────────────────────────────────────────────────

function VisitorContent() {
  return (
    <div>
      <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Explorer Nexart</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        {[
          { href: '/events',   icon: <Calendar size={16} />, title: 'Événements',    desc: 'Parcourir le calendrier' },
          { href: '/creators', icon: <Users size={16} />,    title: 'Créateurs',     desc: 'Découvrir les artisans' },
          { href: '/carte',    icon: <MapPin size={16} />,   title: 'Carte',         desc: 'Événements proches' },
          { href: '/profile',  icon: <User size={16} />,     title: 'Mon profil',    desc: 'Gérer mes préférences' },
          { href: '/favorites',icon: <Heart size={16} />,    title: 'Favoris',       desc: 'Mes coups de cœur' },
          { href: '/messages', icon: <MessageSquare size={16} />, title: 'Messages', desc: 'Mes conversations' },
        ].map(card => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, backgroundColor: 'var(--bg-secondary)' }}>
            <span style={{ color: colors.violet.primary }}>{card.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{card.title}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

