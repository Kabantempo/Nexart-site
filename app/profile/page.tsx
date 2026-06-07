'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  User, Mail, MapPin, AtSign, Globe, Edit3, Save, X,
  Star, CheckCircle, Calendar, LogOut, Upload, ExternalLink,
  Shield,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

type Profile = {
  full_name: string; bio: string | null; avatar_url: string | null
  role: string | null; is_admin: boolean
}
type CreatorProfile = {
  disciplines: string[]; city: string | null; region: string | null
  travel_radius: string | null; portfolio_images: string[]
  website: string | null; instagram: string | null; etsy: string | null
  siret_verified: boolean; insurance_verified: boolean
  siret_number?: string | null
}
type Application = {
  id: string; status: string; created_at: string; message: string | null
  events: { title: string; city: string | null; start_date: string; cover_image: string | null } | null
}
type Review = {
  id: string; rating: number; comment: string | null; tags: string[] | null; created_at: string
  profiles: { full_name: string } | null
}

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
}

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

export default function ProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const rcProRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [creator, setCreator] = useState<CreatorProfile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'profil' | 'candidatures' | 'avis'>('profil')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [rcProUploading, setRcProUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Edit state
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editRegion, setEditRegion] = useState('')
  const [editRadius, setEditRadius] = useState('25')
  const [editDisc, setEditDisc] = useState<string[]>([])
  const [editInstagram, setEditInstagram] = useState('')
  const [editWebsite, setEditWebsite] = useState('')
  const [editEtsy, setEditEtsy] = useState('')
  const [siretNumber, setSiretNumber] = useState('')

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
        router.push('/admin')
        return
      }

      const [{ data: creat }, { data: apps }, { data: revs }] = await Promise.all([
        supabase.from('creator_profiles').select('*').eq('user_id', u.id).single(),
        supabase.from('applications').select('id,status,created_at,message,events(title,city,start_date,cover_image)').eq('creator_id', u.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('reviews').select('id,rating,comment,tags,created_at,profiles(full_name)').eq('reviewed_id', u.id).order('created_at', { ascending: false }).limit(20),
      ])

      setCreator(creat)
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
      setSiretNumber((creat as unknown as Record<string, unknown>)?.siret_number as string ?? '')
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await Promise.all([
      supabase.from('profiles').upsert({ id: user.id, full_name: editName, bio: editBio }),
      supabase.from('creator_profiles').upsert({
        user_id: user.id, disciplines: editDisc,
        city: editCity, region: editRegion, travel_radius: editRadius,
        instagram: editInstagram, website: editWebsite, etsy: editEtsy,
      }),
    ])
    setProfile(p => p ? { ...p, full_name: editName, bio: editBio } : p)
    setCreator(c => c ? { ...c, disciplines: editDisc, city: editCity, region: editRegion, travel_radius: editRadius, instagram: editInstagram, website: editWebsite, etsy: editEtsy } : c)
    setSaving(false)
    setEditing(false)
    showToast('✓ Profil enregistré')
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
      showToast('✓ Photo mise à jour')
    }
    setAvatarUploading(false)
  }

  const handleRcProUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setRcProUploading(true)
    const ext = file.name.split('.').pop()
    const { error } = await supabase.storage.from('insurance-docs').upload(`${user.id}/rc-pro.${ext}`, file, { upsert: true })
    if (!error) {
      await supabase.from('creator_profiles').update({ insurance_doc_url: `${user.id}/rc-pro.${ext}` }).eq('user_id', user.id)
      showToast('✓ Document RC Pro envoyé — en attente de vérification')
    }
    setRcProUploading(false)
  }

  const handleSiretSubmit = async () => {
    if (!user || siretNumber.length !== 14) return
    await supabase.from('creator_profiles').upsert({ user_id: user.id, siret_number: siretNumber })
    showToast('✓ SIRET enregistré — en attente de vérification admin')
  }

  const toggleDisc = (d: string) =>
    setEditDisc(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid #6366F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const name = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Utilisateur'
  const firstName = name.split(' ')[0]
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 16px 80px', animation: 'fadeInUp 0.4s ease' }}>
      <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: '#6366F1', overflow: 'hidden', border: '3px solid #EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '36px', fontWeight: '800', color: '#FFF' }}>{firstName[0]?.toUpperCase()}</span>
            }
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
            style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#6366F1', border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {avatarUploading
              ? <div style={{ width: '12px', height: '12px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              : <Upload size={12} color="#FFF" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #E5E7EB', marginBottom: '32px' }}>
        {(['profil', 'candidatures', 'avis'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
              fontSize: '14px', fontWeight: tab === t ? '700' : '500',
              color: tab === t ? '#6366F1' : '#888888',
              borderBottom: tab === t ? '2px solid #6366F1' : '2px solid transparent',
              marginBottom: '-2px',
            }}>
            {t === 'candidatures' ? `Candidatures (${applications.length})`
              : t === 'avis' ? `Avis (${reviews.length})`
              : 'Profil'}
          </button>
        ))}
      </div>

      {/* ── PROFIL ── */}
      {tab === 'profil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}>
              <User size={16} color="#6366F1" /> Bio
            </h3>
            {editing ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nom complet"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '15px', marginBottom: '12px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Décrivez votre activité…" rows={4}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box' }} />
              </>
            ) : (
              <p style={{ fontSize: '15px', color: profile?.bio ? '#1A1A1A' : '#9CA3AF', lineHeight: '1.7', margin: 0 }}>
                {profile?.bio ?? 'Aucune bio renseignée. Cliquez sur Modifier pour en ajouter une.'}
              </p>
            )}
          </div>

          <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 12px' }}>🎨 Disciplines</h3>
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
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="#6366F1" /> Localisation & déplacement
            </h3>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="Ville"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
                  <input value={editRegion} onChange={e => setEditRegion(e.target.value)} placeholder="Région"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit' }} />
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
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 12px' }}>🔗 Liens</h3>
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
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} color="#6366F1" /> Vérification
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* SIRET */}
              <div style={{ padding: '16px', borderRadius: '10px', border: `1px solid ${creator?.siret_verified ? '#A7F3D0' : '#E5E7EB'}`, backgroundColor: creator?.siret_verified ? '#ECFDF5' : '#FAFAFA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: siretNumber.length > 0 || editing ? '12px' : '0' }}>
                  <CheckCircle size={18} fill={creator?.siret_verified ? '#059669' : 'none'} color={creator?.siret_verified ? '#059669' : '#9CA3AF'} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>SIRET vérifié</p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                      {creator?.siret_verified ? '✓ Professionnel déclaré confirmé' : 'Confirme que vous êtes un professionnel déclaré'}
                    </p>
                  </div>
                </div>
                {!creator?.siret_verified && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={siretNumber} onChange={e => setSiretNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="14 chiffres SIRET" maxLength={14}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'monospace', letterSpacing: '1px' }} />
                    <button onClick={handleSiretSubmit} disabled={siretNumber.length !== 14}
                      style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: siretNumber.length === 14 ? '#6366F1' : '#E5E7EB', color: siretNumber.length === 14 ? '#FFF' : '#9CA3AF', fontSize: '13px', fontWeight: '700', cursor: siretNumber.length === 14 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                      Envoyer
                    </button>
                  </div>
                )}
              </div>

              {/* RC Pro */}
              <div style={{ padding: '16px', borderRadius: '10px', border: `1px solid ${creator?.insurance_verified ? '#A7F3D0' : '#E5E7EB'}`, backgroundColor: creator?.insurance_verified ? '#ECFDF5' : '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={18} fill={creator?.insurance_verified ? '#059669' : 'none'} color={creator?.insurance_verified ? '#059669' : '#9CA3AF'} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', margin: 0 }}>RC Pro valide</p>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                        {creator?.insurance_verified ? '✓ Assurance vérifiée' : 'Déposez votre attestation RC Pro (PDF ou image)'}
                      </p>
                    </div>
                  </div>
                  {!creator?.insurance_verified && (
                    <button onClick={() => rcProRef.current?.click()} disabled={rcProUploading}
                      style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: '#6366F1', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      {rcProUploading ? 'Envoi…' : 'Déposer'}
                    </button>
                  )}
                </div>
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

      {/* ── CANDIDATURES ── */}
      {tab === 'candidatures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
              <Calendar size={40} color="#D1D5DB" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>Aucune candidature</p>
              <p style={{ fontSize: '14px', color: '#888888', marginBottom: '20px' }}>Explorez les événements et postulez pour exposer votre travail.</p>
              <button onClick={() => router.push('/events')} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFF', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
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

      {/* ── AVIS ── */}
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

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', borderRadius: '10px', backgroundColor: '#1A1A1A', color: '#FFF', fontSize: '14px', fontWeight: '600', zIndex: 999, animation: 'fadeInUp 0.2s ease' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
