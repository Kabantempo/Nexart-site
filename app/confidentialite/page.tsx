import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Nexart',
  description: 'Politique de confidentialité et protection des données personnelles RGPD/CNIL conforme.',
  alternates: { canonical: 'https://nexart.fr/confidentialite' },
  openGraph: {
    title: 'Politique de Confidentialité — Nexart',
    description: 'Politique de confidentialité conforme RGPD.',
    url: 'https://nexart.fr/confidentialite',
    type: 'website',
  },
}

export default function ConfidentialitePage() {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)', paddingTop: '60px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px 40px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Politique de Confidentialité
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '40px' }}>
          Protection des données personnelles — RGPD/CNIL conforme
        </p>

        <div style={{ lineHeight: '1.8', color: 'var(--text-primary)', fontSize: '16px' }}>
          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Nexart SAS</h2>
            <p>Marseille, France</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Mise à jour : 27 juillet 2026</p>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>1. Informations importantes</h2>
            <p>Cette politique de confidentialité s'applique à tous les utilisateurs de Nexart.fr.</p>
            <p style={{ marginTop: '16px' }}>
              <strong>Responsable des données :</strong>
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Nexart SAS</li>
              <li>Siège : Marseille, France</li>
              <li>Email contact RGPD : contact@nexart.fr</li>
            </ul>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>2. Données collectées</h2>
            <p style={{ marginBottom: '24px' }}>
              <strong>Compte créateur :</strong> Email, Nom/Prénom, Localisation, Photo de profil, Bio, Disciplines, Données bancaires (IBAN)
            </p>
            <p style={{ marginBottom: '24px' }}>
              <strong>Compte organisateur :</strong> Email, Entreprise/Nom, Localisation, SIRET
            </p>
            <p>
              <strong>Automatiquement :</strong> Adresse IP, Device/Browser/OS, Temps accès, Pages visitées, Cookies
            </p>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>3. Vos droits RGPD</h2>
            <ul style={{ marginLeft: '20px', marginTop: '16px' }}>
              <li style={{ marginBottom: '12px' }}>
                <strong>Droit d'accès :</strong> Demander vos données via contact@nexart.fr (30 jours)
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Droit de rectification :</strong> Modifier vos infos dans votre profil
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Droit à l'oubli :</strong> Supprimer compte → soft-delete 30j → hard-delete après
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Droit à la portabilité :</strong> Export JSON/CSV via contact@nexart.fr
              </li>
              <li style={{ marginBottom: '12px' }}>
                <strong>Droit d'opposition :</strong> Refuser emails marketing via unsubscribe
              </li>
            </ul>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>4. Durée conservation</h2>
            <ul style={{ marginLeft: '20px', marginTop: '16px' }}>
              <li style={{ marginBottom: '12px' }}>Email + Profil : tant que compte actif + 30j après suppression</li>
              <li style={{ marginBottom: '12px' }}>IBAN : 6 ans après dernier paiement</li>
              <li style={{ marginBottom: '12px' }}>Contrats : 11 ans (6 ans impôts + 5 ans prescription)</li>
              <li style={{ marginBottom: '12px' }}>Logs IP : 30 jours</li>
              <li style={{ marginBottom: '12px' }}>Cookies : 13 mois (Google Analytics)</li>
            </ul>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>5. Cookies</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>Bandeau consentement :</strong> Vous verrez un bandeau au premier accès.
            </p>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li style={{ marginBottom: '12px' }}>Par défaut : "Refuser" (recommandé)</li>
              <li style={{ marginBottom: '12px' }}>"Accepter Tous" : active Google Tag Manager (GTM-PC469WF9)</li>
              <li style={{ marginBottom: '12px' }}>Consentement stocké 365 jours</li>
            </ul>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>6. Sécurité</h2>
            <ul style={{ marginLeft: '20px', marginTop: '16px' }}>
              <li style={{ marginBottom: '12px' }}>✅ HTTPS chiffrage (tous communications)</li>
              <li style={{ marginBottom: '12px' }}>✅ Supabase EU (eu-central-1 — conforme RGPD)</li>
              <li style={{ marginBottom: '12px' }}>✅ Accès limité (Kalvin + associé)</li>
              <li style={{ marginBottom: '12px' }}>✅ IBAN chiffré</li>
              <li style={{ marginBottom: '12px' }}>✅ Backups quotidiens chiffrés</li>
            </ul>
          </section>

          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>7. Contact</h2>
            <p style={{ marginBottom: '16px' }}>
              <strong>Question RGPD ?</strong>
            </p>
            <p style={{ marginBottom: '24px', color: '#6366F1' }}>
              Email : <a href="mailto:contact@nexart.fr" style={{ color: '#6366F1', textDecoration: 'underline' }}>contact@nexart.fr</a>
            </p>
            <p style={{ marginBottom: '16px' }}>
              <strong>Pas satisfait ?</strong>
            </p>
            <p>
              <a
                href="https://www.cnil.fr/fr/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#6366F1', textDecoration: 'underline' }}
              >
                CNIL : https://www.cnil.fr/fr/
              </a>
            </p>
          </section>

          <section style={{ paddingTop: '40px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <p>Cette politique est conforme Règlement EU 2016/679 (RGPD) et Loi française.</p>
            <p style={{ marginTop: '8px' }}>Dernière mise à jour : 27 juillet 2026</p>
          </section>
        </div>
      </div>
    </div>
  )
}
