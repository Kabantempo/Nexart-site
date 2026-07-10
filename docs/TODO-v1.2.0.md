# v1.2.0 — Organizer Power Tools

**Timeline**: 2-3 weeks
**Target**: September 2026
**Based on**: Feedback from Aenigma / Vocal Nexart

> **Source**: Organisatrice Aenigma (Salon Harry Potter) — feedback vocal sur besoins réels
> **Rationale**: Organisateurs actuellement utilisent Google Forms + Excel + Billetterie Web + Messenger. Besoin d'une solution centralisée "clé en main".

---

## P0: Centralized Exhibitor Dashboard (5-7 days)

### Problem Solved
Currently: Google Forms → manual Excel → Billetterie Web → cross-verification → 3× re-entry of data

### Solution: Single Source of Truth
- [ ] Applications form → auto-generate exhibitor table (no re-entry)
- [ ] Export to CSV/Excel with 1 click
- [ ] Status tracking (pending/approved/rejected/paid)
- [ ] Exhibitor info card: tables booked, grids needed, special requests, email, hotel accommodation

### Features
- [ ] Customizable form fields (organizer sets what info they need)
  - Basic: name, email, phone
  - Setup: how many tables, grid type, lighting needs
  - Special: accommodation needed?, dietary preferences, parking, accessibility
- [ ] Auto-generated table view (responsive, sortable, filterable)
- [ ] Batch actions (approve all, email all, export all)
- [ ] Sync with payment status (if exhibitor paid via Stripe)
- [ ] CSV export (to share with co-organizers, suppliers)

### Backend
- [ ] `event_exhibitor_responses` table (stores all form responses)
- [ ] `event_exhibitor_fields` table (organizer customizes form)
- [ ] Generate CSV export API endpoint
- [ ] Webhook: when payment confirmed, mark exhibitor as "paid"

### Frontend
- [ ] Event setup: "Customize exhibitor form" (drag-drop builder or checkboxes)
- [ ] Dashboard: "Exhibitors" tab with table view + filters
- [ ] Exhibitor card modal (view all info, edit, approve/reject, send message)
- [ ] Export button (CSV)
- [ ] Statistics: total applications, approval rate, pending responses

**Implementation**: 5-7 days (mostly data management + export)

---

## P1: Automatic Reminders + Waitlist System (3-5 days)

### Problem Solved
Exhibitors apply, go silent, then cancel 3 weeks before event. Time wasted following up.

### Solution
- [ ] Exhibitor checklist: applied → confirmed → paid → ready
- [ ] Auto-email after X days if status hasn't advanced (configurable: 7d, 14d, 21d)
- [ ] Waitlist: if exhibitor cancels, auto-notify next applicant
- [ ] Dashboard: shows "overdue" exhibitors (highlight red)

### Features
- [ ] Reminder template (editable by organizer)
- [ ] Escalation: if no response after 2nd reminder → auto-reject + move to waitlist
- [ ] Waitlist auto-ranking (FIFO or organizer-sorted)
- [ ] Notification to waitlist: "A spot opened! Reserve now?" (link to reserve)
- [ ] Email tracking: see who opened, clicked

### Backend
- [ ] Cron job: daily check for overdue applicants
- [ ] Send reminder emails via Resend
- [ ] Waitlist queue logic (FIFO + notify)
- [ ] Configurable delays (admin sets: 7d/14d/21d before escalation)

### Frontend
- [ ] Event settings: configure reminder timing
- [ ] Exhibitor status timeline (applied → confirmed → paid)
- [ ] Waitlist view (see queue order)
- [ ] Exhibitor receives auto-notification (email + push)

**Implementation**: 3-5 days (mostly automation + Edge Functions crons)

---

## P1: Smart Auto-Responder + Filter Out-of-Scope (3-5 days)

### Problem Solved
Receive ~50+ applications for wrong themes (barbes à papa for HP salon). Time lost saying "no thanks" repeatedly.

### Solution
- [ ] Define event themes/disciplines during event creation
- [ ] Application form auto-filters based on applicant's disciplines
- [ ] If not matching → show warning ("Your disciplines don't match this event")
- [ ] Auto-response templates: "Sorry, we're looking for X"
- [ ] Common questions FAQ (auto-answers basic stuff)

### Features
- [ ] Event setup: select target themes (ex: "Harry Potter", "Fantasy", "Cosplay")
- [ ] Exhibitor profile has disciplines (from their creator profile)
- [ ] On application: if disciplines don't match → soft warning but allow apply
- [ ] Organizer dashboard: "Out-of-scope applications" filter
- [ ] Auto-send rejection email with personalized message
- [ ] FAQ system: organizer pre-writes Q&A → auto-reply to common questions
  - Q: "Do you have spots left?" → A: Auto-answers based on availability
  - Q: "Can I bring a food truck?" → A: Organizer's custom answer

