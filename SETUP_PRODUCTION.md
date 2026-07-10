# Setup Production v1.0.0

**Guide configuration complète Supabase + Hostinger + Cron**

---

## 1. SUPABASE PRODUCTION SETUP

### 1.1 Vérifier Region (RGPD)

**Action**: Aller sur https://supabase.com/dashboard/projects/cvqeysnymnkfxfithhsr/settings/general

- [x] **Region**: EU (eu-central-1) ✅ Conforme RGPD
- [x] **Plan**: Pro ou supérieur (backup enabled)
- [ ] Vérifier backups actifs (Daily)

### 1.2 Appliquer SQL Migration

**Si pas encore appliquée**:

1. Go to: https://supabase.com/dashboard/project/cvqeysnymnkfxfithhsr/sql/new
2. Copy-paste from: `supabase/migrations/20260727_rgpd_soft_delete.sql`
3. Execute
4. Verify tables created:
   - `deleted_user_backups` ✅
   - `users.deleted_at` column ✅
   - `users.is_hard_deleted` column ✅

**Verify indexes**:
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'users';
-- Should show: idx_users_deleted_at, idx_users_is_hard_deleted
```

### 1.3 Enable RLS Policies

**Action**: Vérifier Row Level Security activé

Dashboard → Authentication → Policies

- [ ] `users` table: RLS enabled
- [ ] `profiles` table: RLS enabled
- [ ] `deleted_user_backups` table: RLS enabled (admin only)

**Test query** (SQL Editor):
```sql
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;
-- Vérifier que soft-deleted users non inclus
```

### 1.4 Backup Verification

Dashboard → Settings → Backups

- [ ] Backups enabled (Daily)
- [ ] Retention: 7 days minimum
- [ ] Last backup: today ✅

---

## 2. HOSTINGER ENVIRONMENT SETUP

### 2.1 Create .env.production File

**On Hostinger server** (via SSH):

```bash
ssh -i ~/.ssh/hostinger_nexart u142938038@147.79.103.73 -p 65002
```

Navigate to app root:
```bash
cd /home/u142938038/nexart-site
```

Create `.env.production`:
```bash
cat > .env.production << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cvqeysnymnkfxfithhsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Q59WmYgpYsdmW2pPRF6sfA_g2inbZei
SUPABASE_SERVICE_ROLE_KEY=<get-from-dashboard>
NEXT_PUBLIC_APP_URL=https://nexart.fr

# Email (Resend)
RESEND_API_KEY=<resend-api-key>

# Cron Security
CRON_SECRET_TOKEN=<generate-strong-random-token>

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=GTM-PC469WF9
EOF
```

**Get SUPABASE_SERVICE_ROLE_KEY**:
1. Dashboard → Settings → API
2. Copy "service_role" key (starts with `eyJ...`)
3. Paste in `.env.production`

**Generate CRON_SECRET_TOKEN**:
```bash
openssl rand -base64 32
# Example output: aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uV1w==
# Use this value for both places
```

**Verify file created**:
```bash
cat .env.production
# Should show all vars (secrets will be visible - sécurisé)
```

### 2.2 Set File Permissions

```bash
chmod 600 .env.production
# Read/write owner only (security)
```

---

## 3. CRON JOB SETUP (Hard-Delete Automation)

### 3.1 Choose Cron Service

**Option A: EasyCron** (Recommended for hobby projects)
- Free tier: 100 executions/month
- URL-based: POST request every day

**Option B: Hostinger cPanel** (Included with hosting)
- Via SSH: `crontab -e`
- Local execution

**Option C: GitHub Actions** (If using GitHub)
- Free tier: 2000 minutes/month
- Scheduled workflows

**We'll use Option A (EasyCron)** for simplicity.

### 3.2 Register on EasyCron

1. Go to: https://www.easycron.com/
2. Sign up (free account)
3. Verify email
4. Login

### 3.3 Create Cron Job

1. Click "Add a Cron Job"
2. Fill in:

| Field | Value |
|-------|-------|
| **URL** | `https://nexart.fr/api/cron/hard-delete-users` |
| **HTTP Method** | POST |
| **HTTP Authentication** | (Leave empty) |
| **Custom HTTP Headers** | `Authorization: Bearer <CRON_SECRET_TOKEN>` |
| **Cron Expression** | `0 2 * * *` (Daily 2 AM UTC) |
| **Timezone** | UTC |
| **Execution Log** | Keep enabled |
| **Alert Email** | contact@nexart.fr |

3. Click "Create Cron Job"
4. Test trigger: Click "Run Now"

**Verify execution**:
- Check Execution Log
- Should see "Status: 200 OK"
- Response: `{"message":"Suppression complétée","deleted_count":0,...}`

### 3.4 Local Alternative (Hostinger cPanel)

If using Hostinger cPanel SSH cron:

```bash
# Login to Hostinger
ssh -i ~/.ssh/hostinger_nexart u142938038@147.79.103.73 -p 65002

# Edit crontab
crontab -e

# Add line:
0 2 * * * curl -X POST https://nexart.fr/api/cron/hard-delete-users \
  -H "Authorization: Bearer $(grep CRON_SECRET_TOKEN .env.production | cut -d= -f2)" \
  >> /tmp/nexart-cron.log 2>&1

# Save (Ctrl+X → Y → Enter)

# Verify cron added
crontab -l
```

---

## 4. LOCAL BUILD TEST

### 4.1 Build on Local Machine

```bash
npm run build
```

**Expected output**:
```
✓ Compiled successfully
✓ Next.js bundles optimized for production
```

**Check for errors**:
- No red errors ❌
- Warnings OK ⚠️
- Build size acceptable

### 4.2 Test Local Production Build

```bash
npm run build
npm run start
# Open http://localhost:3000
```

**Smoke tests**:
- [ ] Homepage loads
- [ ] Navigate `/confidentialite` → loads
- [ ] Navigate `/settings` → loads
- [ ] Buttons clickable (no console errors)
- [ ] Bandeau cookies appears

### 4.3 Environment Check

```bash
npm run build 2>&1 | grep -i "secret\|key\|token"
# Should NOT expose any secrets
```

---

## 5. PRE-DEPLOY CHECKLIST

### Code Quality
- [x] No TypeScript errors: `npm run build`
- [x] Linter clean: `npm run lint`
- [x] No console.log in code
- [x] No hardcoded secrets in git
- [x] All env vars documented

### Database
- [x] Supabase region: EU ✅
- [x] RLS policies: enabled
- [x] Backups: enabled
- [x] Migration: applied
- [x] Tables verified: 3 tables exist

### Hostinger
- [x] SSH key working
- [x] .env.production created
- [x] File permissions: 600
- [x] All secrets configured

### Cron
- [x] EasyCron account created
- [x] Job configured + tested
- [x] Alert email set
- [x] Authorization header correct

### DNS & SSL
- [x] Domain: nexart.fr pointing to Hostinger
- [x] SSL certificate: valid ✅
- [x] HTTPS: working

---

## 6. DEPLOY COMMAND

When ready, execute:

```bash
./deploy.sh
```

**This will**:
1. Build Next.js app
2. Push code via SSH to Hostinger
3. Run `npm install` on server
4. Restart PM2 process
5. Verify site accessible

**If deploy fails**:
1. Check SSH key permissions: `chmod 600 ~/.ssh/hostinger_nexart`
2. Verify .env.production exists on server
3. Check PM2 logs: `pm2 logs`
4. Restart manually: `ssh ... "pm2 restart nexart-site"`

---

## 7. POST-DEPLOY VERIFICATION

### Immediate (First 5 minutes)

```bash
# SSH into Hostinger
ssh -i ~/.ssh/hostinger_nexart u142938038@147.79.103.73 -p 65002

# Check app running
pm2 status
# Should show: nexart-site (online, memory OK, CPU OK)

# Check logs
pm2 logs nexart-site
# Should show: "Ready in XXms" (no red errors)

# Test endpoint
curl https://nexart.fr/
# Should return HTML (not error)
```

### 1 Hour Later

- [ ] Visit https://nexart.fr in browser
- [ ] Check homepage loads
- [ ] Check `/confidentialite` loads
- [ ] Bandeau cookies visible
- [ ] No console errors (DevTools)

### Next Day

- [ ] Cron job executed (check EasyCron log)
- [ ] No errors in Hostinger logs
- [ ] Monitor CPU/memory usage

---

## 8. ROLLBACK PROCEDURE

If deploy breaks production:

```bash
# SSH to Hostinger
ssh -i ~/.ssh/hostinger_nexart u142938038@147.79.103.73 -p 65002

# Restore previous version (Git)
cd nexart-site
git log --oneline | head -3
git revert <bad-commit-hash>

# Restart app
npm run build && pm2 restart nexart-site
```

---

## Troubleshooting

### "404 Not Found" on /confidentialite
- [ ] Verify page.tsx exists: `ls app/settings/page.tsx`
- [ ] Check build included file: `npm run build`
- [ ] Restart: `pm2 restart nexart-site`

### "500 Error" on delete-request
- [ ] Check .env.production has SUPABASE_SERVICE_ROLE_KEY
- [ ] Check RESEND_API_KEY valid
- [ ] View logs: `pm2 logs`

### Cron not executing
- [ ] Check EasyCron log: https://www.easycron.com/
- [ ] Verify Authorization header in cron config
- [ ] Test manual: `curl -X POST https://nexart.fr/api/cron/hard-delete-users -H "Authorization: Bearer ..."`

### Email not sending
- [ ] Verify RESEND_API_KEY in .env.production
- [ ] Check Resend dashboard for errors
- [ ] Test: Send test email via settings page

---

**Last Updated**: 27 juillet 2026  
**Status**: Ready for production
