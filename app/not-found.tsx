import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '40px 16px', maxWidth: '600px' }}>
        <div style={{ fontSize: '120px', fontWeight: '700', color: '#6366F1', marginBottom: '24px' }}>
          404
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
          Page non trouvée
        </h1>
        <p style={{ fontSize: '18px', color: '#888888', marginBottom: '48px', lineHeight: '1.6' }}>
          Désolé, la page que vous recherchez n'existe pas ou a été supprimée.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              borderRadius: '8px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 300ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5B5BD6'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ← Retour à l'accueil
          </Link>
          <Link
            href="/events"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              borderRadius: '8px',
              border: '2px solid #6366F1',
              backgroundColor: 'transparent',
              color: '#6366F1',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 300ms ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F0F4FF'
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Découvrir les événements →
          </Link>
        </div>

        <div style={{ padding: '32px', borderRadius: '12px', backgroundColor: '#F9F9FB', border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A', marginBottom: '12px' }}>
            Besoin d'aide ?
          </h3>
          <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
            Consultez notre <Link href="/contact" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>page de contact</Link> ou
            {' '}<Link href="/legal" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>mentions légales</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
