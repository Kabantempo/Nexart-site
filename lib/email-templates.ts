// Centralized Nexart email templates
// All routes import from here — never write inline HTML in routes

const COLORS = {
  bg: '#F4F4F8',
  card: '#FFFFFF',
  headerBg: 'linear-gradient(135deg,#0F0C29 0%,#1E1B4B 50%,#2D1B69 100%)',
  indigo: '#6366F1',
  indigoLight: '#A5B4FC',
  indigoDark: '#4F46E5',
  green: '#10B981',
  red: '#EF4444',
  orange: '#F59E0B',
  textPrimary: '#1A1A2E',
  textBody: '#374151',
  textMuted: '#64748B',
  textFaded: '#94A3B8',
  border: '#F1F5F9',
}

function logo() {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
          <span style="color:#fff;font-size:20px;font-weight:800;line-height:40px;">N</span>
        </td>
        <td style="padding-left:10px;vertical-align:middle;">
          <span style="color:${COLORS.textPrimary};font-size:22px;font-weight:800;">Nexart</span>
        </td>
      </tr>
    </table>`
}

function footer() {
  return `
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid ${COLORS.border};"/></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:20px 48px 32px;">
          <p style="margin:0;color:${COLORS.textFaded};font-size:12px;">
            © 2026 Nexart ·
            <a href="https://nexart.fr" style="color:${COLORS.indigo};text-decoration:none;">nexart.fr</a> ·
            <a href="https://nexart.fr/contact" style="color:${COLORS.indigo};text-decoration:none;">Contact</a> ·
            <a href="https://nexart.fr/conditions" style="color:${COLORS.indigo};text-decoration:none;">CGU</a>
          </p>
        </td>
      </tr>
    </table>`
}

function button(label: string, url: string, color = COLORS.indigo) {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td align="center" style="background:linear-gradient(135deg,${color},${COLORS.indigoDark});border-radius:12px;">
          <a href="${url}" style="display:inline-block;padding:14px 36px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

function badge(text: string) {
  return `<p style="margin:0 0 12px;display:inline-block;background:rgba(99,102,241,0.25);border:1px solid rgba(99,102,241,0.4);border-radius:999px;padding:5px 16px;color:${COLORS.indigoLight};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">${text}</p>`
}

function base(headerContent: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Nexart</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Logo -->
      <tr>
        <td align="center" style="padding-bottom:24px;">
          ${logo()}
        </td>
      </tr>

      <!-- Card -->
      <tr>
        <td style="background:${COLORS.card};border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.10);">
          <table width="100%" cellpadding="0" cellspacing="0">

            <!-- Header -->
            <tr>
              <td style="background:${COLORS.headerBg};padding:44px 48px 40px;text-align:center;">
                ${headerContent}
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 48px;">
                ${bodyContent}
              </td>
            </tr>

            <!-- Footer -->
            <tr><td>${footer()}</td></tr>

          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function emailWelcome(name: string, role: string): string {
  const isCreator = role === 'creator'
  const isOrganizer = role === 'organizer'
  const roleLabel = isCreator ? 'créateur' : isOrganizer ? 'organisateur' : 'visiteur'
  const description = isCreator
    ? 'Complétez votre profil, ajoutez vos disciplines et votre portfolio, puis postulez aux marchés qui vous correspondent.'
    : isOrganizer
    ? 'Créez votre premier événement, publiez-le et recevez des candidatures de créateurs vérifiés de toute la France.'
    : 'Explorez les événements, découvrez des créateurs et suivez vos marchés préférés.'

  return base(
    `
    ${badge('Bienvenue !')}
    <h1 style="margin:0 0 8px;color:#fff;font-size:26px;font-weight:800;line-height:1.3;">
      Bonjour ${name || ''} 👋
    </h1>
    <p style="margin:0;color:${COLORS.indigoLight};font-size:14px;">Votre compte ${roleLabel} est prêt.</p>`,
    `
    <p style="margin:0 0 24px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">${description}</p>
    ${button('Accéder à mon espace →', 'https://nexart.fr/dashboard')}`
  )
}

export function emailApplicationReceived(creatorName: string, eventTitle: string, eventId: string): string {
  return base(
    `
    ${badge('Nouvelle candidature')}
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;line-height:1.3;">
      ${creatorName || 'Un créateur'} souhaite rejoindre votre événement
    </h1>`,
    `
    <p style="margin:0 0 8px;color:${COLORS.textMuted};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Événement</p>
    <p style="margin:0 0 24px;color:${COLORS.textBody};font-size:16px;font-weight:700;">${eventTitle}</p>
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Consultez le profil et le portfolio de <strong>${creatorName}</strong> depuis votre tableau de bord et répondez à sa candidature.
    </p>
    ${button('Voir la candidature →', `https://nexart.fr/events/${eventId}`)}`
  )
}

export function emailApplicationStatus(creatorName: string, eventTitle: string, accepted: boolean): string {
  const color = accepted ? COLORS.green : COLORS.red
  const statusLabel = accepted ? 'Candidature acceptée ✅' : 'Candidature non retenue'
  const body = accepted
    ? `L'organisateur a <strong style="color:${COLORS.green};">accepté</strong> votre candidature pour <strong>${eventTitle}</strong>. Connectez-vous pour voir les détails et échanger avec l'organisateur.`
    : `Votre candidature pour <strong>${eventTitle}</strong> n'a pas été retenue cette fois-ci. Ne vous découragez pas — d'autres événements vous attendent sur Nexart !`

  return base(
    `
    <p style="margin:0 0 12px;display:inline-block;background:${accepted ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'};border:1px solid ${color};border-radius:999px;padding:5px 16px;color:${color};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
      ${accepted ? 'Bonne nouvelle !' : 'Mise à jour'}
    </p>
    <h1 style="margin:0 0 12px;color:#fff;font-size:26px;font-weight:800;line-height:1.25;">${statusLabel}</h1>
    <p style="margin:0;color:rgba(255,255,255,0.55);font-size:15px;">${eventTitle}</p>`,
    `
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Bonjour ${creatorName || ''},<br/><br/>${body}
    </p>
    ${accepted
      ? button('Voir mon tableau de bord →', 'https://nexart.fr/dashboard')
      : button('Explorer les événements →', 'https://nexart.fr/events')
    }`
  )
}

export function emailMessageNotify(senderName: string, preview: string, conversationId: string): string {
  const truncated = preview?.length > 120 ? preview.slice(0, 117) + '…' : preview || ''

  return base(
    `
    ${badge('Nouveau message')}
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">💬 ${senderName} vous a écrit</h1>
    <p style="margin:0;color:${COLORS.indigoLight};font-size:14px;">Répondez depuis votre messagerie Nexart</p>`,
    `
    ${truncated ? `<div style="background:#F8FAFC;border-left:3px solid ${COLORS.indigo};border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 28px;">
      <p style="margin:0;color:${COLORS.textBody};font-size:15px;line-height:1.6;font-style:italic;">"${truncated}"</p>
    </div>` : ''}
    ${button('Répondre →', `https://nexart.fr/messages/${conversationId}`)}`
  )
}

export function emailContactConfirmation(name: string, subject: string): string {
  return base(
    `
    ${badge('Message reçu')}
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">Merci ${name} !</h1>
    <p style="margin:0;color:${COLORS.indigoLight};font-size:14px;">Votre message a bien été transmis à notre équipe.</p>`,
    `
    <p style="margin:0 0 16px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Nous avons bien reçu votre message concernant <strong>"${subject}"</strong>.
      Notre équipe vous répondra dans les meilleurs délais (généralement sous 24–48h).
    </p>
    <p style="margin:0 0 28px;color:${COLORS.textMuted};font-size:14px;">
      En attendant, n'hésitez pas à explorer les événements disponibles sur Nexart.
    </p>
    ${button('Explorer Nexart →', 'https://nexart.fr/tendances')}`
  )
}

export function emailContactInternal(name: string, email: string, subject: string, message: string): string {
  return base(
    `
    ${badge('Contact')}
    <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">Nouveau message de contact</h1>`,
    `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid ${COLORS.border};">
        <span style="color:${COLORS.textMuted};font-size:13px;font-weight:600;">De :</span>
        <span style="color:${COLORS.textBody};font-size:14px;margin-left:8px;">${name} &lt;${email}&gt;</span>
      </td></tr>
      <tr><td style="padding:8px 0;">
        <span style="color:${COLORS.textMuted};font-size:13px;font-weight:600;">Sujet :</span>
        <span style="color:${COLORS.textBody};font-size:14px;margin-left:8px;">${subject}</span>
      </td></tr>
    </table>
    <div style="background:#F8FAFC;border-radius:8px;padding:16px 20px;">
      <p style="margin:0;color:${COLORS.textBody};font-size:14px;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</p>
    </div>`
  )
}

