'use client'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Users, DollarSign, Scale, Mail } from 'lucide-react'

export default function ConditionsClient() {
  const sections = [
    {
      title: '1. Acceptation des Conditions',
      icon: CheckCircle2,
      content: 'En accédant à Nexart, vous acceptez ces conditions d\'utilisation. Si vous n\'êtes pas d\'accord avec l\'une de ces conditions, vous n\'avez pas accès à la plateforme.',
    },
    {
      title: '2. Définitions',
      icon: Users,
      items: [
        'Nexart : Plateforme SaaS de mise en relation entre créateurs et organisateurs',
        'Créateur : Artiste, artisan ou indépendant offrant des services événementiels',
        'Organisateur : Personne ou entreprise organisant événements, marchés, salons',
        'Contrat : Accord conclu entre Créateur et Organisateur via Nexart',
      ],
    },
    {
      title: '3. Rôles et Responsabilités',
      icon: Scale,
      subsections: [
        {
          title: '3.1 Rôle de Nexart',
          items: [
            'Nexart est une plateforme de mise en relation SEULEMENT',
            'Nexart n\'est PAS responsable des disputes entre créateurs et organisateurs',
            'Les contrats sont conclus directement entre Créateur et Organisateur',
            'Nexart facilite la communication mais n\'intervient pas dans les transactions',
          ],
        },
        {
          title: '3.2 Rôle des Créateurs',
          items: [
            'Liberté complète : vous pouvez candidater à des événements Nexart et en dehors',
            'Tarification : vous fixez vos tarifs (Nexart n\'impose rien)',
            'Aucune exclusivité : vous êtes libre de vendre vos services ailleurs',
            'Statut légal : vous êtes indépendants/auto-entrepreneurs (PAS salariés Nexart)',
            'Responsabilité : vous êtes responsable du respect de vos droits du travail',
          ],
        },
        {
          title: '3.3 Rôle des Organisateurs',
          items: [
            'Sélection des créateurs : vous choisissez les créateurs à votre discrétion',
            'Vérification : Nexart vérifie uniquement les emails (pas les credentials)',
            'Due diligence : c\'est votre responsabilité de vérifier les créateurs avant d\'engager',
            'Contrats : vous êtes responsable de l\'exécution des contrats',
          ],
        },
      ],
    },
    {
      title: '4. Tarification',
      icon: DollarSign,
      subsections: [
        {
          title: '4.1 Abonnements Créateurs',
          items: [
            'Gratuit : 0€/mois — Candidater aux événements',
            'Boost : 5,99€/mois — Visibilité régionale augmentée',
            'Pro : 14,99€/mois — Boutique limitée (8% de commission)',
            'Premium : 29,99€/mois — Boutique complète (6% de commission)',
            'Annulation possible à tout moment, pas d\'engagement obligatoire',
          ],
        },
        {
          title: '4.2 Abonnements Organisateurs',
          items: [
            'Pro : 29€/mois — Créer et gérer événements',
            'Studio : 79€/mois — Collaboration d\'équipe',
            'Annulation possible à tout moment',
          ],
        },
      ],
    },
    {
      title: '5. Contenu et Propriété Intellectuelle',
      icon: AlertCircle,
      subsections: [
        {
          title: '5.1 Votre Contenu',
          items: [
            'Vous garantissez avoir le droit de publier tous vos contenus (photos, bio, portfolio, liens)',
            'Vous êtes seul responsable du respect des droits d\'auteur et copyrights',
            'Violation de propriété intellectuelle = retrait sans préavis de votre compte',
          ],
        },
        {
          title: '5.2 Droit à l\'Image',
          items: [
            'Photos de profil : vous devez être la personne sur la photo OU avoir consentement écrit',
            'Publication de photos d\'autres sans consentement = violation conditions',
            'Nexart peut supprimer le compte en cas violation',
            'Violation = responsabilité civile utilisateur (Nexart pas responsable)',
          ],
        },
        {
          title: '5.3 Propriété Intellectuelle Nexart',
          items: [
            'Tous droits Nexart, logo, textes, designs © Nexart SAS',
            'Utilisation non-autorisée = violation propriété intellectuelle',
            'Procédure DMCA : kalvin@nexart.fr avec [DMCA Takedown] dans le sujet',
          ],
        },
      ],
    },
    {
      title: '6. Modération et Signalement',
      icon: Mail,
      subsections: [
        {
          title: '6.1 Report Button',
          items: [
            'Tous les contenus (posts, candidatures, profils) ont un bouton de signalement',
            'Signalez contenu illégal, spam, harcèlement, nudité ou inapproprié',
          ],
        },
        {
          title: '6.2 Processus Modération',
          items: [
            'Nexart revient dans 24-48h maximum',
            'Contenu illégal = retrait immédiat',
            'Contenu inapproprié = évaluation et décision',
            'Notification utilisateur : vous serez informé de la raison du retrait',
            'Droit de recours : vous pouvez contester dans 7 jours (email support)',
          ],
        },
      ],
    },
    {
      title: '7. Données Personnelles et Vie Privée',
      icon: AlertCircle,
      items: [
        'Voir la Politique de Confidentialité pour droits RGPD complets',
        'Droit d\'accès : vous pouvez demander l\'export de vos données',
        'Droit de suppression : vous pouvez demander suppression de votre compte',
        'Droit de rectification : vous pouvez modifier votre profil',
        'Droit d\'opposition : vous pouvez vous désabonner des emails marketing',
        'Tous droits exercés via kalvin@nexart.fr',
      ],
    },
    {
      title: '8. Restrictions d\'Age',
      icon: AlertCircle,
      items: [
        'Nexart est réservé aux adultes (18+ années)',
        'Inscription mineur = violation conditions',
        'Mineur découvert = suppression compte obligatoire',
        'Nexart ne peut pas avoir de mineurs sur la plateforme',
      ],
    },
    {
      title: '9. Limitation de Responsabilité',
      icon: Scale,
      subsections: [
        {
          title: '9.1 Nexart N\'Est PAS Responsable De',
          items: [
            'Disputes créateur-organisateur (à résoudre directement)',
            'Qualité du travail des créateurs',
            'Disputes de paiement',
            'Contenus tiers publiés par utilisateurs',
            'Cyberattaques externes (Nexart protège mais ne peut garantir 0 risque)',
          ],
        },
        {
          title: '9.2 Nexart Est Responsable De',
          items: [
            'Fonctionnement technique (uptime raisonnable)',
            'Sécurité données (chiffrage, protection)',
            'Respect obligations RGPD (voir politique confidentialité)',
            'Protection données fournisseurs (DPA signés)',
          ],
        },
      ],
    },
    {
      title: '10. Signalement Violation et DMCA',
      icon: Mail,
      items: [
        'Contenu illégal ou harmful : signaler via bouton report sur la plateforme',
        'Violation copyright : email kalvin@nexart.fr avec objet [DMCA Takedown]',
        'Description : URL contenu + description violation',
        'Délai retrait : contenu retiré sous 48h si demande valide',
        'Droit recours : utilisateur peut contester retrait dans 30 jours',
      ],
    },
    {
      title: '11. Modifications des Conditions',
      icon: AlertCircle,
      items: [
        'Nexart peut modifier ces conditions à tout moment',
        'Notification : 30 jours de préavis par email avant application',
        'Utilisation continue = acceptation nouvelles conditions',
        'Désaccord = droit arrêter utilisation plateforme',
      ],
    },
    {
      title: '12. Droit Applicable',
      icon: Scale,
      items: [
        'Droit français s\'applique',
        'Juridiction : tribunaux Marseille',
        'Langue : français',
      ],
    },
  ]

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero Section */}
      <div style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px 60px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
              Conditions d'Utilisation
            </h1>
            <p style={{ fontSize: '18px', color: '#888888', maxWidth: '600px', lineHeight: '1.6' }}>
              Consulter les règles et responsabilités de la plateforme Nexart. Lisez attentivement avant d'utiliser.
            </p>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '24px' }}>
              Dernière mise à jour : 11 juillet 2026 | Version 1.0
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {sections.map((section, idx) => {
          const IconComponent = section.icon
          return (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              style={{
                marginBottom: '60px',
                paddingBottom: '60px',
                borderBottom: idx < sections.length - 1 ? '1px solid #E5E7EB' : 'none',
              }}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
                <div style={{ marginTop: '4px' }}>
                  <IconComponent size={32} color="#FF6B6B" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>
                    {section.title}
                  </h2>
                </div>
              </div>

              {/* Content */}
              {section.content && (
                <p style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '24px' }}>
                  {section.content}
                </p>
              )}

              {/* Simple Items List */}
              {section.items && (
                <ul style={{ marginLeft: '0', marginBottom: '24px' }}>
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: '16px',
                        color: '#666666',
                        lineHeight: '1.8',
                        marginBottom: '12px',
                        listStyleType: 'disc',
                        marginLeft: '20px',
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {/* Subsections */}
              {section.subsections && (
                <div style={{ marginLeft: '0' }}>
                  {section.subsections.map((subsec, subIdx) => (
                    <div key={subIdx} style={{ marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A', marginBottom: '16px' }}>
                        {subsec.title}
                      </h3>
                      <ul style={{ marginLeft: '0' }}>
                        {subsec.items.map((item, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: '16px',
                              color: '#666666',
                              lineHeight: '1.8',
                              marginBottom: '12px',
                              listStyleType: 'disc',
                              marginLeft: '20px',
                            }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </motion.section>
          )
        })}

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{
            backgroundColor: '#F9FAFB',
            padding: '40px',
            borderRadius: '12px',
            marginTop: '60px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <Mail size={24} color="#FF6B6B" strokeWidth={1.5} />
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>
                Questions ou Signalement?
              </h3>
              <p style={{ fontSize: '16px', color: '#666666', lineHeight: '1.6', marginBottom: '16px' }}>
                Pour toute question sur ces conditions ou pour signaler une violation, contactez-nous.
              </p>
              <a
                href="mailto:kalvin@nexart.fr"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#FF6B6B',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E53E3E')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FF6B6B')}
              >
                Nous Contacter
              </a>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Footer Links */}
      <div style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', marginTop: '60px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Légal
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="/conditions" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Conditions d'Utilisation
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a href="/confidentialite" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Politique de Confidentialité
                  </a>
                </li>
                <li>
                  <a href="/mentions-legales" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Mentions Légales
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Support
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="/contact" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="mailto:kalvin@nexart.fr" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Email: kalvin@nexart.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
