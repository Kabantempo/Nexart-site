/**
 * ============================================================
 * NEXART — DESIGN TOKENS (SOURCE DE VÉRITÉ)
 * ============================================================
 * Ce fichier est la norme graphique du projet Nexart.
 * Tout nouveau composant doit importer ses valeurs d'ici.
 * Jamais de couleur, taille ou ombre codée en dur ailleurs.
 *
 * Emplacement : lib/design-tokens.ts
 * Utilisé par  : tous les composants (inline styles uniquement)
 * Mis à jour   : v1.2.0
 * ============================================================
 */

// ─────────────────────────────────────────────
// COULEURS
// ─────────────────────────────────────────────

export const colors = {

  // Accent principal
  violet: {
    primary:  '#6366F1',  // CTAs, liens, highlights
    hover:    '#818CF8',  // hover sur éléments violets
    dark:     '#5B5BD6',  // active/pressed
    bg:       '#EDE9FE',  // fond très léger (badges "Nouveau")
    bgHover:  '#DDD6FE',  // hover sur fond violet léger
    text:     '#4338CA',  // texte sur fond violet léger
    ring:     'rgba(99, 102, 241, 0.25)', // anneau focus
  },

  // Fonds
  bg: {
    primary:   '#FFFFFF',  // fond principal, cartes, écrans
    secondary: '#F5F5F7',  // sections alternatives, inputs disabled
    hover:     '#F0F0FF',  // hover sur ghost buttons
    subtle:    '#F3F4F6',  // gris très léger (Tailwind gray-100)
    dark:      '#06060f',  // fond hero dark
    darkAlt:   '#0F0C29',  // fond dark alternatif (dégradé)
  },

  // Textes
  text: {
    primary:   '#1A1A1A',  // texte principal, titres
    secondary: '#6B7280',  // labels, descriptions — ratio 4.62:1 on white (WCAG AA ✓)
    muted:     '#737373',  // placeholders, hints, disabled — ratio 4.6:1 (WCAG AA ✓)
    onViolet:  '#FFFFFF',  // texte sur fond violet
    onDanger:  '#FFFFFF',  // texte sur fond rouge
    dark:      '#111827',  // gris très foncé (Tailwind gray-900)
    light:     '#9CA3AF',  // gris clair (Tailwind gray-400)
    white:     '#FFFFFF',
    black:     '#000000',
    gray888:   '#888888',
  },

  // Bordures
  border: {
    default: '#E5E7EB',   // bordures au repos
    strong:  '#AAAAAA',   // bordures hover / focus
    accent:  '#6366F1',   // bordure violet (focus, selected)
    danger:  '#E05A5A',   // bordure champ en erreur
    success: '#4CAF50',   // bordure champ validé
  },

  // Feedback sémantique
  feedback: {
    danger: {
      bg:     '#FFEBEE',
      border: '#E05A5A',
      text:   '#B71C1C',
      solid:  '#E05A5A',  // fond bouton destructif
      ring:   'rgba(224, 90, 90, 0.2)',
    },
    success: {
      bg:     '#E8F5E9',
      border: '#4CAF50',
      text:   '#2E7D32',
      solid:  '#4CAF50',
      ring:   'rgba(76, 175, 80, 0.2)',
    },
    warning: {
      bg:     '#FFF8E1',
      border: '#FF9800',
      text:   '#B45309',
      solid:  '#FF9800',
    },
    info: {
      bg:     '#E3F2FD',
      border: '#2196F3',
      text:   '#1565C0',
      solid:  '#2196F3',
    },
  },

  // Statuts candidatures exposants
  status: {
    pending:  { bg: '#FFF8E1', text: '#B45309', dot: '#F59E0B' },
    accepted: { bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' },
    refused:  { bg: '#FFEBEE', text: '#B71C1C', dot: '#E05A5A' },
    new:      { bg: '#EDE9FE', text: '#4338CA', dot: '#6366F1' },
  },

  // Vert émeraude (stats positives, compteurs, indicateurs)
  green: {
    primary:   '#10B981',
    light:     '#34D399',
    pale:      '#4ade80',
    emerald:   '#6EE7B7',
    medium:    '#A5D6A7',
    success:   '#4CAF50',
    whatsapp:  '#25D366',
    bg:        '#ECFDF5',
    bgLight:   '#D1FAE5',
    bgPale:    '#F0FDF4',
    text:      '#065F46',
    textDark:  '#166534',
    textMid:   '#15803D',
    textGreen: '#16A34A',
  },

  // Rouge vif + rose (alertes, tags, badges hors charte Nexart)
  red: {
    vivid:    '#EF4444',
    soft:     '#f87171',
    softAlt:  '#F87171',
    medium:   '#FCA5A5',
    pink:     '#f87171',
    bg:       '#FEF2F2',
    bgSoft:   '#FEE2E2',
    bgPale:   '#FFF1F2',
    bgRose:   '#FCE7F3',
    bgPink:   '#FECDD3',
    bgCa:     '#FECACA',
    bgFbeb:   '#FFFBEB',
    text:     '#991B1B',
    textDark: '#BE123C',
    textDeep: '#9D174D',
    textVivid:'#DC2626',
    textBright:'#E11D48',
    textB91:  '#B91C1C',
    amber:    '#92400E',
    amberDark:'#854D0E',
  },

  // Violet étendu (dégradés, badges, tags)
  purple: {
    primary:  '#8B5CF6',
    violet:   '#A855F7',
    light:    '#A78BFA',
    pale:     '#C4B5FD',
    dark:     '#7C3AED',
    darker:   '#5B21B6',
    deep:     '#6D28D9',
    deep4c:   '#4C1D95',
    deepest:  '#2E1065',
    indigo:   '#4F46E5',
    indigoDark: '#4338CA',
    indigoDarkAlt: '#4338ca',
    indigoDeep: '#3730A3',
    indigoDeepAlt: '#3730a3',
    deepDark: '#1E1B4B',
    bg:       '#EDE9FE',
    bgLight:  '#C7D2FE',
    bgLightAlt: '#c7d2fe',
    bgPale:   '#A5B4FC',
    bgPaleAlt: '#a5b4fc',
    bgEef:    '#EEF2FF',
    bgEefAlt: '#eef2ff',
    bgFafb:   '#FAFBFF',
    bgF5:     '#F5F3FF',
    bgF5ff:   '#F5F5FF',
    bgF8:     '#F8F9FF',
    bgF0:     '#F0F0FF',
    bgF04:    '#F0F4FF',
    bgF8fa:   '#F8FAFF',
    bgE0e1:   '#E0E1FF',
    bgDdd:    '#DDD6FE',
    bgE0:     '#E0E7FF',
    bgDeep:   '#2D1B69',
    text:     '#4338CA',
    ring:     '#C4C7F0',
    ringAlt:  '#A5A6F6',
  },

  // Gris étendus (UI, dark sections)
  gray: {
    '100':   '#F3F4F6',
    '200':   '#E5E7EB',
    '200alt':'#e8e8e8',
    '200pale':'#f5f5f5',
    '300':   '#D1D5DB',
    '300alt':'#E2E8F0',
    '300slate':'#CBD5E1',
    '400':   '#9CA3AF',
    '500':   '#6B7280',
    '600':   '#4B5563',
    '600alt':'#4b5563',
    '700':   '#374151',
    '800':   '#1F2937',
    '900':   '#111827',
    '950':   '#7F1D1D',
    // Named aliases (safe in template literals)
    g100:    '#F3F4F6',
    g200:    '#E5E7EB',
    g200alt: '#e8e8e8',
    g200pale:'#f5f5f5',
    g300:    '#D1D5DB',
    g300alt: '#E2E8F0',
    g400:    '#9CA3AF',
    g500:    '#6B7280',
    g600:    '#4B5563',
    g700:    '#374151',
    g800:    '#1F2937',
    g900:    '#111827',
    g111:    '#111',
    mid:     '#555555',
    midAlt:  '#666',
    dark444: '#444',
    soft:    '#94A3B8',
    slate:   '#475569',
    slateBg: '#F1F5F9',
    neutral: '#AAAAAA',
    light:   '#f0f0f0',
    e0:      '#e0e0e0',
    ccc:     '#ccc',
    '111':   '#111',
  },

  // Jaune/Amber (warnings, highlights)
  yellow: {
    primary:  '#FCD34D',
    bright:   '#FDE047',
    amber:    '#FBBF24',
    pale:     '#FEF9C3',
    bg:       '#FEF3C7',
    bgE8:     '#FDE68A',
    bgFff7:   '#FFF7ED',
    text:     '#D97706',
    textDark: '#92400E',
    textB45:  '#B45309',
  },

  // Bleu (info, liens, badges)
  blue: {
    primary:  '#0EA5E9',
    cyan:     '#06B6D4',
    indigo:   '#1E40AF',
    indigoDark: '#164E63',
    google:   '#4285F4',
    googleGreen: '#34A853',
    sky:      '#DBEAFE',
    skyLight: '#BAE6FD',
    skyPale:  '#F0F9FF',
    pale:     '#F8FAFC',
    medium:   '#3B82F6',
    slate:    '#0369A1',
    ecfeff:   '#ECFEFF',
  },

  // Fuchsia / rose
  fuchsia: {
    primary: '#EC4899',
  },

  // Dark mode / hero backgrounds
  dark: {
    base:     '#06060f',
    alt:      '#0F0C29',
    deep:     '#1a1a2e',
    mid:      '#16213e',
    soft:     '#0f0f1a',
    violet:   '#1E1B4B',
    navy:     '#0f1117',
    navyDeep: '#0c0c1a',
    navyAlt:  '#08081a',
    slate:    '#0F172A',
    slateDark:'#1E293B',
    near:     '#0D0D0D',
  },

  // Accent rouge-orange Nexart (hors palette violet)
  coral: {
    primary: '#FF6B6B',
  },

  // Catégories d'événements (cartes, filtres)
  eventCategory: {
    permanent: '#3B82F6',
    seasonal:  '#F59E0B',
    popup:     '#A855F7',
    salon:     '#10B981',
    fair:      '#EF4444',
  },

} as const


// ─────────────────────────────────────────────
// TYPOGRAPHIE
// ─────────────────────────────────────────────

export const typography = {

  // Famille de polices
  fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  fontMono:   `Monaco, Menlo, 'Courier New', monospace`,

  // Hiérarchie (site web — Next.js)
  h1: { fontSize: '56px', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '48px', fontWeight: 700, lineHeight: 1.2 },
  h3: { fontSize: '20px', fontWeight: 600, lineHeight: 1.5 },
  body: { fontSize: '16px', fontWeight: 400, lineHeight: 1.6 },
  small: { fontSize: '14px', fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: '12px', fontWeight: 400, lineHeight: 1.3 },
  label: { fontSize: '13px', fontWeight: 500, lineHeight: 1.4 },

} as const


// ─────────────────────────────────────────────
// ESPACEMENT
// ─────────────────────────────────────────────

export const spacing = {
  xs:   '4px',
  sm:   '8px',
  md:  '16px',
  lg:  '24px',
  xl:  '32px',
  xxl: '48px',
  xxxl:'64px',
} as const


// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────

export const radius = {
  sm:   '8px',
  md:  '12px',
  lg:  '16px',
  pill:'9999px',
} as const


// ─────────────────────────────────────────────
// OMBRES
// ─────────────────────────────────────────────

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.08)',
  lg: '0 10px 25px rgba(0, 0, 0, 0.10)',
  focus: `0 0 0 3px ${colors.violet.ring}`,
  focusDanger: `0 0 0 3px rgba(224, 90, 90, 0.2)`,
  focusSuccess: `0 0 0 3px rgba(76, 175, 80, 0.15)`,
} as const


