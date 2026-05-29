# Matrix+ Implementation Architecture — V1 and V1.5

*Status: Working document — built from design review sessions, Cypher research, ChatGPT/Timo context, and prototype code review.*  
*Last updated: May 2026.*

---

## How to read this document

The prototype demonstrates two distinct capability layers. Each has its own dependencies and realistic scope:

- **V1** — Student coaching surface + staff cohort dashboard (read-only visibility layer)
- **V1.5** — Teacher/CX intervention loop layered on top (email outreach + coordinator workflow)

These are intentionally separate because V1 can go live and deliver value before V1.5 is built. V1.5 depends on V1 being stable.

---

# System Roles — What Each Platform Is Responsible For

Matrix's infrastructure spans four distinct systems. Understanding what each owns — and does not own — is essential for designing the intelligence layer correctly and avoiding building the wrong thing in the wrong place.

---

## Salesforce (CRM and Operational Backbone)

**What Salesforce owns:**
- Student and parent/guardian contact records (name, email, phone)
- Enrolment records — who is enrolled in which course, at which campus, for which term
- Family/account structure — student ↔ parent relationship, household billing unit
- Payment and billing history
- Communication history — all outbound contact with students and parents logged here
- CX/customer service queues and case management
- Renewal and retention workflows (or where they should live)
- Marketing automation and campaign tracking
- Operational task management for CX staff

