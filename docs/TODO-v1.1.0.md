# v1.1.0 — Advanced Features & Polish

**Timeline**: 2-3 weeks
**Target**: August 2026
**Dependencies**: v1.0.0 must be live first

---

## Dark Mode (5-7 days)

### Design System
- [ ] Define dark mode colors (inverse palette)
  - Background: `#0D0D0D`
  - Surface: `#1A1A1A`
  - Text: `#F5F3EF`
  - Accent: Keep same (indigo/red)
- [ ] Create color tokens file
- [ ] Test contrast ratios (WCAG AA minimum)

### Implementation
- [ ] Add dark mode toggle (settings page)
- [ ] Store preference (localStorage + Supabase)
- [ ] System preference detection (prefers-color-scheme)
- [ ] Apply theme to all pages
- [ ] Update Framer Motion animations (darker shadows)
- [ ] Test on all pages (visual regression)

### Components to Update
- [ ] Navbar/footer
- [ ] Cards + modals
- [ ] Forms + inputs
- [ ] Buttons + links
- [ ] Tables + lists
- [ ] Charts/graphs
- [ ] Code blocks (if any)

### Testing
- [ ] [ ] All pages in dark mode
- [ ] [ ] Contrast ratios WCAG AA
- [ ] [ ] Toggle switching smooth
- [ ] [ ] Preference persists on reload
- [ ] [ ] No flickering on page load

---

## Organizer Analytics Dashboard (4-5 days)

### Backend Routes
- [ ] `GET /api/organizer/analytics` — dashboard data
  - Total applications received
  - Acceptance rate (%)
  - Most popular event
  - Revenue from events (if payments)
  - Application trends (chart data)

### Frontend Dashboard
- [ ] `/organizer/analytics` route
- [ ] KPI cards (applications, acceptance rate, revenue)
- [ ] Chart: applications over time (30 days)
- [ ] Chart: acceptance rate by event
- [ ] List: top performing events
- [ ] Filter by date range
- [ ] Export to CSV (optional)

### Data Visualization
- [ ] Line chart (applications trend)
- [ ] Bar chart (applications per event)
- [ ] Pie chart (acceptance vs. rejection)
- [ ] Date range picker
- [ ] Loading states

---

## Creator Verification System (3-4 days)

### Manual Review Workflow
- [ ] Form: upload SIRET + business info
- [ ] Admin review (in admin panel)
- [ ] Approve/reject with feedback
- [ ] Creator notification email

### Frontend
- [ ] `/creator/verify` page
- [ ] SIRET input + validation
- [ ] Business name + address fields
- [ ] File upload (PDF/image)
- [ ] Terms acknowledgment
- [ ] Submit button
- [ ] Status indicator (pending/approved/rejected)

### Backend
- [ ] `POST /api/creator/verify` — submit verification
- [ ] Store SIRET + docs in Supabase Storage
- [ ] Create verification record (pending status)
- [ ] Admin can view + approve/reject

### UI/UX
- [ ] Green checkmark when verified
- [ ] Badge on profile ("Vérifié SIRET")
- [ ] Pending state (hourglass icon)
- [ ] Rejected state (red X + reason)

---

## Advanced Filters (2-3 days)

### Creator Discovery Page
- [ ] Multi-select disciplines (checkboxes)
- [ ] Availability: weekends only, specific dates, always
- [ ] Price range (if applicable)
- [ ] Rating filter (4+, 5 stars)
- [ ] Distance filter (with map integration)
- [ ] Verification status (verified only)
- [ ] New creators (joined <30 days)

### Save/Share Filters
- [ ] "Save this search" button
- [ ] Save to account (Supabase)
- [ ] "My searches" page
- [ ] Delete saved search
- [ ] Share search link (email/social)

### Performance
- [ ] Debounce filter changes (500ms)
- [ ] Pagination (10 per page)
- [ ] No more than 100 results in view
- [ ] Cache results (localStorage, 5 min)

---

## Bulk Messaging for Organizers (3-4 days)

### Feature
- [ ] Select multiple creators (checkboxes)
- [ ] Send message to all selected
- [ ] Use templates (save common messages)
- [ ] Schedule send (optional)
- [ ] Track delivery status

### Backend
- [ ] `POST /api/organizer/bulk-message` 
  - Validate creators (must have applied to event)
  - Create message for each
  - Send notifications

### Frontend
- [ ] Modal: select creators (list + checkboxes)
- [ ] Message editor
- [ ] Template selector dropdown
- [ ] Send button + loading state
- [ ] Confirmation ("X messages will be sent")
- [ ] Success message after send

---

## Creator Followers System (2-3 days)

### Database
- [ ] `creator_followers` table (user_id, creator_id, created_at)
- [ ] RLS: anyone can follow, but only view public list

### Backend
- [ ] `POST /api/creator/:id/follow` — add follower
- [ ] `DELETE /api/creator/:id/follow` — remove follower
- [ ] `GET /api/creator/:id/followers` — list followers

### Frontend
- [ ] Follow button on creator profile (toggle)
- [ ] Followers count + list modal
- [ ] "Following" list on dashboard
- [ ] Notifications when followed creator posts

---

## Rate Limiting on API (2 days)

### Implementation
- [ ] Add `express-rate-limit` middleware
- [ ] Limits:
  - Public endpoints: 100 req/hour
  - Auth endpoints: 10 req/hour (login/register)
  - API endpoints: 30 req/hour per user
- [ ] Return 429 status when exceeded
- [ ] Show "Try again later" message

### Testing
- [ ] Verify rate limits work
- [ ] Whitelist admin endpoints (no limits)
- [ ] Test reset after window

---

## Performance Monitoring (1-2 days)

### Setup
- [ ] Add Sentry or similar (error tracking)
- [ ] Monitor Core Web Vitals (LCP, FID, CLS)
- [ ] Database query monitoring
- [ ] Slowest pages alert
- [ ] Error rate monitoring

### Dashboard
- [ ] Simple monitoring page (admin only)
- [ ] Daily error count
- [ ] Performance metrics
- [ ] Recent errors list
- [ ] Alert thresholds

---

## Miscellaneous Polish (2-3 days)

- [ ] Fix any remaining bugs from v1.0.0
- [ ] Update documentation
- [ ] Improve error messages
- [ ] Add missing loading states
- [ ] Optimize images (WebP conversion)
- [ ] Remove unused dependencies
- [ ] Update README
- [ ] Improve TypeScript types

---

## Definition of Done (v1.1.0)

- [x] Dark mode complete + tested
- [x] Organizer analytics functional
- [x] Creator verification working
- [x] Advanced filters deployed
- [x] Bulk messaging working
- [x] Follower system live
- [x] Rate limiting active
- [x] Performance monitoring setup

---

## Time Breakdown

| Feature | Time | Owner |
|---------|------|-------|
| Dark Mode | 5-7d | Claude |
| Organizer Analytics | 4-5d | Claude |
| Creator Verification | 3-4d | Claude |
| Advanced Filters | 2-3d | Claude |
| Bulk Messaging | 3-4d | Claude |
| Followers System | 2-3d | Claude |
| Rate Limiting | 2d | Claude |
| Polish | 2-3d | Claude |
| **Total** | **2-3w** | |
