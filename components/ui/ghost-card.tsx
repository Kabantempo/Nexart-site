'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GhostCardProps {
  icon: ReactNode
  title: string
  description: string
  cta?: string
  href?: string
  onAction?: () => void
}

export function GhostCard({ icon, title, description, cta, href, onAction }: GhostCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '64px 32px',
        borderRadius: '20px',
        border: '1px dashed #D1D5DB',
        backgroundColor: '#FAFAFA',
        textAlign: 'center',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          backgroundColor: '#EEF2FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>

      <div style={{ maxWidth: '320px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
          {description}
        </p>
      </div>

      {cta && href && (
        <Link
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'background-color 200ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
        >
          {cta}
        </Link>
      )}

      {cta && onAction && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 200ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
        >
          {cta}
        </button>
      )}
    </motion.div>
  )
}
