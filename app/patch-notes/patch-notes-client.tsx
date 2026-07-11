'use client'

import { motion } from 'framer-motion'
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
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/patch-notes.json')
      .then((res) => res.json())
      .then((data) => {
        setNotes(data.versions)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <header style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '16px' }}>
            Mises à jour et nouveautés
          </h1>
          <p style={{ fontSize: '18px', color: '#555555', lineHeight: '1.6', maxWidth: '600px', margin: 0 }}>
            Découvrez toutes les améliorations et nouvelles fonctionnalités de Nexart. Nous mettons régulièrement à jour la plateforme pour vous offrir une meilleure expérience.
          </p>
        </motion.div>
      </header>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 16px' }} role="status" aria-live="polite">
          <p style={{ fontSize: '16px', color: '#6B7280' }}>Chargement des mises à jour...</p>
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '60px 16px' }} role="alert">
          <p style={{ fontSize: '16px', color: '#666666' }}>Impossible de charger les mises à jour. Veuillez réessayer plus tard.</p>
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 16px' }}>
          <p style={{ fontSize: '16px', color: '#6B7280' }}>Aucune mise à jour pour le moment.</p>
        </div>
      )}

      {!loading && !error && notes.length > 0 && (
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px 80px' }}>
          {notes.map((note, idx) => (
            <motion.article
              key={note.version}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
              style={{
                borderLeft: '4px solid #FF6B6B',
                paddingLeft: '24px',
                marginBottom: '48px',
                paddingTop: '24px',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', margin: 0, marginBottom: '8px' }}>
                  {note.name}
                </h2>
                <time dateTime={note.date} style={{ fontSize: '14px', color: '#666666', display: 'block' }}>
                  {new Date(note.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </div>

              {note.features.length > 0 && (
                <section style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                    Nouvelles fonctionnalités
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
                    {note.features.map((feature, i) => (
                      <li key={i} style={{ color: '#555555', marginBottom: '8px', fontSize: '15px', lineHeight: '1.6' }}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {note.improvements.length > 0 && (
                <section style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                    Améliorations
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
                    {note.improvements.map((imp, i) => (
                      <li key={i} style={{ color: '#555555', marginBottom: '8px', fontSize: '15px', lineHeight: '1.6' }}>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {note.fixes.length > 0 && (
                <section>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '12px', margin: 0 }}>
                    Correctifs
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'disc' }}>
                    {note.fixes.map((fix, i) => (
                      <li key={i} style={{ color: '#555555', marginBottom: '8px', fontSize: '15px', lineHeight: '1.6' }}>
                        {fix}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </motion.article>
          ))}
        </main>
      )}
    </div>
  )
}
