'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react'

export default function ContactPageClient() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Tous les champs sont obligatoires')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 16px' }}>
        {/* Back Button */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6366F1',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '32px',
          }}
        >
          <ArrowLeft size={16} />
          Retour à l'accueil
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '48px' }}>
          {/* Main Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              Nous contacter
            </h1>
            <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '40px', lineHeight: '1.6' }}>
              Vous avez une question, une suggestion ou besoin d'aide ? Remplissez le formulaire ci-dessous et nous vous répondrons dès que possible.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366F1'; e.target.style.outline = 'none' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB' }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366F1'; e.target.style.outline = 'none' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB' }}
                />
              </div>

              {/* Subject */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                  Sujet
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Comment puis-je vous aider ?"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#6366F1'; e.target.style.outline = 'none' }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB' }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Votre message..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.outline = 'none' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB' }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FFE5E5', color: '#E05A5A', fontSize: '14px', marginBottom: '24px' }}>
                  {error}
                </div>
              )}

              {/* Success */}
              {submitted && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#E8F5E9', color: '#4CAF50', fontSize: '14px', marginBottom: '24px' }}>
                  ✓ Message envoyé avec succès. Merci de nous avoir contactés !
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '8px',
                  backgroundColor: loading ? '#C4C7F0' : '#6366F1',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 300ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#5B5BD6'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#6366F1'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <Send size={18} />
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
          </motion.div>

          {/* Sidebar Info */}
          <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '24px' }}>
                Autres moyens de nous contacter
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Mail size={18} color="#6366F1" />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>Email</span>
                  </div>
                  <a
                    href="mailto:contact@nexart.fr"
                    style={{ fontSize: '14px', color: '#6366F1', textDecoration: 'none' }}
                  >
                    contact@nexart.fr
                  </a>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <MessageSquare size={18} color="#6366F1" />
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>Messagerie</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                    Connectez-vous et utilisez la messagerie directe
                  </p>
                  <Link
                    href="/login"
                    style={{ fontSize: '14px', color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}
                  >
                    Accéder à la messagerie →
                  </Link>
                </div>
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '12px', color: '#AAAAAA', lineHeight: '1.5' }}>
                  Nous vous répondrons dans un délai de 24 à 48 heures.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