export function emailVerificationApproved(label: string): string {
  return base(
    `
    <p style="margin:0 0 12px;display:inline-block;background:rgba(16,185,129,0.2);border:1px solid ${COLORS.green};border-radius:999px;padding:5px 16px;color:${COLORS.green};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Vérifié ✅</p>
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Votre ${label} est validé</h1>`,
    `
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Félicitations ! Votre vérification <strong>${label}</strong> a été approuvée.
      Votre profil affiche désormais le badge de vérification, renforçant votre crédibilité auprès des organisateurs.
    </p>
    ${button('Voir mon profil →', 'https://nexart.fr/dashboard')}`
  )
}

export function emailVerificationRequested(label: string, reason?: string): string {
  return base(
    `
    ${badge('Action requise')}
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">Vérification ${label}</h1>
    <p style="margin:0;color:${COLORS.indigoLight};font-size:14px;">Des documents sont nécessaires</p>`,
    `
    <p style="margin:0 0 ${reason ? '16px' : '28px'};color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Pour compléter votre vérification <strong>${label}</strong>, veuillez envoyer vos documents depuis votre espace profil.
    </p>
    ${reason ? `<div style="background:#FFF7ED;border-left:3px solid ${COLORS.orange};border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 28px;">
      <p style="margin:0;color:#92400E;font-size:14px;line-height:1.6;">${reason}</p>
    </div>` : ''}
    ${button('Compléter ma vérification →', 'https://nexart.fr/dashboard')}`
  )
}

