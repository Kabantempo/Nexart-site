'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Trash2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SettingsClient() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleExportData = async () => {
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const response = await fetch('/api/account/export-data', {
        method: 'GET',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })

      if (!response.ok) throw new Error('Erreur export données')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexart-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)

      setMessage('✅ Données téléchargées')
    } catch (err: any) {
      setError(err.message || 'Erreur téléchargement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Paramètres
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px' }}>
            Gestion compte, données et préférences
          </p>
        </motion.div>
      </div>

      {/* Messages */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px 24px' }}>
        {message && (
          <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #86EFAC', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#166534', fontSize: '14px' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991B1B', fontSize: '14px' }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        <div style={{ display: 'grid', gap: '60px' }}>
          {/* Section: Export Data */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Données Personnelles
            </h2>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Télécharger mes données
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Export profil, conversations, reviews (JSON)
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#4F46E5'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#6366F1'
                }}
              >
                <Download size={16} />
                {loading ? 'Export...' : 'Exporter'}
              </button>
            </div>
          </motion.section>

          {/* Section: Delete Account */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Suppression Compte
            </h2>

            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#991B1B', marginBottom: '12px' }}>
                    Supprimer définitivement
                  </h3>
                  <ul style={{ fontSize: '14px', color: '#7F1D1D', marginBottom: '12px', marginLeft: '20px' }}>
                    <li style={{ marginBottom: '6px' }}>Compte masqué immédiatement</li>
                    <li style={{ marginBottom: '6px' }}>24h pour annuler par email</li>
                    <li style={{ marginBottom: '6px' }}>Suppression après 30 jours</li>
                    <li>Contrats conservés 11 ans</li>
                  </ul>
                  <p style={{ fontSize: '12px', color: '#991B1B', fontStyle: 'italic' }}>
                    Cette action est irréversible après 30 jours.
                  </p>
                </div>
                <DeleteAccountButton />
              </div>
            </div>
          </motion.section>

          {/* Section: RGPD */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px', marginBottom: '40px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              RGPD & Conformité
            </h2>

            <div style={{ display: 'grid', gap: '12px' }}>
              <a
                href="/confidentialite"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Politique de confidentialité
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Lire nos engagements RGPD</p>
                </div>
                <ChevronRight size={20} color="#888888" />
              </a>

              <a
                href="mailto:contact@nexart.fr?subject=RGPD%20Demande"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Demande RGPD
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Accès, rectification, portabilité (contact@nexart.fr)
                  </p>
                </div>
                <ChevronRight size={20} color="#888888" />
              </a>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

function DeleteAccountButton() {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'confirm' | 'email'>('confirm')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (!email) {
      setError('Email requis')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const meResponse = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const { id: userId } = await meResponse.json()

      const response = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, email }),
      })

      if (!response.ok) throw new Error('Erreur suppression')

      setShowModal(false)
      setStep('confirm')
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#B91C1C'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#DC2626'
        }}
      >
        <Trash2 size={16} />
        Supprimer
      </button>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => !loading && setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            }}
          >
            {step === 'confirm' ? (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#DC2626', marginBottom: '16px' }}>
                  ⚠️ Confirmer suppression
                </h2>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                  Vous avez 24h pour annuler via email après confirmation.
                </p>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <button
                    onClick={() => setStep('email')}
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#B91C1C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#DC2626'
                    }}
                  >
                    Oui, supprimer
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#D1D5DB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  Confirmer suppression
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Entrez votre email pour confirmer :
                </p>

                {error && (
                  <div style={{ backgroundColor: '#FEF2F2', color: '#991B1B', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    ❌ {error}
                  </div>
                )}

                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    color: 'var(--text-primary)',
                  }}
                />

                <div style={{ display: 'grid', gap: '12px' }}>
                  <button
                    onClick={handleDelete}
                    disabled={loading || !email}
                    style={{
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: loading || !email ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      opacity: loading || !email ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && email) e.currentTarget.style.backgroundColor = '#B91C1C'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && email) e.currentTarget.style.backgroundColor = '#DC2626'
                    }}
                  >
                    {loading ? 'Suppression...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setStep('confirm')
                      setEmail('')
                    }}
                    style={{
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#D1D5DB'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)'
                    }}
                  >
                    Retour
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  )
}