### Backend
- [ ] Theme matching logic (compare disciplines against event themes)
- [ ] FAQ template system (store Q&A, auto-trigger based on keywords)
- [ ] Auto-response router (if out-of-scope → send rejection template)

### Frontend
- [ ] Event setup: "Target disciplines" (multi-select)
- [ ] FAQ editor (add/edit/delete FAQs)
- [ ] Application: show "recommendation" if disciplines don't match
- [ ] Dashboard: separate tab for "Out-of-scope" applications
- [ ] Bulk action: "Reject all out-of-scope + send template"

**Implementation**: 3-5 days (keyword matching + template system)

---

## P1: Team Collaboration Space (Team version of Notion-lite) (5-7 days)

### Problem Solved
Organizer + co-organizers + volunteers use Messenger + Facebook. Notifications missed, tasks forgotten, work duplicated.

### Solution
- [ ] Shared project hub per event
- [ ] Task delegation with ownership
- [ ] Weekly check-in reminders ("What did you do this week?")
- [ ] Task auto-escalation if not updated in X days
- [ ] Shared docs/media folder

### Features
- [ ] Tasks tab
  - Task creation (title, description, assignee, deadline)
  - Status tracking (not started / in progress / done)
  - Comments per task
  - Due date with reminder 3 days before
- [ ] Team members can see all tasks
- [ ] Weekly check-in: "Update status of your tasks" (email prompt every Monday)
- [ ] Auto-escalation: if task not updated for 7 days → reassign to co-organizer + notify
- [ ] Shared docs (upload PDFs, meeting notes, budgets)
- [ ] Activity feed (who did what, when)

### Backend
- [ ] `event_tasks` table (event_id, creator_id, assignee_id, title, description, status, deadline, updated_at)
- [ ] `task_comments` table
- [ ] `event_team` table (event_id, user_id, role, joined_at)
- [ ] Cron: Monday morning send check-in reminder to all team members
- [ ] Cron: if task not updated 7d → send escalation email + reassign

### Frontend
- [ ] Event: "Team" tab (see members, invite co-organizer via email)
- [ ] "Tasks" subtab (list view, kanban view optional)
- [ ] Create task modal (title, assignee, deadline)
- [ ] Task card: view details, add comments, update status
- [ ] "Docs" subtab (folder structure, upload)
- [ ] Activity log (recent changes)
- [ ] Shared calendar (deadlines, key dates)

**Implementation**: 5-7 days (primarily CRUD + notifications)

---

## P2: Event Checklist + AI-Generated Documents (5-7 days)

### Problem Solved
Between Aenigma 1 & 2, steps were forgotten (city permits, com timeline). New team members don't know the playbook.

### Solution
- [ ] Dynamic checklist auto-generated based on event type (HP salon vs. artisanat permanent)
- [ ] Pre-filled steps: administrative, logistics, comms, day-before, day-of
- [ ] AI-generated draft documents (mairie permit application, press release, sponsor pitch)
- [ ] Checkpoints: mark as done, assign to team member

### Features
- [ ] Event creation: select event type → auto-generate checklist template
- [ ] Checklist categories:
  - Admin (mairie permit, insurance, liability)
  - Logistics (setup timeline, supplier contacts, parking)
  - Comms (press release, social media calendar, email templates)
  - Ops (volunteer schedule, day-of runsheet)
- [ ] Each item: description, deadline, assignee, resources (attached doc)
- [ ] Document templates: click "Generate permit request" → Claude generates draft based on event details (location, dates, expected crowd, theme)
- [ ] Organizer edits draft, then can export/print/send

### Backend
- [ ] Checklist templates (static per event type, stored in DB)
- [ ] Claude API integration for document generation
- [ ] Prompt engineering: "You are a French event organizer. Generate a permit application for [event details]"
- [ ] Store generated docs in Supabase Storage

### Frontend
- [ ] Event setup: select event type → checklist auto-loaded
- [ ] Checklist view: list of items, check off as done
- [ ] "Generate document" button for each relevant item
- [ ] Document preview + edit modal
- [ ] Export/download button (PDF)
- [ ] Assignment indicator (who owns this task)

**Implementation**: 5-7 days (checklist template system + Claude API calls)

---

## P2: Marketing Suite (Comms Planning + Media Database) (7-10 days)

### Problem Solved
Rebuild marketing strategy from scratch each event. No visibility on costs (radio spots, cinema ads, posters). New team members lost.

### Solution
- [ ] AI generates press release from event details
- [ ] Database of local media (press, radio, cinema, billboards) by region
- [ ] Marketing calendar with recommended deadlines (J-60: launch posters, J-30: PR, etc.)
- [ ] Pricing reference (ballpark cost for radio, cinema, online ads)
- [ ] Comms task checklist

### Features
- [ ] Marketing plan generation
  - Input: event date, expected audience, theme, budget
  - Output: AI-generated press release + draft social content
