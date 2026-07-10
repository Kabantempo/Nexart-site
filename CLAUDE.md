@AGENTS.md

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

## Tech stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: inline + Tailwind (hybrid)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (auth, realtime, storage)
- **Hosting**: Hostinger (Node.js)
