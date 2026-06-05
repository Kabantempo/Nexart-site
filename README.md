# Nexart Web — Site Next.js 15

Site Next.js 15 pour la plateforme Nexart. Partage la même BDD Supabase que l'app mobile.

## Stack

| Technologie | Version |
|------------|---------|
| Next.js | 15 |
| TypeScript | 5 |
| Tailwind CSS | Latest |
| Framer Motion | Latest |
| Zustand | Latest |
| Supabase | @supabase/supabase-js |

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Configuration

Le fichier `.env.local` doit contenir les mêmes variables que l'app mobile.

## Structure

```
├── app/
│   ├── page.tsx              # Landing page
│   ├── creators/page.tsx      # Liste créateurs
│   ├── events/page.tsx        # Liste événements
│   ├── download/page.tsx      # Téléchargement app
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── about/page.tsx
│   └── layout.tsx
├── components/
│   ├── header.tsx
│   └── footer.tsx
├── lib/
│   ├── supabase.ts            # Client Supabase
│   ├── store.ts               # Zustand
│   ├── types.ts
│   └── hooks.ts
```

## Pages

| Page | Description |
|------|-------------|
| `/` | Landing page |
| `/creators` | Explorer créateurs (live Supabase) |
| `/events` | Explorer événements (live Supabase) |
| `/download` | Télécharger l'app mobile |
| `/login` | Connexion |
| `/register` | Inscription |
| `/about` | À propos |

## Intégration Supabase

Partage la même BDD que l'app mobile. Les hooks (`useEvents`, `useCreators`) font les requêtes en temps réel.
