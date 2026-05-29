# Teacher Intervention Loop — Build Decisions & History

*Status: Built and type-clean as of May 2026.*  
*These decisions were made collaboratively across multiple sessions and are intended as a permanent reference.*  
*Last updated: May 2026 — reflects full dashboard + detail page redesign (Draft 7 state).*

---

## What was built

A coordinator-operated intervention workflow layered onto the existing staff dashboard. When the coach engine classifies a student as needing support or a nudge, the system now:

1. Drafts the appropriate outreach (student email, parent email) automatically
2. Surfaces it on the staff drill-down for review and approval (Needs Support tier)
3. Sends nudge-tier emails automatically without requiring human approval
4. Provides a batch review and send flow for support-tier interventions
5. Logs all actions to Supabase for persistence, history, and demo reset
6. Auto-resets the dashboard every Monday morning via a weekly window filter

---

## Key design decisions

### Who operates the system — CX/coordinator, not teachers

The dashboard is operated by a CX or coordinator role, not by individual subject teachers. Teachers are named in the email sign-offs (Ms Jessica Luong) because they have the student relationship, but they are not managing the tool or reviewing the queue.

**Why:** Teacher intervention rate is the hardest thing to reliably guarantee in any system like this. Putting the workflow in a dedicated coordinator role removes dependency on individual teacher time management. The teacher brings the relationship; the coordinator closes the loop.

**Implication for the demo:** Always say "coordinator" or "student success team" when describing who is acting, not "teacher." Teachers are mentioned in the context of the email sign-off and escalation only.

---

### Cohort tier naming

- "Needs Intervention" → **"Needs Support"** (less clinical, better for staff and parent communication)
- "Needs Nudge" → unchanged
- "On Track" → unchanged

---

### Two distinct intervention tiers with different automation levels

**Needs Support (e.g. Drew)** — requires human review before anything is sent
- Coordinator opens the student drill-down
- Sees email drafts (student + parent) ready to review and edit inline
- Explicitly adds student to batch ("+ Add to batch")
- No email goes out until coordinator confirms via "Send all N emails" in the batch modal

**Needs Nudge (e.g. Jordan, Emery)** — emails go out automatically; coordinator can preview or override
- System shows "✓ Auto-sending" amber badge in the Action column
- Coordinator can open drill-down and see the drafts inline
- Can edit and add a personalised version to batch if needed ("Save & add to batch")
- No action required from coordinator; default is automated

**On Track** — parent digest only; no action card, no student email

**Why this tiering:** High-stakes outreach (disengaged students) always needs a human in the loop before affecting a family. Low-stakes nudges (minor gaps, passive consumption) can be automated because they're warm, non-alarming, and appropriate for the entire cohort in that state. The coordinator's time is reserved for the cases that actually need judgement.

---

### Dashboard design — current state (Draft 7)

**Column structure:** Momentum | Student | Current signal | Last activity | Follow up | Action

- **Momentum:** Colored semibold label — red "Needs Support", amber "Needs Nudge", green "On Track"
- **Student:** Bold full name
- **Current signal:** Student-specific signal text (profile-driven, different for each student), max 15rem width
- **Last activity:** Relative date (e.g. "7 days ago"), muted
- **Follow up:** Staff-suggested action text (profile-driven, different for each student), max 12rem width
- **Action:** (see below)

**Sort order:** Needs Support → Needs Nudge → On Track. Within Needs Support, sorted ascending by last activity timestamp (longest-disengaged student first, most urgent at top). Other tiers: alphabetical by name.

**Action column states by tier:**

*Needs Support:*
- Default: "Review →" pill button (maroon filled, rounded-full, whitespace-nowrap)
- After added to batch: "✓ In batch" (emerald-600, links to detail page)
- After batch sent: "✓ Email sent" (emerald-700, links to detail page)
- After escalation only: "✓ Teacher notified" (gray-400, links to detail page)

*Needs Nudge:*
- Default: "✓ Auto-sending" amber badge pill + "Review draft →" text link below
- After coordinator adds custom version: "✓ Custom batch" (emerald-600)

*On Track:*
- "View →" gray text link (no action required)

