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