- [ ] Media database (by region/department)
  - Presse locale (newspapers, online news)
  - Radios locales (frequency, audience, cost per 10s spot)
  - Cinémas (advertising costs)
  - Réseaux sociaux (estimated cost per platform)
  - Affichage (poster costs, placement options)
  - Influenceurs/partenaires
- [ ] Marketing calendar
  - Auto-backplan from event date (J-90 to J+0)
  - Recommended milestones (press release date, social calendar start, etc.)
- [ ] Pricing reference sheet
  - Radio: "10-second spot = €150-300"
  - Cinema: "€50-200 per screen per week"
  - Online ads (Facebook, Instagram): "€5-20 per day budget"
  - Posters: "€0.50-2.00 per poster (design + print + distribution)"
- [ ] Task delegation: assign someone to "contact radios" by J-45

### Backend
- [ ] `media_database` table (city, region, name, type, email, phone, notes, pricing)
- [ ] Claude API: press release generation
- [ ] Marketing calendar template (editable)
- [ ] Seed media data (can be user-contributed or scraped)

### Frontend
- [ ] "Marketing" tab on event dashboard
- [ ] "Generate press release" → Claude generates, organizer edits + exports
- [ ] Media search (filter by region, type, budget)
- [ ] Media contact list (CSV export)
- [ ] Calendar view (timeline with recommended actions)
- [ ] Pricing reference table
- [ ] Checklist: who's responsible for what, deadlines

**Implementation**: 7-10 days (media database is the bulk; Claude prompts = fast)

---

## P3: Volunteer Scheduling Tool (6-8 days)

### Problem Solved
Scheduling volunteers is painful. Match availability to shifts. Volunteers complain about times. Hard to track coverage.

### Solution
- [ ] Input: event timeline, activities (setup, welcome desk, bar, cleanup), staff needed per shift
- [ ] Volunteer availability matrix (who's free when)
- [ ] Automatic scheduling algorithm (match availability to shifts)
- [ ] Proposal view: organizer approves or adjusts
- [ ] Notifications to volunteers of their schedule

### Features
- [ ] Activity planning
  - Define activities (setup, entrance, bar, raffle, cleanup)
  - Duration, required staff count per activity
- [ ] Volunteer signup (collect availability)
  - Calendar: pick available dates/times
  - Preferences: which activities interested in
- [ ] Scheduling algorithm
  - Greedy matching: high-preference volunteers → preferred shifts first
  - Generate schedule proposal
- [ ] Review & adjust
  - Organizer sees proposed schedule
  - Swap volunteers if needed
  - Reassign to different activities
- [ ] Send schedule to volunteers
  - Email: "You're scheduled for X on Y date from A to B"
  - Calendar export (ICS file)
- [ ] Day-of checklist (who checked in, who's missing)

### Backend
- [ ] `volunteer_availability` table (volunteer_id, event_id, available_times[])
- [ ] `volunteer_assignments` table (volunteer_id, event_id, activity_id, start_time, end_time)
- [ ] Scheduling algorithm (can start simple: greedy matching)

### Frontend
- [ ] Event: "Volunteers" tab
- [ ] Setup: define activities (duration, staff needed)
- [ ] Availability form (volunteer signup link)
- [ ] Schedule view (Gantt or calendar)
- [ ] Generate schedule button
- [ ] Adjust/swap UI
- [ ] Send assignments button
- [ ] Day-of attendance tracker

**Implementation**: 6-8 days (algorithm = most complex part)

---

## Definition of Done (v1.2.0)

- [x] Centralized exhibitor dashboard live
- [x] Auto-reminders + waitlist working
- [x] Auto-responder + filtering deployed
- [x] Team collaboration space functional
- [x] Event checklist + AI docs generated
- [x] Marketing suite live (press release + media DB)
- [x] Volunteer scheduler (scheduling algorithm working)
- [x] All tested with organizers (real-world feedback)

---

## Time Breakdown

| Feature | Time | Owner |
|---------|------|-------|
| Exhibitor Dashboard | 5-7d | Claude |
| Auto-reminders + Waitlist | 3-5d | Claude |
| Auto-responder + Filter | 3-5d | Claude |
| Team Collaboration | 5-7d | Claude |
| Event Checklist + AI Docs | 5-7d | Claude |
| Marketing Suite | 7-10d | Claude |
| Volunteer Scheduler | 6-8d | Claude |
| **Total** | **2-3w** | |

---

## User Testing Plan

- [ ] Invite 3-5 real organizers (like Aenigma) to beta test
- [ ] Collect feedback on each feature
- [ ] Iterate on UX (organizers are busy — make things FAST)
- [ ] Video tutorials for each feature
- [ ] Support email/chat during launch week

---

## Why This Version Matters

Organizers are the backbone of Nexart. If we don't solve their pain points (Google Forms hell, volunteer chaos, comms scattered), they'll never fully adopt Nexart. v1.2.0 is the "organizer renaissance" — turning them into power users.