**Removed from dashboard (vs earlier version):**
- "Support →" / "Nudge →" link labels replaced by the new Action column states
- Persistence indicator (week count) moved to detail page Zone 1
- Generic "View details" link replaced by action-specific states

---

### Weekly window filter (auto-reset every Monday)

All action-state functions in `lib/intervention-logs.ts` filter to the current Mon–Sun window using `isThisWeek(loggedAt)`. This means:

- The dashboard automatically shows a clean slate every Monday morning
- The coordinator can also come back mid-week — the window is Mon–now, not just today
- Historical functions (`getMostRecentLog`, `getPriorWeeksInTier`) are left unfiltered so Duration and Last week fields on the detail page retain full history
- The weekly reset is purely UI-state — all intervention_logs rows are preserved in Supabase

**Implementation:** `getCurrentWeekStart()` returns Monday 00:00:00 local time. `isThisWeek(loggedAt: string)` returns `new Date(loggedAt) >= getCurrentWeekStart()`.

**Seed rows:** All seed rows use `is_seed = true` and are dated 7 days prior, so they always appear in the historical view but never in the current-week action state.

---

### "Email sent" state vs "In batch" state

Two distinct post-action states in the dashboard:

- **"In batch"** — coordinator has added the student but batch hasn't been sent yet (`emails_sent_at` is null, `isThisWeek` action log exists)
- **"Email sent"** — batch has been sent (`emails_sent_at` is not null, `isThisWeek` action log exists)

`hasSentSupportEmail()` checks `emails_sent_at !== null AND isThisWeek`. `inBatch` is computed as `!emailSent && hasNonSeedActionType(...)` so the two states are mutually exclusive and the dashboard correctly progresses from "Review →" → "In batch" → "Email sent".

---

### Staff drill-down architecture — current state (Draft 7)

The student detail page (`?student=<uuid>`) uses three zones stacked vertically:

**Zone 1 — `StaffStudentContextBanner` (info card)**
- "← Back to cohort" link (respects cohort filter in URL)
- White card (`rounded-lg bg-white shadow-sm`), max-w-[42rem] matching action card
- Single `<dl>` with `grid-cols-[auto_1fr]` — all values aligned on the same column
- **Group 1** — current situation context:
  - Student (bold 20px, first name + last name)
  - Current state (cohort label: "Needs Support" / "Needs Nudge" / "On Track")
  - Duration (number of weeks in this tier, from seed + non-seed log count; "1st week", "2nd week", etc.)
  - Last week (most recent historical log summary, or "No prior action")
- Hairline separator (`col-span-2 border-t border-gray-100`)
- **Group 2** — action context:
  - Current signal (profile-driven signal text)
  - Follow up (staff-suggested action text)

**Zone 2 — `TeacherActionPanel` (action card)**

Three states (see below). max-w-[42rem], no cohort badge (Zone 1 covers it).

**Zone 3 — Student lesson view**
- "What [Student] is seeing right now" heading
- For demo personas (Drew, Jordan, Emery): "See [Name]'s full experience →" link navigating to `?persona={slug}`
- `MatrixStudentLessonsCore` component (unchanged from baseline)

---

### `TeacherActionPanel` states — current state (Draft 7)

**On Track state:**
- "No action needed this week" heading (14px semibold gray-900)
- "Parent digest sending automatically — nothing else required." (13px gray-500)
- Parent email preview card only (no student email, no escalate button)

**Needs Nudge state:**
- "✉ Automated email sending to [FirstName] and their parent this week." (auto-send message)
- Student email card and parent email card always visible (no toggle)
- Both email cards have inline Edit capability → shows textarea with Done button
- "Save & add to batch" button appears only when coordinator has made edits (editedStudentBody or editedParentBody is non-null)
- After adding: "✓ Custom version added to batch" confirmation text

**Needs Support state:**
- Student email card and parent email card always visible (no toggle)
- Both email cards have inline Edit capability
- Primary CTA: "+ Add [FirstName] to batch" (maroon filled button) → on success: "✓ Added to batch"
- Secondary action: "Notify teacher directly" (gray text link) → on success: "✓ Teacher notified by email"

