# Nexart Roadmap & Versioning

**Current**: v0.8.0 (2026-07-10)
**Target**: v1.0.0 (prod-ready with payments)

---

## v0.8.0 ✅ (2026-07-10) — Patch Notes System

**Completed:**
- [x] Patch notes page (`/patch-notes`)
- [x] WhatsNew dropdown button (navbar)
- [x] Accessibility improvements (ARIA, semantic HTML)
- [x] Creator customizable pages (colors, fonts, music)
- [x] Versioning automation (SemVer script)

**Status**: Live on production

---

## v0.9.0 (Next) — Foundation Polishing

### Quick Wins (1-2 days)
- [ ] Géolocalisation /creators — "Autour de moi" button
- [ ] Email confirmation banner (top of page)
- [ ] Better error messages (app-wide)
- [ ] Loading states consistency
- [ ] Missing image fallbacks

### Medium Tasks (3-5 days)
- [ ] 2FA TOTP setup (Supabase MFA)
- [ ] Creator search autocomplete
- [ ] Event filters persistence (localStorage)
- [ ] Organizer email notifications
- [ ] Creator dashboard stats

### Polish (2-3 days)
- [ ] Motion/animations fine-tuning
- [ ] Mobile responsiveness audit
- [ ] Form validation improvements
- [ ] Toast/notification consistency

**Estimated**: 1-2 weeks
**Release**: Mid-July 2026

---

## v1.0.0 🎯 (Blocker) — Production Ready + Payments

### CRITICAL: Stripe Integration (10-15 days)

**Stripe Setup**
- [ ] Create Stripe account & test keys
- [ ] Configure Stripe webhooks (invoice.paid, charge.failed, etc.)
- [ ] Add Stripe environment variables to `.env.local`

**Checkout Flow** (4-5 days)
- [ ] `/api/stripe/checkout` — create session
- [ ] `/api/stripe/portal` — billing portal link
- [ ] Checkout page UI (price tiers: 10/50/100 credits)
- [ ] Success/cancel pages
- [ ] Error handling

**Webhook Handlers** (3-4 days)
- [ ] `/api/stripe/webhook` — payment confirmation
- [ ] Add credits to user balance (supabase update)
- [ ] Send confirmation email
- [ ] Handle refunds/disputes

**Frontend** (2-3 days)
- [ ] Credits display (navbar or dashboard)
- [ ] Buy credits button (simple modal)
- [ ] Purchase history page
- [ ] Test payment flow end-to-end

**Testing** (2 days)
- [ ] Test successful payment
- [ ] Test failed payment
- [ ] Test webhook delivery
- [ ] Test portal access

### Admin Panel (8-10 days)

**Backend Routes**
- [ ] `/api/admin/reports` — list/resolve reports
- [ ] `/api/admin/users` — search/ban/unban
- [ ] `/api/admin/events` — moderate content
- [ ] `/api/admin/analytics` — basic stats (revenue, users, events)

**Frontend** (`/admin`)
- [ ] Reports list + detail + resolve workflow
- [ ] Users management (search, ban, view profile)
- [ ] Events moderation queue
- [ ] Dashboard (KPIs, recent activity)
- [ ] Logs viewer

**RLS Policies** (1-2 days)
- [ ] Only admins can access admin routes
- [ ] Add `role` check to all queries
- [ ] Test with non-admin user

### Emails & Notifications (5-7 days)

**Email Templates**
- [ ] Payment confirmation (`Merci pour votre achat!`)
- [ ] Event acceptance (`Votre candidature a été acceptée`)
- [ ] Event rejection (`Malheureusement...`)
- [ ] Message notification (`Vous avez un nouveau message`)
- [ ] Weekly digest (optional)

**Setup**
- [ ] Configure SendGrid or Resend
- [ ] Add SMTP credentials to `.env`
- [ ] Test delivery

### QA & Launch Prep (5 days)

**Testing**
- [ ] Full regression testing (all pages)
- [ ] Payment flow (real + test cards)
- [ ] Admin workflows
- [ ] Mobile responsiveness
- [ ] Email delivery

**Deployment**
- [ ] Stripe live keys setup
- [ ] Production env variables
- [ ] Database backups
- [ ] Monitoring/alerts
- [ ] Launch announcement

**Estimated**: 3-4 weeks
**Release**: End of July 2026

---

## v1.1.0 (Post v1.0) — Advanced Features

- [ ] Dark mode complete
- [ ] Organizer tools (analytics, bulk messaging)
- [ ] Creator verification (manual review)
- [ ] Advanced filters (by rating, availability, etc.)
- [ ] CSV export (for organizers)
- [ ] Rate limiting on API
- [ ] Monitoring dashboard

**Timeline**: August 2026

---

## v2.0.0 (Long-term) — Mini-Boutique

- [ ] Creator shop (sell digital products/presets)
- [ ] Commission structure (Nexart takes %)
- [ ] Affiliate program
- [ ] Creator coaching/mentorship
- [ ] Event sponsorship listings

**Timeline**: Q4 2026+

---

## Priority Order

1. **v0.9.0** — Polish & quick wins (easy to gain momentum)
2. **v1.0.0** — Stripe + Admin (blockers for paid launch)
3. **v1.1.0** — UX improvements
4. **v2.0.0** — Expansion (only if v1.0 successful)

---

## How to Track Progress

1. Update version in `package.json`
2. Run `npm run bump-version X.Y.Z`
3. Update this ROADMAP.md with completed items (checkmarks)
4. Tag release on GitHub: `git tag -a vX.Y.Z -m "Release X.Y.Z"`
5. Deploy to production

Example:
```bash
npm run bump-version 0.9.0
# ... make changes ...
# ... test ...
git tag -a v0.9.0 -m "v0.9.0: Foundation polishing"
./deploy.sh
```

---

## Notes

- **v0.9.0**: Make existing features bulletproof
- **v1.0.0**: Add money (Stripe) + control (Admin)
- **v1.1.0+**: Expansion & features

Each version should be shippable and tested before moving to next.
