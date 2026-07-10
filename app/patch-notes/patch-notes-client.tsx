'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PatchNote {
  version: string
  date: string
  name: string
  features: string[]
  improvements: string[]
  fixes: string[]
}

export default function PatchNotesClient() {
  const [notes, setNotes] = useState<PatchNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/patch-notes.json')
      .then((res) => res.json())
      .then((data) => {
        setNotes(data.versions)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Sparkles size={32} style={{ color: '#FF6B6B' }} />
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
              Patch Notes
            </h1>
          </div>
          <p style={{ fontSize: '18px', color: '#888888', lineHeight: '1.6' }}>
            Toutes les mises à jour, nouvelles fonctionnalités et corrections de Nexart
          </p>
        </motion.div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 16px' }}>
          <p>Chargement...</p>
        </div>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 16px 80px' }}>
          {notes.map((note, idx) => (
            <motion.div
              key={note.version}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              style={{
                borderLeft: '3px solid #FF6B6B',
                paddingLeft: '24px',
                marginBottom: '48px',
                paddingTop: '24px',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
                  {note.name}
                </h2>
                <p style={{ fontSize: '14px', color: '#888888', margin: '8px 0 0 0' }}>
                  {new Date(note.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {note.features.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FF6B6B', marginBottom: '12px', textTransform: 'uppercase' }}>
                    ✨ Nouveautés
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {note.features.map((feature, i) => (
                      <li key={i} style={{ color: '#555555', marginBottom: '8px', fontSize: '15px', lineHeight: '1.6' }}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {note.improvements.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FF6B6B', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🛠️ Améliorations
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {note.improvements.map((imp, i) => (
                      <li key={i} style={{ color: '#555555', marginBottom: '8px', fontSize: '15px', lineHeight: '1.6' }}>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {note.fixes.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FF6B6B', marginBottom: '12px', textTransform: 'uppercase' }}>
                    🐛 Correctifs
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {note.fixes.map((fix, i) => (
                      <li key={i} style={{ color: '#555555', marginBottom: '8px', fontSize: '15px', lineHeight: '1.6' }}>
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
