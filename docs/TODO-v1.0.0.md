# v1.0.0 — Production Ready + Payments

**Timeline**: 3-4 weeks
**Target**: End of July 2026
**Blocker for**: Public launch, paid features

---

## CRITICAL: Stripe Integration (10-15 days)

### Stripe Account Setup (1 day)
- [ ] Create Stripe account
- [ ] Verify business information
- [ ] Get test API keys
- [ ] Get live API keys (ready for later)
- [ ] Enable Stripe webhooks
- [ ] Add webhook signing secret
- [ ] Test webhook delivery

### Environment Setup (30 min)
- [ ] Add `STRIPE_SECRET_KEY` to `.env.local`
- [ ] Add `NEXT_PUBLIC_STRIPE_KEY` to `.env` (publishable)
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.local`
- [ ] Verify env vars load correctly

### Checkout Flow Backend (4-5 days)

#### `/api/stripe/checkout`
- [ ] Create Stripe Checkout Session
- [ ] Validate credit package (10/50/100)
- [ ] Calculate price (convert to cents)
- [ ] Set success/cancel URLs
- [ ] Add metadata (userId, package, date)
- [ ] Return session ID to frontend
- [ ] Error handling (invalid package, etc.)

#### `/api/stripe/portal`
- [ ] Redirect to Stripe billing portal
- [ ] Return portal URL
- [ ] Auth check (user must be logged in)
- [ ] Handle errors (no customer ID)

#### `/api/stripe/webhook`
- [ ] Verify webhook signature
- [ ] Handle `checkout.session.completed`
  - Get session details from Stripe
  - Extract userId from metadata
  - Add credits to user balance
  - Create payment record in DB
  - Send confirmation email
- [ ] Handle `charge.refunded`
  - Subtract credits from user balance
  - Send refund email
- [ ] Handle `charge.failed`
  - Notify user (optional)
  - Log error
- [ ] Return 200 to Stripe (acknowledge receipt)

### Frontend Checkout (2-3 days)

#### `/boutique` page refactor
- [ ] Show 3 credit packages (10/50/100)
- [ ] Display price clearly
- [ ] Show "value" badge (best value on largest)
- [ ] Describe what credits are for
- [ ] Features list per package (optional)

#### Checkout Modal/Page
- [ ] Display selected package details
- [ ] Email field (pre-filled if logged in)
- [ ] Stripe Card Element (iframe)
- [ ] "Complete Purchase" button
- [ ] Handle loading state (disable button)
- [ ] Show errors (invalid card, etc.)
- [ ] Success message + redirect to dashboard

#### Purchase History Page
- [ ] List all past purchases
- [ ] Date, amount, status (completed/failed)
- [ ] Receipt download (optional)
- [ ] Refund request button (optional)
- [ ] Paginate if many (>10 transactions)

#### Credits Display
- [ ] Show current balance in navbar
- [ ] Update balance in real-time after purchase
- [ ] Show credits in user dashboard
- [ ] Warn when balance low (<5 credits)

### Testing (2 days)

#### Test Cards (Stripe docs)
- [ ] Successful payment: `4242 4242 4242 4242`
- [ ] Card declined: `4000 0000 0000 0002`
- [ ] Expired: `4000 0000 0000 0069`
- [ ] 3D Secure: `4000 0025 0000 3155`

#### Flows to Test
- [ ] [ ] Buy credits (success)
- [ ] [ ] Buy credits (card declined) → error message
- [ ] [ ] Buy credits (incomplete) → error message
- [ ] [ ] Webhook delivery (check test mode events)
- [ ] [ ] Credits added to account after payment
- [ ] [ ] Purchase history shows transactions
- [ ] [ ] Confirm emails sent
- [ ] [ ] Refund reduces balance

#### Edge Cases
- [ ] [ ] User cancels checkout mid-flow
- [ ] [ ] Webhook fails (retry) → credits still added
- [ ] [ ] Duplicate webhook (idempotent) → no double-add
- [ ] [ ] Network timeout during payment
- [ ] [ ] Multiple purchases in short time
- [ ] [ ] Browser back button after success

---

## Admin Panel (8-10 days)

### Backend Routes (3-4 days)

#### Reports Management
- [ ] `GET /api/admin/reports` — list all (paginated)
  - Filter by status (open/resolved)
  - Sort by date/priority
  - Return: id, reporter, reported user, reason, date, status
- [ ] `POST /api/admin/reports/:id/resolve` — mark resolved
  - Require admin role
  - Update status in DB
  - Log resolution action
- [ ] `DELETE /api/admin/reports/:id` — archive report
  - Soft delete (keep history)

#### User Management
- [ ] `GET /api/admin/users` — list all (search/filter)
  - Search by email/name
  - Filter by role (creator/organizer/admin)
  - Filter by status (active/banned)
  - Pagination + sort
- [ ] `POST /api/admin/users/:id/ban` — ban user
  - Set `banned_at` timestamp
  - Disable login (check in auth middleware)
  - Send notification email (optional)
- [ ] `POST /api/admin/users/:id/unban` — unban user
  - Clear `banned_at`
  - Send welcome-back email
- [ ] `GET /api/admin/users/:id` — view user profile
  - All personal info
  - Recent activity
  - Reports against them
  - Verification status

#### Events Moderation
- [ ] `GET /api/admin/events` — list all flagged events
  - Filter by status (published/flagged/rejected)
  - Sort by date
- [ ] `POST /api/admin/events/:id/approve` — publish event
- [ ] `POST /api/admin/events/:id/reject` — reject + notify organizer
  - Require reason
  - Send email with reason

#### Analytics
- [ ] `GET /api/admin/stats` — dashboard metrics
  - Total users (creators/organizers)
  - Total events (live/past)
  - Total revenue (this month/all time)
  - New signups (this week)
  - Active users (this week)

### Frontend Admin Panel (4-5 days)

#### `/admin` Layout
- [ ] Sidebar navigation (reports/users/events/analytics)
- [ ] Only accessible if `role === 'admin'`
- [ ] Logout button in header
- [ ] Responsive (mobile-friendly)

#### Reports Tab
- [ ] List view (table + cards)
- [ ] Click to see details
- [ ] "Resolve" button (mark as handled)
- [ ] Delete button (archive)
- [ ] Filter by status (open/resolved)

#### Users Tab
- [ ] Search by email/name
- [ ] Filter by role/status
- [ ] User card: avatar + name + email + role + status
- [ ] Click to open user modal
- [ ] Modal: full profile + ban/unban button
- [ ] Confirm dialog before ban

#### Events Tab
- [ ] List view (pending moderation)
- [ ] Event card: title + organizer + date + status
- [ ] Click to preview (read-only)
- [ ] Approve/Reject buttons
- [ ] Reason field for rejection

#### Analytics Dashboard
- [ ] KPI cards (users, events, revenue)
- [ ] Chart: new users over time (this month)
- [ ] Chart: revenue over time (this month)
- [ ] Recent activity feed
- [ ] Alerts (high report volume, etc.)

### RLS Policies (1-2 days)

#### Admin-only Access
- [ ] Create `is_admin()` function in Supabase
- [ ] Add policy: `admin_policies.sql` migration
- [ ] Policies for each table:
  - `reports` → admins can READ/UPDATE/DELETE
  - `users` (profiles) → admins can READ/UPDATE
  - `events` → admins can UPDATE status
  - `audit_log` → admins can READ

#### Testing
- [ ] [ ] Admin can access `/admin`
- [ ] [ ] Non-admin gets 403 on `/admin` routes
- [ ] [ ] Non-admin data not visible to others
- [ ] [ ] Audit log records admin actions

---

## Emails & Notifications (5-7 days)

### Email Provider Setup (1 day)
- [ ] Choose provider (SendGrid, Resend, MailerSend)
- [ ] Create account + verify domain
- [ ] Get API key
- [ ] Add to `.env.local`
- [ ] Test email delivery

### Email Templates (3-4 days)

#### Payment Confirmation
- [ ] Subject: "Merci pour votre achat de crédits Nexart"
- [ ] Thank you message
- [ ] Package purchased (10/50/100 credits)
- [ ] Amount charged
- [ ] Transaction ID
- [ ] Link to dashboard
- [ ] Support link

#### Event Acceptance
- [ ] Subject: "Votre candidature a été acceptée!"
- [ ] Event title + date
- [ ] Organizer name
- [ ] Next steps (confirm attendance, view event)
- [ ] Message from organizer (if sent)
- [ ] Link to event details

#### Event Rejection
- [ ] Subject: "Mise à jour sur votre candidature"
- [ ] Event title
- [ ] Reason for rejection (if provided)
- [ ] Encouragement to apply to other events
- [ ] Search for similar events link

#### New Message Notification
- [ ] Subject: "Vous avez un nouveau message de [organizer]"
- [ ] Preview of message (first 100 chars)
- [ ] Link to conversation
- [ ] Event title (if applicable)

#### Weekly Digest (Optional)
- [ ] New events in area
- [ ] Upcoming applications due
- [ ] New followers/reviews
- [ ] Unsubscribe link

### Email Integration (1-2 days)

#### Backend Email Function
- [ ] Create `sendEmail()` utility
- [ ] Template rendering (Handlebars or similar)
- [ ] Error handling (retry, logging)
- [ ] Rate limiting (max 5 per second)

#### Trigger Points
- [ ] After successful Stripe payment → send confirmation
- [ ] When application accepted → send to creator
- [ ] When application rejected → send to creator
- [ ] When new message → send to recipient
- [ ] Weekly digest (cron job, optional)

#### Testing
- [ ] [ ] Send test emails manually
- [ ] [ ] Verify formatting (HTML + plain text)
- [ ] [ ] Test links (unsubscribe, CTA buttons)
- [ ] [ ] Check spam folder (SPF/DKIM setup)

---

## QA & Launch Prep (5 days)

### Full Regression Testing (2 days)
- [ ] Auth flow (login/register/forgot password/2FA)
- [ ] Creator workflows (profile/portfolio/applications)
- [ ] Organizer workflows (event creation/management)
- [ ] Messaging (send/receive/notifications)
- [ ] Reviews (create/display/filtering)
- [ ] Admin workflows (ban/reports/analytics)
- [ ] Payment flow (checkout/confirmation/history)
- [ ] Mobile (all pages responsive)
- [ ] Accessibility (keyboard nav, screen reader)

### Performance Testing (1 day)
- [ ] Lighthouse audit (target: >90 on all metrics)
- [ ] Load time <3s on slow 3G
- [ ] Database query optimization (no N+1)
- [ ] Image optimization (WebP, lazy loading)
- [ ] Bundle size check

### Security Review (1 day)
- [ ] No hardcoded secrets in code
- [ ] `.env.local` in `.gitignore`
- [ ] HTTPS only (production)
- [ ] CORS headers correct
- [ ] SQL injection prevention (Supabase parameterized)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF tokens (if needed)
- [ ] Rate limiting on API

### Production Deployment (1 day)

#### Pre-Deploy
- [ ] Backup production database
- [ ] Create staging snapshot
- [ ] Test on staging (full payment flow with Stripe test keys)
- [ ] Verify all env vars (STRIPE_SECRET_KEY, etc.)
- [ ] Check Stripe webhook is registered

#### Deploy
- [ ] Bump version to 1.0.0
- [ ] Tag release: `git tag -a v1.0.0 -m "v1.0.0: Production ready + Stripe payments"`
- [ ] Run `npm run build` (verify no errors)
- [ ] Run `./deploy.sh`
- [ ] Verify deployment (check HTTP status + logs)

#### Post-Deploy (24h monitoring)
- [ ] Monitor error logs (Sentry/logging)
- [ ] Monitor Stripe webhooks (all successful)
- [ ] Test payment flow on production
- [ ] Monitor database performance
- [ ] Alert on errors/failures
- [ ] Track user feedback (support email)

---

## Launch Announcement

- [ ] Update home page with "Now accepting payments!"
- [ ] Send email to all users: "Nexart v1.0 is live"
- [ ] Social media posts (Twitter/Instagram)
- [ ] Blog post (optional)
- [ ] Update documentation/FAQ

---

## Definition of Done (v1.0.0)

- [x] Stripe integration complete + tested
- [x] Admin panel complete + tested
- [x] Email notifications working
- [x] All regression tests pass
- [x] Performance targets met (Lighthouse >90)
- [x] Security review complete
- [x] Production deployment successful
- [x] 24h post-launch monitoring complete

---

## Time Breakdown

| Component | Time | Owner |
|-----------|------|-------|
| Stripe Setup | 10-15d | Claude |
| Admin Panel | 8-10d | Claude |
| Emails | 5-7d | Claude |
| QA & Deploy | 5d | Claude |
| **Total** | **3-4w** | |

---

## Rollback Plan

If critical issue found post-launch:
1. Revert to v0.9.0 (`git revert v1.0.0`)
2. Deploy previous version
3. Disable Stripe temporarily (show "maintenance" message)
4. Fix issue in dev
5. Re-test on staging
6. Re-deploy to production

**Estimated rollback time**: 30 minutes
