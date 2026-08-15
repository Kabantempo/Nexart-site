'use client'

export default function LegalPageClient() {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '64px 16px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '32px' }}>
          Mentions Légales
        </h1>

        <div style={{ fontSize: '16px', color: '#555555', lineHeight: '1.8' }}>
          {/* Editeur */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              1. Éditeur du site
            </h2>
            <p>
              <strong>Nom :</strong> Nexart<br />
              <strong>Forme juridique :</strong> SARL<br />
              <strong>Adresse :</strong> France<br />
              <strong>Email :</strong> contact@nexart.fr<br />
              <strong>Téléphone :</strong> À compléter
            </p>
          </section>

          {/* Directeur de publication */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              2. Directeur de publication
            </h2>
            <p>
              Le présent site est édité par Nexart. Le directeur de publication est responsable du contenu du site.
            </p>
          </section>

          {/* Hébergeur */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              3. Hébergeur
            </h2>
            <p>
              <strong>Nom :</strong> Vercel Inc.<br />
              <strong>Adresse :</strong> San Francisco, États-Unis<br />
              <strong>Site :</strong> https://vercel.com
            </p>
          </section>

          {/* Conditions d'utilisation */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              4. Conditions d'utilisation
            </h2>
            <p>
              L'accès et l'utilisation du site Nexart sont réservés aux personnes majeures. L'utilisateur s'engage à respecter les lois et réglementations en vigueur.
            </p>
            <p style={{ marginTop: '12px' }}>
              Nexart se réserve le droit de modifier ou d'interrompre l'accès au site à tout moment sans préavis.
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              5. Propriété intellectuelle
            </h2>
            <p>
              Tous les contenus du site (textes, images, logos, etc.) sont la propriété de Nexart ou de ses partenaires et sont protégés par les droits d'auteur. Toute reproduction est interdite sans autorisation.
            </p>
          </section>

          {/* Responsabilité */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              6. Responsabilité
            </h2>
            <p>
              Nexart ne peut être tenue responsable des dommages directs ou indirects résultant de l'accès ou de l'utilisation du site.
            </p>
            <p style={{ marginTop: '12px' }}>
              Les utilisateurs sont responsables de leurs actions sur la plateforme, notamment des contenus qu'ils publient.
            </p>
          </section>

          {/* Protection des données */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              7. Protection des données personnelles
            </h2>
            <p>
              Les données personnelles sont traitées conformément au Règlement Général sur la Protection des Données (RGPD).
              Les utilisateurs disposent d'un droit d'accès, de rectification et de suppression de leurs données.
            </p>
            <p style={{ marginTop: '12px' }}>
              Pour exercer ces droits, contactez : contact@nexart.fr
            </p>
          </section>

          {/* Cookies */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              8. Cookies
            </h2>
            <p>
              Le site utilise Google Tag Manager pour le suivi et l'analyse de l'activité des utilisateurs.
              En utilisant le site, vous acceptez l'utilisation de cookies conformément à notre politique.
            </p>
          </section>

          {/* Liens externes */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              9. Liens externes
            </h2>
            <p>
              Nexart n'est pas responsable des contenus des sites externes liés depuis ce site.
            </p>
          </section>

          {/* Contact */}
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              10. Signalement de contenu illégal
            </h2>
            <p>
              Tout contenu illégal ou abusif peut être signalé à : contact@nexart.fr
            </p>
          </section>

          {/* Modification */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              11. Modifications
            </h2>
            <p>
              Nexart se réserve le droit de modifier ces mentions légales à tout moment. La date de dernière modification est visible en bas de cette page.
            </p>
          </section>

          {/* Footer */}
          <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', color: '#AAAAAA', fontSize: '14px' }}>
            <p>
              Dernière mise à jour : 6 juin 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