**Email editing UX:**
- `EmailPreviewCard` shows subject line by default, "Preview" toggle to expand body
- When expanded: body shown in `<pre>` with "Edit" text link below
- Clicking Edit shows textarea + "Done" button
- "Done" calls `onBodyChange(newText)` which updates parent state
- On submit, `rebuildDraft(original, editedBody)` reconstructs the full draft with original subject + edited body

**Escalate → "Notify teacher directly" rename:**
- Renamed to reduce ambiguity — "escalate" implies severity, "notify" is the accurate action
- Technically: logs an `escalated` action_type to intervention_logs, no email goes out in the demo
- In a real system this would trigger a Slack/email notification to the subject teacher; kept simple for V1

---

### Batch email modal — current state (Draft 7)

1. Coordinator reviews Needs Support students and clicks "+ Add to batch" for each
2. "Review & Send (N)" button appears in the nav (only visible when count > 0)
3. Clicking it opens confirmation modal with:
   - Title: "Ready to send"
   - Subtitle: "{N} students — {N*2} emails queued"
   - Student list: each row shows name + "— 2 emails" + optional "Preview ▼" toggle
   - Expanding a student row shows student email subject line and parent email subject line
   - Footer note: "Nudge emails and parent digests for all other students send automatically."
4. Coordinator clicks "Send all N emails" → `markBatchSent()` server action fires
5. Modal shows "✓ Sent successfully" and closes after 2 seconds
6. Dashboard refreshes — "In batch" states update to "Email sent"

**Why expand-to-preview rather than show all subjects:** Showing all subjects by default was too much visual clutter. The expandable row lets the coordinator do a final spot-check on specific students before confirming send.

---

### Email drafts — approved copy for demo personas

The three demo personas (Drew, Jordan, Emery) use exact approved copy that overrides the generic generator. All emails are signed "Ms Jessica Luong, Year 11 Maths Advanced" (student emails) or "Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education" (parent emails).

Generic emails for other students in the cohort use the same sign-off format.

#### Drew Patel — Needs Support (disengagement)

**Student email:**
> Hi Drew, I noticed you haven't logged into Matrix+ for a little while and wanted to check in. It happens — life gets busy, and sometimes it's hard to find the rhythm again.
>
> The good news is you're in a solid position with your work. When you're ready, picking up from where you left off is simpler than it might feel right now.
>
> If there's anything on your mind, just reply to this email.
>
> — Ms Jessica Luong, Year 11 Maths Advanced

**Parent email:**
> Dear Drew's parent, I wanted to reach out with a brief update on Drew's recent engagement with Matrix+ for Year 11 Maths Advanced.
>
> Drew has been doing solid work this term, but we've noticed he hasn't logged in recently. This isn't unusual — students sometimes need a nudge to re-establish their study rhythm at this point in the term.
>
> Our student success team will be in touch with you directly over the next day or two. In the meantime, a quiet check-in at home can make all the difference.
>
> — Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education

#### Jordan Blake — Needs Nudge (concept gap)

**Student email (automated):**
> Hi Jordan, I can see you've been putting in the effort in Calculus 2 — attempting the checkpoint is exactly the right approach. Your recent result tells me some of the concepts might benefit from a bit more consolidation before you move forward, which is completely normal at this stage.
>
> When you next log in, Today's Focus will show you exactly where to start — it's already pointing you to the right place.
>
> — Ms Jessica Luong, Year 11 Maths Advanced

**Parent email (automated):**
> Dear Jordan's parent, here's a brief update on Jordan's progress in Year 11 Maths Advanced.
>
> Jordan has been engaging with the course and attempting her checkpoints — which is exactly the right approach. Her most recent Calculus 2 result was slightly below the expected level, which tells us some consolidation would help before she moves forward.
>
> No alarm needed — this is exactly the kind of early signal we watch for. A quiet check-in at home about how study is going is always helpful.
>
> — Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education

#### Emery Chen — Needs Nudge (passive consumption)

**Student email (automated):**
> Hi Emery, great work keeping up with the lesson videos in Calculus 1 — you've been consistent and that matters. The next step is to test your understanding with the checkpoint quiz.
>
> It's not about getting everything right — it's about finding out what's landed and what might need a second look. Give it a go when you're ready. You're in a good position.
>
> — Ms Jessica Luong, Year 11 Maths Advanced

