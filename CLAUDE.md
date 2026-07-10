@AGENTS.md

---

## Claude Instructions

Do NOT re-read all project files every session. It wastes tokens.
- Read CLAUDE.md Quick Setup section first
- Check memory: `/Users/Kalvert/.claude/projects/-Users-Kalvert/memory/nexart_project.md`
- Only read files when specifically asked or when debugging
- Use `grep` or `git log` instead of full file reads

If you need to explore: ask the user first before doing full file scans.

# Patch Notes & Changelog

## Deux systèmes complémentaires

### 1. Page statique `/patch-notes`
- **Fichiers** : `/app/patch-notes/page.tsx` + `patch-notes-client.tsx`
- **Données** : `/public/patch-notes.json` (statique)
- **Route** : `https://nexart.fr/patch-notes`
- **Usage** : Page principale d'historique complet des versions
- **Ajouter une version** : éditer `patch-notes.json` (format: `{ version, date, name, features[], improvements[], fixes[] }`)

### 2. Bouton dropdown "Nouveautés" (WhatsNew)
- **Composant** : `/components/ui/whats-new.tsx`
- **Données** : table Supabase `changelog` (dynamique)
- **Migration** : `/supabase/migrations/20260710_changelog.sql`
- **Usage** : bouton dans navbar affichant les N dernières versions
- **Ajouter une version** : insérer dans Supabase (table `changelog`) via dashboard ou API

## Format Supabase `changelog.entries`
```json
[
  { "type": "new", "text": "..." },
  { "type": "improvement", "text": "..." },
  { "type": "fix", "text": "..." },
  { "type": "perf", "text": "..." },
  { "type": "security", "text": "..." }
]
```

## Env vars requis
- `NEXT_PUBLIC_SUPABASE_URL` 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

# Quick Setup & Deploy

## Before running dev server
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Dev server
```bash
npm run dev  # http://localhost:3000
```

## Deploy to Hostinger
```bash
chmod +x deploy.sh
./deploy.sh
```
Requires: `~/.ssh/hostinger_nexart` key + `.env.local` configured

**Post-deploy checklist:**
- [ ] `/patch-notes` page loads
- [ ] WhatsNew button appears in navbar
- [ ] Changelog table exists in Supabase (run migration if needed)
- [ ] Latest version shows in WhatsNew dropdown

---

# Page Creation Standards

## File structure
```
app/my-page/
  ├── page.tsx              (server component — metadata + layout)
  └── my-page-client.tsx    (client component — rendering + interactivity)
```

## page.tsx template
```tsx
import type { Metadata } from 'next'
import MyPageClient from './my-page-client'

export const metadata: Metadata = {
  title: 'Page Title — Nexart',
  description: 'Short description for SEO',
  alternates: { canonical: 'https://nexart.fr/my-page' },
  openGraph: {
    title: 'Page Title — Nexart',
    description: 'Short description',
    url: 'https://nexart.fr/my-page',
    type: 'website',
  },
}

export default function MyPage() {
  return <MyPageClient />
}
```

## -client.tsx template
```tsx
'use client'
import { motion } from 'framer-motion'
import { SomeIcon } from 'lucide-react'

export default function MyPageClient() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Container */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        {/* Section with animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            Title
          </h1>
        </motion.div>
      </div>

      {/* Content sections */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px', borderTop: '1px solid #E5E7EB' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Content */}
        </motion.div>
      </div>
    </div>
  )
}
```

## Styling rules
- **Use inline styles** (NOT Tailwind classes in main content)
- **Container max-width**: 1280px (`maxWidth: '1280px'`)
- **Default padding**: `padding: '60px 16px'` (vertical/horizontal)
- **Borders**: `border: '1px solid #E5E7EB'` (light gray dividers)

## Color palette
- **Background**: `#FFFFFF` (white)
- **Text primary**: `#1A1A1A` (dark gray/black)
- **Text secondary**: `#888888` (medium gray)
- **Text tertiary**: `#9CA3AF` (light gray)
- **Accent**: `#FF6B6B` (red) or `#6366F1` (indigo)
- **Borders**: `#E5E7EB` (light border)

## Animation patterns
```tsx
// Fade-in on load
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
/>

// Fade-in on scroll (once)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  viewport={{ once: true }}
/>
```

## Typography
- **H1** : `fontSize: '48px', fontWeight: 700`
- **H2** : `fontSize: '32px', fontWeight: 700`
- **Body** : `fontSize: '18px', color: '#888888', lineHeight: '1.6'`
- **Small** : `fontSize: '14px', color: '#9CA3AF'`

## Icons
- Use Lucide React (`lucide-react`)
- Example: `import { Heart, Target, Zap, Users } from 'lucide-react'`
- Size: typically `size={16}` or `size={32}`

## Tech stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: inline + Tailwind (hybrid)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (auth, realtime, storage)
- **Hosting**: Hostinger (Node.js)

---

# Versioning (SemVer)

**System**: Semantic Versioning (MAJOR.MINOR.PATCH)
**Storage**: `package.json` + git tags
**Display**: `NEXT_PUBLIC_VERSION` env var

### Bump version
```bash
npm run bump-version 0.8.0
# → updates package.json, commits, creates git tag, pushes
```

### Milestones
- **v0.8.0** (current) : auth, messaging, feed, reviews, map, notifications, patch notes
- **v1.0.0** : + Stripe integration, complete emails
- **v1.1.0** : organizer tools, volunteer scheduling
- **v2.0.0** : mini-boutique, advanced payments