export function emailDeleteRequest(cancelUrl: string): string {
  return base(
    `
    <p style="margin:0 0 12px;display:inline-block;background:rgba(239,68,68,0.2);border:1px solid ${COLORS.red};border-radius:999px;padding:5px 16px;color:${COLORS.red};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Suppression de compte</p>
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">Confirmez la suppression</h1>
    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;">Vous avez 24h pour annuler</p>`,
    `
    <p style="margin:0 0 16px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Nous avons reçu votre demande de suppression de compte. Votre compte sera définitivement supprimé dans <strong>30 jours</strong>.
    </p>
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Si c'était une erreur, cliquez sur le bouton ci-dessous dans les <strong>24 heures</strong> pour annuler.
    </p>
    ${button('Annuler la suppression →', cancelUrl, COLORS.red)}`
  )
}

export function emailDeleteCancelled(): string {
  return base(
    `
    <p style="margin:0 0 12px;display:inline-block;background:rgba(16,185,129,0.2);border:1px solid ${COLORS.green};border-radius:999px;padding:5px 16px;color:${COLORS.green};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Compte restauré ✅</p>
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">Suppression annulée</h1>`,
    `
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Votre compte Nexart est de nouveau actif. La demande de suppression a bien été annulée.
      Tout votre contenu est intact.
    </p>
    ${button('Accéder à mon espace →', 'https://nexart.fr/dashboard')}`
  )
}

export function emailWaitlistPromotion(eventTitle: string, eventId: string): string {
  return base(
    `
    ${badge('Bonne nouvelle !')}
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">🎉 Une place s'est libérée !</h1>
    <p style="margin:0;color:${COLORS.indigoLight};font-size:14px;">${eventTitle}</p>`,
    `
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Une place vient de se libérer pour <strong>${eventTitle}</strong> et vous êtes en tête de liste d'attente.
      Confirmez votre participation rapidement avant que la place soit proposée au suivant.
    </p>
    ${button('Confirmer ma participation →', `https://nexart.fr/events/${eventId}`)}`
  )
}