**Parent email (automated):**
> Dear Emery's parent, a quick update on Emery's recent activity in Year 11 Maths Advanced.
>
> Emery has been consistently watching the lesson videos — a great habit. The next step in her learning path is to complete the checkpoint quiz for Calculus 1, which will confirm the concepts have landed before she moves on. Matrix+ has already sent her a gentle reminder.
>
> If you get a chance to check in at home about how her study is going, that always helps.
>
> — Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education

---

### Supabase schema changes

**Migration: `supabase/migration_teacher_intervention.sql`**
- Added `parent_email text` column to `students` table
- Created `intervention_logs` table with: `id`, `student_id`, `action_type` (`support | nudge | on_track | escalated`), `cohort_tier`, `student_email_draft`, `parent_email_draft`, `emails_sent_at`, `logged_at`, `is_seed`

**Seed: `supabase/seed_intervention_logs.sql`**
- Parent emails added for all 13 demo students
- Pre-seeded rows (all `is_seed = true`, dated 7 days ago):
  - **Drew:** `escalated` (teacher was notified last week → "2nd week" persistence)
  - **Jordan:** `nudge` (nudge was sent last week → "2nd week" persistence)
  - **Morgan Lee:** `support` (support email was sent last week → "2nd week" persistence)

---

### Demo safety

**Demo reset:** `GET /v1-prototype?reset=demo`  
Only active when `DEMO_RESET_ENABLED=true` in environment.  
Only clears non-seed `intervention_logs` rows. All seed rows (`is_seed=true`) are protected.

**Weekly reset:** The dashboard auto-resets every Monday morning via the `isThisWeek` filter — no manual reset needed for the weekly rhythm. The demo reset button is only needed to fully clear a demo session.

---

## Files changed / created

| File | Change |
|------|--------|
| `components/matrix-v1/TeacherActionPanel.tsx` | Three-state action card: On Track ("No action needed"), Needs Nudge (always-visible emails + inline edit + Save & add to batch), Needs Support (always-visible emails + inline edit + Add to batch + Notify teacher directly). No cohort badge. |
| `components/matrix-v1/StaffStudentContextBanner.tsx` | Full rewrite as two-act info card: white card, single dl grid, two groups (Student/Current state/Duration/Last week + Current signal/Follow up) separated by hairline. Back link. |
| `components/matrix-v1/MatrixStaffDashboard.tsx` | New column structure (Momentum/Student/Current signal/Last activity/Follow up/Action). New Action column states. Needs Support sort by last activity. Removed persistence indicator. |
| `components/emery-passive-lessons-overview/EmeryFlow.tsx` | Batch modal with expandable student rows + subject preview. Scroll-to-top on student navigation (detailScrollRef). Extended PendingBatchStudent type. |
| `components/emery-passive-lessons-overview/EmeryPrototypeNav.tsx` | "Review & Send (N)" button visible only when count > 0 |
| `app/v1-prototype/page.tsx` | extractSubject() for batch modal subjects; pendingBatchStudents includes studentSubject/parentSubject; backHref computed from cohort param; personaSlug lookup; Zone 3 "See [Name]'s full experience →" link for demo personas |
| `lib/intervention-logs.ts` | Weekly window filter on all action-state functions (countPendingBatch, getPendingBatchStudentIds, hasNonSeedLog, hasNonSeedActionType, hasSentSupportEmail). Historical functions (getMostRecentLog, getPriorWeeksInTier) unfiltered. New hasSentSupportEmail function. |
| `lib/matrix-v1-staff-model.ts` | lastActivityTs added to RowDraft for sort-by-last-activity within Needs Support. Demo persona email overrides (Drew/Jordan/Emery). Generic sign-off updated to Ms Jessica Luong. |
| `lib/intervention-actions.ts` | New — server actions: logIntervention, markBatchSent, resetDemoInterventions |
| `lib/dashboard-data.ts` | interventionLogs added to DashboardData; loads parent_email from students |
| `lib/recommendations.ts` | parent_email added to DbStudent type |
| `supabase/migration_teacher_intervention.sql` | New — migration script (run once, already applied) |
| `supabase/seed_intervention_logs.sql` | New — seed script (run once, already applied) |
