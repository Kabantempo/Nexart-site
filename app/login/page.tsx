'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'

export default function LoginPage() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Smoke Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <SmokeBackground smokeColor="#6366F1" />
      </div>

      {/* Content Overlay */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
        }}
      >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Back Link */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6366F1',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '32px',
            transition: 'color 300ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#5B5BD6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6366F1'
          }}
        >
          <ArrowLeft size={16} />
          Retour
        </Link>

        {/* Header */}
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>
          Connexion
        </h1>
        <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px' }}>
          Accédez à votre compte Nexart
        </p>

        {/* Form */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Email */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '8px',
              }}
            >
              <Mail size={16} color="#6366F1" />
              Email
            </label>
            <input
              type="email"
              placeholder="vous@exemple.fr"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                fontSize: '16px',
                color: '#1A1A1A',
                fontFamily: 'inherit',
                transition: 'all 300ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '8px',
              }}
            >
              <Lock size={16} color="#6366F1" />
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                fontSize: '16px',
                color: '#1A1A1A',
                fontFamily: 'inherit',
                transition: 'all 300ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 300ms ease',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5B5BD6'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Se connecter
          </button>
        </form>

        {/* Divider */}
        <div style={{ marginTop: '32px', borderTop: '1px solid #E5E7EB' }} />

        {/* Links */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
          <Link
            href="#"
            style={{
              fontSize: '14px',
              color: '#888888',
              textDecoration: 'none',
              transition: 'color 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#6366F1'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888888'
            }}
          >
            Mot de passe oublié ?
          </Link>
          <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              style={{
                color: '#6366F1',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 300ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#5B5BD6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6366F1'
              }}
            >
              S'inscrire
            </Link>
          </p>
        </div>
      </motion.div>
      </div>
    </div>
  )
}
