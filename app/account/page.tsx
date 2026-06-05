'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { ArrowLeft, User, MapPin, FileText, Save } from 'lucide-react'

const DISCIPLINES = [
  'Tatouage', 'Céramique', 'Gravure', 'Joaillerie', 'Bijoux', 'Illustration',
  'Textile', 'Maroquinerie', 'Sculpture', 'Photographie', 'Peinture', 'Poterie',
  'Broderie', 'Lutherie', 'Verrerie', 'Reliure', 'Cosmétique naturelle',
  'Savonnerie', 'Coutellerie', 'Bougies', 'Macramé', 'Origami', 'Calligraphie', 'Sérigraphie',
]

const RADIUS_OPTIONS = [
  { value: '5', label: '5 km' },
  { value: '10', label: '10 km' },
  { value: '25', label: '25 km' },
  { value: 'national', label: 'National' },
]

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#FFFFFF',
  fontSize: '15px',
  color: '#1A1A1A',
  fontFamily: 'inherit',
  transition: 'all 300ms ease',
  boxSizing: 'border-box' as const,
}

export default function AccountPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [department, setDepartment] = useState('')
  const [travelRadius, setTravelRadius] = useState('')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [etsy, setEtsy] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (profile) {
        setFullName(profile.full_name || '')
        setBio(profile.bio || '')

        if (!user) {
          setUser({ id: profile.id, email: session.user.email || '', role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url })
        }

        if (profile.role === 'creator') {
          const { data: cp } = await supabase.from('creator_profiles').select('*').eq('user_id', session.user.id).single()
          if (cp) {
            setCity(cp.city || '')
            setRegion(cp.region || '')
            setDepartment(cp.department || '')
            setTravelRadius(cp.travel_radius || '')
            setDisciplines(cp.disciplines || [])
            setWebsite(cp.website || '')
            setInstagram(cp.instagram || '')
            setEtsy(cp.etsy || '')
          }
        }
      }
      setLoading(false)
    })
  }, [router, user, setUser])

  const toggleDiscipline = (d: string) => {
    setDisciplines((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ full_name: fullName, bio })
      .eq('id', session.user.id)

    if (profileErr) { setError(profileErr.message); setSaving(false); return }

    if (user?.role === 'creator') {
      const { data: existing } = await supabase.from('creator_profiles').select('id').eq('user_id', session.user.id).single()

      const creatorData = { user_id: session.user.id, city, region, department, travel_radius: travelRadius, disciplines, website, instagram, etsy }

      if (existing) {
        await supabase.from('creator_profiles').update(creatorData).eq('user_id', session.user.id)
      } else {
        await supabase.from('creator_profiles').insert(creatorData)
      }
    }

    setUser({ ...user!, full_name: fullName })
    setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 16px' }}>
        <Link
          href="/dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
        >
          <ArrowLeft size={16} />
          Tableau de bord
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Mon compte</h1>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '40px' }}>Modifiez vos informations de profil</p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#E05A5A', fontSize: '14px', marginBottom: '24px' }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7', color: '#4CAF50', fontSize: '14px', marginBottom: '24px' }}>
              Profil mis à jour avec succès ✓
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* General info */}
            <div style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} color="#6366F1" />
                Informations générales
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Nom complet</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="#6366F1" />
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Parlez de vous, de votre activité..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Creator-specific */}
            {user?.role === 'creator' && (
              <>
                <div style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={18} color="#6366F1" />
                    Localisation & Rayon
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Ville</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Région</label>
                      <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Île-de-France" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Département</label>
                      <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="75" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Rayon de déplacement</label>
                      <select value={travelRadius} onChange={(e) => setTravelRadius(e.target.value)} style={inputStyle}>
                        <option value="">Sélectionner...</option>
                        {RADIUS_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Disciplines</h2>
                  <p style={{ fontSize: '14px', color: '#888888', marginBottom: '16px' }}>Sélectionnez vos disciplines (plusieurs possibles)</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {DISCIPLINES.map((d) => {
                      const selected = disciplines.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDiscipline(d)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            border: `1px solid ${selected ? '#6366F1' : '#E5E7EB'}`,
                            backgroundColor: selected ? '#6366F1' : '#FFFFFF',
                            color: selected ? '#FFFFFF' : '#888888',
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                            fontFamily: 'inherit',
                          }}
                        >
                          {d}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>Liens</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Site web</label>
                      <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Instagram</label>
                      <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@votre_compte" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', display: 'block' }}>Etsy</label>
                      <input type="text" value={etsy} onChange={(e) => setEtsy(e.target.value)} placeholder="votre-boutique" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 32px', borderRadius: '8px', backgroundColor: saving ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 300ms ease' }}
              onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = '#5B5BD6'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)' } }}
              onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.backgroundColor = '#6366F1'; e.currentTarget.style.boxShadow = 'none' } }}
            >
              <Save size={18} />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