**What Salesforce does NOT own:**
- Learning activity (this is Cypher's domain)
- Academic records or grades (this is RIO's domain)
- Content delivery (Cypher)
- Coaching logic or intervention intelligence (Matrix+ layer)

**Role in the Matrix+ intelligence layer:**
- Source of truth for parent contact data (V1.5 email delivery depends on this)
- Destination for intervention logs in V2 (coordinator actions written back as CRM activities)
- Long-term: renewal risk flags surfaced in Salesforce from the intelligence layer
- Current status: mid-transformation, ~6 months remaining on integration work (per Timo). Do not build V1 or V1.5 dependencies on Salesforce API. Use CSV exports for parent data in V1.5.

---

## RIO SIS (Student Information System)

**What RIO owns:**
- Formal student records — the authoritative academic identity of each student
- Course and class registrations — which student is in which subject cohort
- Timetables and attendance records
- Cohort structures — year level, subject groupings, class sections
- Teacher allocations — which teacher is responsible for which class/cohort
- Academic administration — term dates, assessment calendars
- Campus vs online-only enrolment type — **critical for the coaching engine**
- Student lifecycle management (enrolment through to graduation/departure)

**What RIO does NOT own:**
- Learning activity or engagement (Cypher)
- Communication history (Salesforce)
- Coaching intelligence (Matrix+ layer)

**Role in the Matrix+ intelligence layer:**
- Source of truth for "which students are in scope" — cohort membership, year level, subject
- Source of enrolment type (online-only vs campus supplementary) — needed to scope the inactivity rule correctly
- Source of teacher allocation — which teacher's name goes in the email sign-off
- Current status: integration approach unclear. For V1, use a manual export or Cypher enrolment data as a proxy. For V2, RIO API integration is the right path.

---

## Cypher Learning / NEO LMS (Learning Management System)

**What Cypher owns:**
- Course content delivery — video lessons, written materials, lesson structure
- Student enrolments and roster management within courses
- Quiz and assessment delivery (16 assessment types)
- Completion tracking — lesson status, quiz scores
- Learning activity events — lesson opens, completions, quiz attempts, timestamps
- Ask Max (AI tutoring/help capability) — currently delivered within or alongside Cypher
- Discussion forums (native LMS feature)
- Student login and authentication within Matrix+
- xAPI/SCORM support for granular learning telemetry (if content is instrumented)
- LTI 1.3 support for embedding external tools within course pages

**What Cypher does NOT own:**
- Coaching intelligence or personalised guidance (Matrix+ layer)
- Communication workflows (Salesforce)
- Academic administration (RIO)
- Parent contacts (Salesforce)

**Role in the Matrix+ intelligence layer:**
- Primary data source for the coaching engine — lesson completion, quiz scores, last activity, lesson-open events
- Host for the student-facing coaching widget (via iframe or LTI embedding in V1, LTI in V2)
- Current status: significantly underutilised at Matrix. APIs available but not fully activated. Webhooks limited to course completion events only. xAPI available if content is instrumented. Signal quality needs validation via test API call before V1 engineering begins.

**Key unknowns to resolve with Cypher:**
1. Does the API expose per-lesson events (lesson_opened, video watch %) or only final completion status?
2. What is the field name and format for quiz scores — percentage or raw?
3. Does Cypher allow iframe embeds from external domains within course pages?
4. What is the roadmap for expanding webhook event types beyond course completion?
5. Does the Kaltura integration support interactive video overlays (in-video quiz capability)?

---

## Matrix+ Intelligence Layer (What We Are Building)

**What the Matrix+ layer owns:**
- Signal interpretation — reading Cypher data and applying Matrix's pedagogical rules to classify student state
- Coaching engine — rules-based classification (inactivity → needs support, low score → needs nudge, incomplete → nudge, on track → progression)
- Student-facing guidance surface — personalised "Today's Focus" coaching card, warm re-entry prompts, topic summaries
- Staff cohort dashboard — triage view showing which students need support, nudge, or are on track, with signal and suggested action per student
- Coordinator intervention workflow — email draft generation, batch review, send confirmation, action logging (V1.5)
- Automated email orchestration — Needs Nudge automated sends, On Track parent digests, Monday cron trigger (V1.5)
- Intervention history and logging — source of truth for what actions were taken, when, and by whom
- Demo reset and safe testing infrastructure

**What the Matrix+ layer does NOT own (and should not try to own):**
- Content delivery (stays in Cypher)
- Student authentication (stays in Cypher/Salesforce)
- Formal academic records (stays in RIO)
- CRM and communication history at scale (belongs in Salesforce — synced in V2)
- Billing or enrolment management (stays in Salesforce)

**The layer's role in the system:**
The Matrix+ intelligence layer is not a replacement for any of the above systems. It is an orchestration and interpretation layer that sits above them — reading signals from Cypher, contextualising them with enrolment data from RIO/Salesforce, and surfacing personalised guidance to students and actionable intelligence to coordinators. It encodes Matrix's 25 years of pedagogical experience into automated, scalable coaching that none of the underlying platforms can provide on their own.

---

## System Interaction Map

```
RIO SIS ──────────────────────────────────────────────┐
(who is in scope, cohort, teacher, enrolment type)     │
                                                        ▼
Cypher LMS ──────────── API sync ──────► Matrix+ Intelligence Layer
(lessons, quizzes,    (hourly/daily)    (coach engine, dashboard,
 scores, events,                         student coaching card,
 completions)                            intervention workflow)
                                                        │
Salesforce ────────────────────────────────────────────┘
(parent emails,                          │        │
 student contacts)                       ▼        ▼
                                     Student   Coordinator
                                     coaching  dashboard +
                                     card      email batch
                                     (Cypher   (email service
                                      iframe)   → parent/student)
```

---

# V1: Student Coaching Surface + Staff Dashboard

## What V1 is

V1 is a read-only intelligence layer. It reads signals from Cypher (lesson completion, quiz scores, activity events), runs a rules-based classification engine, and surfaces two things:

1. **Student-facing:** A personalised "Today's Focus" coaching card showing the student their most important next action — warm, specific, and responsive to their actual state (re-engaging, struggling with a concept, passive consumption, on track)

2. **Staff-facing:** A cohort dashboard showing the coordinator which students are On Track, Needs Nudge, or Needs Support — with the specific signal behind each classification and a suggested follow-up action

No emails send in V1. No actions are logged. It is pure visibility — but that visibility is genuinely new for Matrix and immediately useful.

## The coach engine — how it works

The engine is fully rules-based (no AI required in V1):

- **Priority 1 — Inactivity:** No meaningful activity for 7+ days → Needs Support
- **Priority 2 — Weak topic:** Quiz score below 70% → Needs Support (severe) or Needs Nudge (moderate)
- **Priority 3 — Incomplete lesson:** Lesson opened but not completed → Needs Nudge
- **Priority 4 — Strong next step:** On Track with clear progression available

These four rules, applied in order, produce the cohort classification and the coaching card copy. The logic is in `lib/coach.ts` — already built and tested.

## V1 dependency map

### 1. Cypher data sync — the core dependency

**What the coach engine needs from Cypher:**

| Signal | Coach Engine Use | Cypher API Confidence |
|--------|-----------------|----------------------|
| Lesson completion status | Priority 3 (incomplete lesson) | High (85%) |
| Quiz/checkpoint scores | Priority 2 (weak topic) | Medium (60%) — documented at high level, field names need validation |
| Last activity timestamp | Priority 1 (7-day inactivity) | Medium-high (70%) |
| Lesson opened events | Priority 3 + last activity | Medium (55%) — depends on event logging in Cypher |

**The key unknown:** Cypher's API exposes data in its own schema. The coach engine expects it in a specific format (`DbEvent`, `DbProgress`, `DbLesson` types defined in `lib/recommendations.ts`). The mapping exercise — "what does Cypher call a lesson_opened event?" — could be trivial or could reveal gaps. This needs to be done before anything else.

**V1 approach:** Scheduled sync job (hourly pull via Cypher API 3.0) that maps Cypher's response into the Matrix+ database schema. Not real-time — scheduled sync is high-confidence, real-time webhooks are not viable yet.

**Pre-condition:** Cypher API key obtained. Matrix IT or Timo to request from Cypher account manager.

---

### 2. Online vs campus student scoping

**The problem:** The 7-day inactivity rule misfires on campus students. A student who attends physical classes has no obligation to log into Matrix+ every week — their inactivity is expected, not a risk signal. Classifying them as Needs Support would flood the dashboard with false positives.

**V1 approach:** Scope V1 to online-only enrolled students only. This eliminates the false positive problem entirely. Enrolment type (online vs campus supplementary) is likely in Salesforce or RIO — for V1, a simple manual flag in the Matrix+ database (set at the start of each term) is sufficient.

**Pre-condition:** Confirm which students in the pilot cohort are online-only. Operations/admin task, not engineering.

---

### 3. Student-facing coaching surface — embedding in Cypher

**The problem:** The coaching widget needs to appear where students already are — inside their Cypher course. It can't require students to log into a separate tool.

**Options:**

| Approach | How | Difficulty | Confidence |
|----------|-----|------------|------------|
| HTML content block in Cypher | Embed an iframe pointing to the Matrix+ coaching widget inside a Cypher lesson page | Low | High (85%) — lower-tech but works today |
| LTI 1.3 tool | Matrix+ coaching widget launches as an LTI external tool within Cypher | Medium | High (80%) — Cypher supports LTI 1.3 |
| Cypher theme customisation | Persistent sidebar/banner across all pages | High | Low (30%) — unclear how deep Cypher allows customisation |

**V1 recommendation:** Start with an HTML iframe embed. It works today, requires no special Cypher configuration beyond a content block, and can be placed at the top of a lesson page or as a standalone "Today's Focus" lesson item. LTI can be implemented in V2 for a cleaner integration.

**What this means:** The coaching widget URL needs to be accessible from within Cypher (HTTPS, same origin if needed). Timo's team needs to confirm whether Cypher allows iframes from external domains.

---

### 4. Staff dashboard — auth and hosting

**The problem:** The demo runs on a public URL with no authentication. A production dashboard with student data needs to be access-controlled.

**V1 approach:**
- Short-term: Vercel password protection (configured in Vercel dashboard, 5 minutes)
- Proper: Matrix SSO — connect to Google Workspace or Microsoft via OAuth. Timo's team needs to provide the OAuth client credentials; engineering wires it up

**Hosting:** Move from personal Vercel account to Matrix-owned Vercel account (or Matrix's own hosting). Requires Timo's team to provision.

---

### 5. Data model mapping — the biggest unknown

This is the V1 task that cannot be assessed from outside. The coach engine is built and working. The question is whether Cypher's API output maps cleanly to what the engine expects.

Specifically:
- Does Cypher have an `events` concept (lesson_opened, lesson_completed as distinct event types)? Or does it only expose a final completion status?
- What is the field name for quiz score? Is it a percentage or raw score?
- Is last activity a field on the enrolment record, or does it need to be derived from event timestamps?

Until someone (Timo's team or Cypher account manager) runs a test API call and shares the response shape, this is unknown. It could be a 2-hour mapping exercise or a 2-week discovery.

**Pre-condition:** Test API call to Cypher for a real cohort's data before any other V1 engineering begins.

---

## V1 pre-conditions summary

| Pre-condition | Owner | Difficulty |
|---------------|-------|------------|
| Cypher API key obtained | Timo / Cypher account manager | Low |
| Test API call run and response shape documented | Timo's dev / Fiona | Low-Medium |
| Online-only students identified for pilot cohort | Operations | Low |
| Dashboard moved to Matrix-owned hosting | Timo's team | Low |
| Staff dashboard SSO or password protection | Engineering | Low-Medium |
| Cypher iframe embedding confirmed (external domain allowed) | Timo / Cypher | Low |

---

## V1 resourcing model

**What Fiona can do (with Claude):**
- Cypher API data mapping — once the response shape is known, adapt the sync job to map Cypher's schema to the coach engine's expected types
- Scheduled sync job (hourly Cypher pull → Matrix+ database)
- Edge case handling for real data (nulls, missing scores, unexpected states)
- Staff dashboard updates and QA
- HTML iframe coaching widget hosting
- Testing against a real cohort's data

**What Timo's team needs to do:**
- Cypher API key and access (vendor relationship)
- Run the test API call and share the response shape
- Confirm whether Cypher allows iframe embeds from external domains
- Host the dashboard on Matrix-owned infrastructure
- Provide SSO credentials (Google/Microsoft OAuth client ID/secret)
- Decision on online vs campus scoping

**What's genuinely uncertain until the Cypher API is tested:**
- The data mapping exercise — could be simple, could reveal gaps (e.g. if Cypher doesn't expose lesson-open events at all, Priority 3 of the coach engine needs rethinking)
- Signal quality at scale — the demo uses controlled seed data. Real data will have edge cases

**Honest time estimate:** 4–8 weeks from Cypher API access being granted, assuming the data mapping is straightforward. The blockers are organisational (getting API access, getting the test call done), not engineering.

---

---

# V1.5: Teacher/CX Intervention Loop

## What V1.5 adds to V1

V1.5 makes the dashboard actionable. The coordinator no longer just sees who needs help — they can act on it:

- **Needs Support students:** Review AI-drafted emails, edit if needed, add to batch, send
- **Needs Nudge students:** Automated emails go out without coordinator action; coordinator can preview or override
- **On Track students:** Parent digest goes out automatically; no coordinator action required
- **Weekly rhythm:** Dashboard auto-resets every Monday; coordinator works through their queue once a week

Everything in V1.5 depends on V1 being stable first. The cohort classification, signal quality, and data pipeline must be working before the email loop is layered on top.

---

## V1.5 dependency map

### 1. Cypher data sync (inherited from V1)
Same as V1. Already a pre-condition.

---

### 2. Parent contact data

**Assumption (sound):** Matrix's enrolment form has a mandatory parent/guardian email field — required because parents are the paying party for under-18 students. This data is in Salesforce, linked to the student via a household Account or Relationship record in RIO SIS.

**V1.5 approach:** Do not wait for Salesforce API integration (currently mid-transformation, ~6 months remaining per Timo). A Salesforce admin can export `student_name | student_email | parent_email | course_enrolled` as a CSV in 10 minutes. Seed this into the Matrix+ database. Refresh at the start of each term.

**V1.5 pre-condition #1:** Salesforce admin exports parent email data for the pilot cohort. Data task, not engineering task.

---

### 3. Privacy/consent compliance

**What:** The enrolment form collects parent email for billing and administrative communication. Sending automated weekly academic progress emails is potentially a different use of that data than what was disclosed at collection.

**Under the Australian Privacy Act:** Using personal information for a purpose not disclosed at collection requires explicit consent or a reasonable expectation the use is related. Weekly automated emails about learning progress may or may not be covered by the original consent language — depends on exact form wording.

**V1.5 pre-condition #2:** Legal/compliance or operations reviews enrolment form consent language before V1.5 sends automated emails to parents. If the form doesn't cover this use, add one line. 5-minute fix — but must happen before the first automated send.

---

### 4. Email delivery infrastructure

**What:** An email sending service (SendGrid or Postmark recommended) to actually deliver emails. A Monday cron job (Vercel Cron, `0 7 * * 1`) to trigger automated Needs Nudge and On Track sends. The coordinator batch send fires on-demand when they click "Send all N emails."

**Difficulty:** Low. The API call itself is: POST to `/mail/send` with recipient, subject, body. That's the sending part.

**What requires a little care:**
- **SPF/DKIM on Matrix's sending domain** — ensures emails don't land in spam. One-time DNS configuration by IT. Half a day, well-documented by any email service provider
- **Bounce handling** — email services flag bounced addresses automatically; need a process to update Salesforce when a parent email bounces
- **Unsubscribe mechanism** — non-negotiable legal requirement (see below)

---

### 5. Unsubscribe / opt-out

**What:** Every automated email must include a one-click unsubscribe link under the Australian Spam Act 2003. This is not optional.

**Practical approach:** Both SendGrid and Postmark handle unsubscribe link generation and suppression list management automatically — configured once, they handle the compliance mechanics. The coordinator dashboard should surface which parents have opted out so the coordinator isn't puzzled why emails aren't delivering for certain students.

**Must be designed in from the start** — retrofitting it after launch is messy.

---

### 6. "Notify teacher directly" escalation

**What:** In the prototype, clicking "Notify teacher directly" logs an `escalated` action but nothing else happens. In production, the teacher needs to actually be notified.

**Option A (recommended for V1.5):** Send an email to the subject teacher's Matrix email address with student context, signal summary, and suggested action. No Salesforce dependency. Engineering is one additional email template + teacher email lookup. Coordinator gets confirmation; teacher gets it in their inbox.

**Option B (V2):** Create a task/case in Salesforce routed to the teacher. Better for CRM tracking but adds Salesforce integration dependency.

**Recommendation:** Option A for V1.5. Immediate, traceable, zero additional infrastructure. Salesforce task creation can be added when integration matures.

---

### 7. Email template governance

**What:** The email templates use a teacher's name (Ms Jessica Luong). If a teacher changes, every template referencing them is wrong. Academic leadership also needs to approve template copy before it goes out under a teacher's name.

**Technical approach:** Store templates in the database (not hardcoded in the application). A non-engineer can update them via a simple admin interface or direct DB edit — no code deployment required for a name change.

**Process:** Define template approval workflow before launch. Who approves new templates? Who is notified when a teacher changes? This is an operations/process decision, not a technical one.

**V1.5 pre-condition #3:** Academic team reviews and approves email template copy for the pilot cohort before V1.5 sends its first email.

---

### 8. Staff dashboard — auth and hosting (inherited from V1)
Same requirement as V1, now more urgent given emails contain parent data.

---

### 9. Salesforce write-back — not V1.5

Logging coordinator actions back to Salesforce as CRM activities is the logical V2 addition. Salesforce integration is mid-transformation (~6 months remaining). Intervention logs stay in the Matrix+ database as the source of truth for V1.5. Salesforce sync can be built when the integration matures.

---

## V1.5 pre-conditions summary

| Pre-condition | Owner | Difficulty | Blocking? |
|---------------|-------|------------|-----------|
| All V1 pre-conditions resolved | — | — | Yes |
| Salesforce parent email CSV export for pilot cohort | Salesforce admin | Very low | Yes |
| Enrolment form consent language reviewed | Legal/Ops | Very low | Yes |
| Academic team approves email templates | Head of Year + teacher | Process only | Yes |
| Email service account set up (SendGrid/Postmark) | Engineering | Low | Yes |
| SPF/DKIM configured on Matrix sending domain | IT | Low | Yes |
| Unsubscribe mechanism built | Engineering | Low | Yes |
| "Notify teacher" escalation email built | Engineering | Low | Yes |
| Templates stored in DB (not hardcoded) | Engineering | Low | Yes |

---

## What is NOT in V1.5

- Salesforce write-back (intervention logs stay in Matrix+ DB)
- Campus student context (online-only students only)
- xAPI instrumentation for granular video signals
- LTI embedding for student coaching widget (iFrame for V1.5)
- Real-time Cypher webhooks
- RIO API integration
- Ask Max wiring from the coaching card
- In-video micro-check (V2 — requires H5P content authoring)

---

## V1.5 resourcing model

**What Fiona can do (with Claude):**
- Email service API integration (SendGrid/Postmark)
- Monday cron job configuration on Vercel
- Unsubscribe link handling and suppression list
- "Notify teacher" escalation email template + send logic
- Email templates stored in database (simple admin update path)
- Bounce handling logic
- Full coordinator dashboard (already built — TeacherActionPanel, batch modal, intervention logging)
- QA of the full Monday→send→dashboard-refresh cycle

**What Timo's team needs to do:**
- SPF/DKIM on Matrix's sending domain (DNS access required)
- Confirm email sending domain (what address do these emails come from? `noreply@matrix.edu.au`?)
- Matrix-owned hosting and SSO (same as V1)
- Salesforce admin for parent email CSV
- IT sign-off on email volume and sending domain

**Organisational dependencies (not engineering):**
- Legal/compliance: enrolment form consent language
- Academic: email template approval (Head of Year + teacher named in sign-off)
- Operations: template update process ownership

**Honest time estimate:** 2–4 weeks of engineering work once V1 is stable and the pre-conditions are met. The organisational dependencies (consent language, template approval) are the likely timeline driver, not the code.

---

## Phasing summary

| Phase | Scope | Key unlock |
|-------|-------|------------|
| **V1 pilot** | Year 11 Maths Advanced online-only, read-only coaching + dashboard | Cypher API access + data mapping confirmed |
| **V1 scaled** | All online cohorts, student coaching + staff visibility | V1 pilot validated, signal quality confirmed |
| **V1.5 pilot** | Same cohort, coordinator intervention loop + automated emails | Parent email data + email service + consent confirmed |
| **V1.5 scaled** | All online cohorts, full intervention workflow | Salesforce parent email sync (not manual CSV) |
| **V2** | Campus students, Salesforce write-back, xAPI signals, LTI embedding, Ask Max wiring | RIO integration + Salesforce API + Cypher xAPI |
| **V3** | In-video micro-checks, proprietary telemetry, adaptive paths | H5P authoring + Matrix-owned signal layer |

---

## Measuring success

### V1 success metrics
1. **Dashboard accuracy:** Are the students the coordinator sees in Needs Support actually the right ones? Track coordinator agreement rate — do they open each student and take action, or skip past? High skip rate = signal quality problem
2. **Coordinator time to triage:** How long does it take to review the full cohort each week? Baseline this before V1.5 adds the email workflow
3. **Signal coverage:** What % of students have enough Cypher data for the engine to classify them? Students with no events or progress data fall into a gap

### V1.5 success metrics
1. **Re-engagement rate:** Do Needs Support students log back in within 7 days of receiving an email? Compare to a control group if possible — this is the core outcome metric
2. **Email open rate:** Are the emails actually being read? Low open rate suggests deliverability issues or the wrong send time
3. **Coordinator completion rate:** Does the coordinator get through their full Needs Support queue each Monday? Incomplete queue = workflow friction or too many students to action
4. **Parent response rate:** Do parents respond to digests or escalation emails? Early signal of whether the parent loop is building trust

---

## The strategic sequence

The right order is:

**First:** Validate that the Cypher data is good enough (V1 pilot). If the signal quality is poor, the coach engine misfires — and fixing that is upstream of everything else.

**Then:** Validate that the coordinator workflow makes sense in practice (V1.5 pilot). The prototype proves the concept; a real coordinator using it for a real term will reveal friction points the prototype didn't surface.

**Then:** Scale and build Salesforce integration, campus student context, and richer signals (V2).

The biggest risk is skipping the validation steps and going straight to scale. A rules-based engine built on poor-quality Cypher data, sent to parents via automated emails, damages trust very quickly. Start small, validate the signal, then expand.