// ─────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────

export const breakpoints = {
  mobile: 640,   // < 640px
  tablet: 768,   // 640px – 1024px
  desktop: 1024, // > 1024px
} as const


// ─────────────────────────────────────────────
// MISE EN PAGE
// ─────────────────────────────────────────────

export const layout = {
  maxWidth: '1280px',
  pagePaddingX: '16px',
  pagePaddingY: '60px',
  navHeight: '64px',
  sectionGap: '80px',
} as const


// ─────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────

export const transitions = {
  fast:   'all 0.15s ease',
  base:   'all 0.25s ease',
  slow:   'all 0.4s ease',
  spring: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const


// ─────────────────────────────────────────────
// COMPOSANTS — STYLES PRÊTS À L'EMPLOI
// ─────────────────────────────────────────────
// Usage : style={componentStyles.button.primary}
// Pour le hover, utiliser onMouseEnter/Leave (voir exemples plus bas)

export const componentStyles = {

  // --- BOUTONS ---
  button: {
    base: {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: '6px',
      padding: '9px 18px',
      borderRadius: radius.sm,
      fontSize: typography.small.fontSize,
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      transition: transitions.fast,
      fontFamily: typography.fontFamily,
      textDecoration: 'none',
    },
    // Variantes (à merger avec base)
    primary: {
      backgroundColor: colors.violet.primary,
      color: colors.text.onViolet,
    },
    primaryHover: {
      backgroundColor: colors.violet.hover,
    },
    primaryActive: {
      backgroundColor: colors.violet.dark,
    },
    secondary: {
      backgroundColor: colors.bg.primary,
      color: colors.text.primary,
      border: `1px solid ${colors.border.default}`,
    },
    secondaryHover: {
      backgroundColor: colors.bg.secondary,
      borderColor: colors.violet.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.violet.primary,
      border: 'none',
    },
    ghostHover: {
      backgroundColor: colors.bg.hover,
    },
    danger: {
      backgroundColor: colors.feedback.danger.solid,
      color: colors.text.onDanger,
    },
    dangerHover: {
      backgroundColor: '#C94F4F',
    },
    // Tailles
    sm: { padding: '5px 12px', fontSize: '13px' },
    lg: { padding: '12px 24px', fontSize: '16px' },
    // Disabled (à appliquer quand disabled=true)
    disabled: {
      opacity: 0.45,
      cursor: 'not-allowed',
      pointerEvents: 'none' as const,
    },
  },

  // --- INPUTS ---
  input: {
    base: {
      width: '100%',
      padding: '9px 12px',
      borderRadius: radius.sm,
      fontSize: typography.small.fontSize,
      fontFamily: typography.fontFamily,
      border: `1.5px solid ${colors.border.default}`,
      backgroundColor: colors.bg.primary,
      color: colors.text.primary,
      outline: 'none',
      transition: transitions.fast,
    },
    // États (à appliquer dynamiquement)
    hover: {
      borderColor: colors.border.strong,
    },
    focus: {
      borderColor: colors.border.accent,
      boxShadow: shadows.focus,
    },
    error: {
      borderColor: colors.border.danger,
      boxShadow: shadows.focusDanger,
    },
    success: {
      borderColor: colors.border.success,
      boxShadow: shadows.focusSuccess,
    },
    disabled: {
      backgroundColor: colors.bg.secondary,
      color: colors.text.muted,
      cursor: 'not-allowed',
      borderColor: colors.border.default,
    },
    // Labels et messages
    label: {
      display: 'block' as const,
      fontSize: typography.label.fontSize,
      fontWeight: typography.label.fontWeight,
      color: colors.text.primary,
      marginBottom: '4px',
    },
    hint: {
      fontSize: typography.caption.fontSize,
      color: colors.text.secondary,
      marginTop: '4px',
    },
    hintError: {
      fontSize: typography.caption.fontSize,
      color: colors.feedback.danger.text,
      marginTop: '4px',
    },
    hintSuccess: {
      fontSize: typography.caption.fontSize,
      color: colors.feedback.success.text,
      marginTop: '4px',
    },
  },

  // --- CARTES ---
  card: {
    base: {
      backgroundColor: colors.bg.primary,
      borderRadius: radius.md,
      border: `1px solid ${colors.border.default}`,
      padding: spacing.lg,
      transition: transitions.base,
    },
    hover: {
      borderColor: colors.violet.primary,
      boxShadow: shadows.md,
    },
    section: {
      backgroundColor: colors.bg.secondary,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
  },

  // --- BADGES ---
  badge: {
    base: {
      display: 'inline-flex' as const,
      alignItems: 'center' as const,
      gap: '5px',
      padding: '4px 10px',
      borderRadius: radius.pill,
      fontSize: typography.caption.fontSize,
      fontWeight: 500,
    },
    pending: {
      backgroundColor: colors.status.pending.bg,
      color: colors.status.pending.text,
    },
    accepted: {
      backgroundColor: colors.status.accepted.bg,
      color: colors.status.accepted.text,
    },
    refused: {
      backgroundColor: colors.status.refused.bg,
      color: colors.status.refused.text,
    },
    new: {
      backgroundColor: colors.status.new.bg,
      color: colors.status.new.text,
    },
    info: {
      backgroundColor: colors.feedback.info.bg,
      color: colors.feedback.info.text,
    },
    success: {
      backgroundColor: colors.feedback.success.bg,
      color: colors.feedback.success.text,
    },
    warning: {
      backgroundColor: colors.feedback.warning.bg,
      color: colors.feedback.warning.text,
    },
    danger: {
      backgroundColor: colors.feedback.danger.bg,
      color: colors.feedback.danger.text,
    },
  },

  // --- ALERTES INLINE ---
  alert: {
    base: {
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: radius.sm,
      fontSize: typography.small.fontSize,
      display: 'flex' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    danger: {
      backgroundColor: colors.feedback.danger.bg,
      border: `1px solid ${colors.feedback.danger.border}`,
      color: colors.feedback.danger.text,
    },
    success: {
      backgroundColor: colors.feedback.success.bg,
      border: `1px solid ${colors.feedback.success.border}`,
      color: colors.feedback.success.text,
    },
    warning: {
      backgroundColor: colors.feedback.warning.bg,
      border: `1px solid ${colors.feedback.warning.border}`,
      color: colors.feedback.warning.text,
    },
    info: {
      backgroundColor: colors.feedback.info.bg,
      border: `1px solid ${colors.feedback.info.border}`,
      color: colors.feedback.info.text,
    },
  },

  // --- DIVIDERS ---
  divider: {
    horizontal: {
      border: 'none',
      borderTop: `1px solid ${colors.border.default}`,
      margin: `${spacing.lg} 0`,
    },
  },

  // --- AVATARS ---
  avatar: {
    base: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: radius.pill,
      fontWeight: 600,
      flexShrink: 0,
    },
    sm: { width: '32px', height: '32px', fontSize: '12px' },
    md: { width: '44px', height: '44px', fontSize: '16px' },
    lg: { width: '64px', height: '64px', fontSize: '22px' },
    fallbackBg: colors.violet.bg,
    fallbackColor: colors.violet.text,
  },

} as const


// ─────────────────────────────────────────────
// ANIMATIONS FRAMER MOTION
// ─────────────────────────────────────────────
// Usage : <motion.div {...animations.fadeUp}>

export const animations = {
  fadeUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  },
  fadeUpInView: {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
    viewport: { once: true },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 },
  },
} as const
