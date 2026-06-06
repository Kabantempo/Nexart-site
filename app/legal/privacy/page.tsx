export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '64px 16px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#1A1A1A', marginBottom: '32px' }}>
          Politique de Confidentialité
        </h1>

        <div style={{ fontSize: '16px', color: '#555555', lineHeight: '1.8' }}>
          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              1. Responsable du traitement
            </h2>
            <p>
              Nexart est le responsable du traitement des données personnelles collectées via ce site.
              Pour toute question : contact@nexart.fr
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              2. Données collectées
            </h2>
            <p>Nous collectons les données suivantes :</p>
            <ul style={{ marginTop: '12px', marginLeft: '20px' }}>
              <li><strong>Données d'inscription :</strong> email, nom, mot de passe (hashé)</li>
              <li><strong>Profil :</strong> bio, avatar, localisation, disciplines</li>
              <li><strong>Portfolio :</strong> images, liens externes</li>
              <li><strong>Messages :</strong> contenu des conversations</li>
              <li><strong>Analytics :</strong> visites via Google Tag Manager</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              3. Base légale
            </h2>
            <p>
              Le traitement de vos données est justifié par : (1) votre consentement explicite,
              (2) l'exécution de notre contrat avec vous, (3) nos obligations légales.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              4. Partage des données
            </h2>
            <p>
              Vos données ne sont pas vendues. Elles peuvent être partagées avec :
            </p>
            <ul style={{ marginTop: '12px', marginLeft: '20px' }}>
              <li><strong>Supabase :</strong> hébergement et authentification</li>
              <li><strong>Vercel :</strong> hébergement du site web</li>
              <li><strong>Google Tag Manager :</strong> analytics</li>
            </ul>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              5. Droits RGPD
            </h2>
            <p>Vous avez le droit de :</p>
            <ul style={{ marginTop: '12px', marginLeft: '20px' }}>
              <li>Accéder à vos données</li>
              <li>Les corriger</li>
              <li>Les supprimer (droit à l'oubli)</li>
              <li>Retirer votre consentement</li>
              <li>Demander la portabilité</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              Contactez : contact@nexart.fr
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              6. Durée de conservation
            </h2>
            <p>
              Les données sont conservées aussi longtemps que nécessaire pour fournir les services.
              Après suppression du compte, les données sont supprimées dans les 30 jours.
            </p>
          </section>

          <section style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              7. Sécurité
            </h2>
            <p>
              Vos données sont protégées par chiffrement (HTTPS, bcrypt pour les mots de passe).
              Cependant, aucune transmission n'est 100% sécurisée.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
              8. Contact
            </h2>
            <p>
              Pour toute réclamation concernant la protection de vos données :
              contact@nexart.fr ou CNIL en France.
            </p>
          </section>

          <div style={{ marginTop: '64px', paddingTop: '24px', borderTop: '1px solid #E5E7EB', color: '#AAAAAA', fontSize: '14px' }}>
            <p>Dernière mise à jour : 6 juin 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