export function emailReminder(eventTitle: string, eventId: string, isLast: boolean): string {
  return base(
    `
    <p style="margin:0 0 12px;display:inline-block;background:rgba(245,158,11,0.2);border:1px solid ${COLORS.orange};border-radius:999px;padding:5px 16px;color:${COLORS.orange};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
      ${isLast ? 'Dernière relance ⚠️' : 'Rappel'}
    </p>
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">Confirmez votre participation</h1>
    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;">${eventTitle}</p>`,
    `
    <p style="margin:0 0 ${isLast ? '16px' : '28px'};color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      ${isLast
        ? `C'est notre dernière relance. Votre place pour <strong>${eventTitle}</strong> sera libérée si vous ne confirmez pas rapidement.`
        : `N'oubliez pas de confirmer votre participation à <strong>${eventTitle}</strong>. Votre place vous attend !`
      }
    </p>
    ${isLast ? `<div style="background:#FFF7ED;border-left:3px solid ${COLORS.orange};border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 28px;">
      <p style="margin:0;color:#92400E;font-size:14px;">Action requise : confirmez maintenant ou votre place sera perdue.</p>
    </div>` : ''}
    ${button('Confirmer ma participation →', `https://nexart.fr/events/${eventId}`)}`
  )
}

export function emailCreditsPurchased(creditType: string, amount: number, totalPaid: string): string {
  const typeLabel = creditType === 'boost_candidature' ? 'Boost candidature' : creditType === 'event_creation' ? 'Création d\'événement' : creditType
  return base(
    `
    ${badge('Achat confirmé ✅')}
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">Vos crédits sont disponibles !</h1>
    <p style="margin:0;color:${COLORS.indigoLight};font-size:14px;">${amount} crédit${amount > 1 ? 's' : ''} ${typeLabel}</p>`,
    `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F8FAFC;border-radius:10px;overflow:hidden;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${COLORS.border};">
        <span style="color:${COLORS.textMuted};font-size:13px;font-weight:600;">Type de crédit :</span>
        <span style="color:${COLORS.textBody};font-size:14px;margin-left:8px;font-weight:700;">${typeLabel}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid ${COLORS.border};">
        <span style="color:${COLORS.textMuted};font-size:13px;font-weight:600;">Crédits ajoutés :</span>
        <span style="color:${COLORS.indigo};font-size:14px;margin-left:8px;font-weight:800;">${amount}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <span style="color:${COLORS.textMuted};font-size:13px;font-weight:600;">Montant payé :</span>
        <span style="color:${COLORS.textBody};font-size:14px;margin-left:8px;font-weight:700;">${totalPaid}</span>
      </td></tr>
    </table>
    <p style="margin:0 0 28px;color:${COLORS.textMuted};font-size:13px;line-height:1.6;">
      Vos crédits sont valables 6 mois. Vous pouvez les utiliser depuis votre tableau de bord.
    </p>
    ${button('Utiliser mes crédits →', 'https://nexart.fr/dashboard')}`
  )
}

export function emailPaymentFailed(amount: string): string {
  return base(
    `
    <p style="margin:0 0 12px;display:inline-block;background:rgba(239,68,68,0.2);border:1px solid ${COLORS.red};border-radius:999px;padding:5px 16px;color:${COLORS.red};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Paiement échoué</p>
    <h1 style="margin:0 0 8px;color:#fff;font-size:24px;font-weight:800;">⚠️ Problème de paiement</h1>
    <p style="margin:0;color:rgba(255,255,255,0.6);font-size:14px;">Montant : ${amount}</p>`,
    `
    <p style="margin:0 0 16px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Votre paiement de <strong>${amount}</strong> n'a pas pu être traité. Cela peut être dû à des fonds insuffisants ou à un problème avec votre moyen de paiement.
    </p>
    <p style="margin:0 0 28px;color:${COLORS.textBody};font-size:15px;line-height:1.7;">
      Mettez à jour votre moyen de paiement depuis votre espace pour régulariser la situation.
    </p>
    ${button('Mettre à jour mon paiement →', 'https://nexart.fr/dashboard', COLORS.red)}`
  )
}
