# Setup — Nexart Site

## Table Supabase requise : `contact_submissions`

### Option 1 : Via Supabase Dashboard SQL Editor

1. Aller à https://supabase.com/dashboard
2. Projet **Nexart** → **SQL Editor**
3. Créer une nouvelle query et copier/coller :

```sql
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_insert_contact
  ON contact_submissions
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY allow_read_contact
  ON contact_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');
```

4. Exécuter (Cmd+Enter)

### Option 2 : Via Script Node.js

```bash
SUPABASE_SERVICE_KEY="sb_secret_..." node scripts/create-contact-table.mjs
```

(Le script affichera les instructions SQL si RPC n'est pas disponible)

## Vérifier la table

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'contact_submissions';
```

## Route Contact

- **Page** : `/contact`
- **Form** : Soumets vers table `contact_submissions`
- **Réponse** : Toast success/error après envoi
