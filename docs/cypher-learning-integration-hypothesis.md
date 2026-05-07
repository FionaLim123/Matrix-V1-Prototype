# Cypher Learning LMS — Integration Hypothesis
## How the Matrix+ Intelligence Layer connects to Cypher

**Status:** Research-based hypothesis with confidence levels. Not yet validated with Cypher.  
**Source:** Cypher Learning public documentation, API 3.0 developer docs, webhook support hub.  
**Purpose:** To clarify what the prototype demonstrates vs. what will need Cypher access to build for real.

---

## What Matrix+ currently uses Cypher for

Matrix+ courses and student enrolments live on Cypher Learning (their LMS). As far as is known, Matrix is currently using Cypher for:
- Course content delivery (video lessons, written materials)
- Student enrolments and roster management
- Quiz/assessment delivery (16 types: quizzes, essays, debates, etc.)
- Basic completion tracking

**The opportunity:** Cypher offers significantly more capability than Matrix currently uses. The Matrix+ Intelligence Layer is not a replacement for Cypher — it is a proprietary guidance and recovery layer built *on top of* Cypher, reading from its data and surfacing personalised coaching within or alongside the existing platform.

---

## What Cypher Learning exposes (confirmed from documentation)

### API 3.0
- RESTful API using OpenAPI 3.0 spec
- Supports GET, POST, PATCH, DELETE
- Authentication via API key (header or query param)
- Entities: courses, users, learners (enrolments), groups, certifications
- Advanced filtering (eq, neq, gt, gte, lt, lte, in, contains)
- Pagination, batch operations with async job tracking
- `$include` parameter for fetching related records in one call

### Webhooks
- **Currently limited to course completion events only**
- Payload includes: learner info (name, email, ID), course data (title, score, dates, status)
- Must be configured via Admin Tools → Integrations → Webhooks (requires Cypher rep approval)
- Documentation notes they "will continue to expand functionality" beyond course completions

### Integration Standards
- **Content:** SCORM, xAPI (Tin Can), LTI 1.3, cmi5, H5P, IMS Common Cartridge
- **Auth:** OAuth 2.0, SAML 2.0, Google Workspace SSO, Microsoft Entra, LDAP, Auth0
- **xAPI** in particular tracks granular learning events (lesson opens, time-on-task, video progress, quiz attempts) if the content is instrumented to emit xAPI statements

### CYPHER Connect (higher tier)
- Prebuilt connectors for Salesforce, Workday, enterprise systems
- Automated workflows and data sync — "automation at scale"
- The extent to which it can push actions *back to learners* is not clearly documented

---

## How the prototype layers map to Cypher — with confidence levels

### Layer 1: Signal Detection (Coach Engine)

**What the prototype needs:** lesson completion status, quiz scores, last activity date, lesson open events.

**What Cypher can provide:**

| Signal | How | Confidence |
|--------|-----|------------|
| Lesson completion status | API 3.0 enrolment/completion endpoint | **High (85%)** — documented |
| Quiz/assessment scores | API 3.0 (score tracking documented, endpoint specifics unclear) | **Medium (60%)** — documented at high level, granularity uncertain |
| Last activity date | API 3.0 or xAPI via LRS | **Medium-High (70%)** — likely available but needs validation |
| Lesson open / video watch events | xAPI (if content is instrumented) | **Medium (55%)** — requires xAPI instrumented content; depends on Cypher's content creation tools |
| Quiz attempt-level data (not just final score) | xAPI only | **Low-Medium (45%)** — not clear from API 3.0; xAPI would cover this if used |

**Key question for Cypher:** "Can we access per-lesson activity events (opens, video watch %, quiz attempts) via API 3.0 or an LRS/xAPI endpoint?"

**How to apply:** The coach engine can likely be powered by Cypher data for completion and score signals. Video watch percentage and lesson-open events are less certain and may require xAPI instrumentation — which is a content authoring decision, not just an API integration.

---

### Layer 2: Student Guidance Surface (CoachCard / Today's Focus)

**What the prototype needs:** A UI surface embedded within the student's Cypher course experience that shows personalised coaching.

**Options:**

| Approach | How | Confidence |
|----------|-----|------------|
| LTI 1.3 tool launch — embed coaching widget inside Cypher course pages | Cypher supports LTI 1.3; the coaching app launches as an embedded tool | **High (80%)** — LTI is well-documented on Cypher |
| Custom HTML content block | Embed an iframe or script within a Cypher lesson page via HTML block | **High (85%)** — lower-tech but works; Cypher allows HTML content |
| Cypher theme/plugin customisation | Add coaching UI as a persistent sidebar/banner via theme customisation | **Low (30%)** — unclear how deep theme customisation goes; likely limited |

**Best path:** LTI 1.3 embedding. The Matrix+ coaching widget runs as an external tool; Cypher launches it via LTI within the course shell. The coaching widget reads student data from the Matrix+ database (which is synced from Cypher via API). This keeps the intelligence layer fully under Matrix's control.

---

### Layer 3: Staff Dashboard (MatrixStaffDashboard)

**What the prototype needs:** A separate interface for teachers/tutors to see cohort-level risk and student signals.

**Integration requirement:** The staff dashboard just needs a data feed from Cypher. It doesn't need to live inside Cypher at all — it's a standalone Matrix-owned tool.

| Task | How | Confidence |
|------|-----|------------|
| Read student roster | API 3.0 users/learners endpoint | **High (90%)** |
| Read completion + score data | API 3.0 enrolment data | **High (85%)** |
| Receive real-time events (e.g. student just went inactive) | Cypher webhooks (currently course-completion only) | **Low (25%)** — webhooks are very limited today |
| Scheduled sync (daily/hourly pull) | API 3.0 batch operations | **High (85%)** — batch pull is documented and straightforward |

**Most practical path for now:** Scheduled API sync (e.g. hourly) from Cypher into the Matrix+ database. Real-time event streaming via webhooks can be added when Cypher expands webhook scope.

---

### Layer 4: Staff-to-Student Actions (nudges, check-ins)

**What the prototype implies:** Staff can act on signals by sending a nudge or initiating a check-in.

**Reality today:** Cypher does NOT currently support sending in-platform notifications to students via API. Staff actions that originate outside Cypher would need to be delivered through:
- Email (outside Cypher)
- Matrix+ internal messaging (if it exists)
- A future Cypher feature (they are expanding webhooks)

| Action | How | Confidence |
|--------|-----|------------|
| Trigger an in-platform notification to a student | Not possible via API today | **Very Low (15%)** |
| Send an email nudge from Matrix+ system | External email, not via Cypher | **High (90%)** — entirely within Matrix's control |
| Log a staff action/note against a student | Write to Matrix+ database (not Cypher) | **High (90%)** |
| Push a custom coaching message into the student's course view | LTI/iframe approach could show it on next login | **Medium (55%)** — possible via LTI if the coaching widget reads from Matrix+ DB |

**How to apply:** For the demo and V1, staff actions (nudge, check-in) should be framed as *triggering a communication* (email, phone) rather than claiming in-platform push capability. The system surfaces the signal and suggests the action; the delivery channel is the teacher, not the platform.

---

### Layer 5: Ask Max and Discussion Forum

**What the prototype shows:** Ask Max (AI study buddy) and Discussion Forum as "If you need help" options on the student coaching card.

| Feature | How | Confidence |
|---------|-----|------------|
| Discussion Forum | Likely already in Cypher (native LMS feature) | **High (80%)** — standard LMS feature |
| Ask Max (Matrix AI) | Likely an LTI tool or external chatbot embedded in Cypher | **Medium (60%)** — depends on how Matrix has built it; LTI or iframe embed is plausible |

**Key question for Matrix:** "How is Ask Max currently delivered? If it's already an LTI tool or embedded tool in Cypher, we can link to it directly from the coaching card."

---

## What this prototype is NOT duplicating

The prototype does not try to replicate:
- Cypher's course content delivery (video player, quiz engine, written content)
- Cypher's enrolment management or user authentication
- Cypher's native discussion forum
- Any existing Cypher analytics/reporting dashboards

The prototype demonstrates the **proprietary intelligence layer** that Matrix+ needs to build:
- Signal detection (reading Cypher data + applying Matrix's pedagogical rules)
- Personalised student guidance copy (warm, tailored to the student's specific state)
- Staff triage surface (cohort risk + suggested actions)
- Micro-check intervention during video consumption (new concept, embedded within lessons)

This layer is what makes Matrix+ distinctively Matrix — it encodes 25 years of pedagogical experience into automated, scalable coaching.

---

## Key questions to ask Cypher

1. **Activity data granularity:** "Can we access lesson-level events (video watch %, lesson open timestamps, quiz attempt data — not just final scores) via API 3.0? Or do we need xAPI/Tin Can?"

2. **Webhook expansion timeline:** "Are you planning to expand webhook event types beyond course completion? What's the roadmap?"

3. **LTI tool hosting:** "If we build a coaching widget as an LTI 1.3 tool, can we embed it as a persistent sidebar or banner within every course page? Or is it only launched from specific content items?"

4. **Custom notifications:** "Is there any API endpoint for sending in-platform notifications or messages to a specific learner?"

5. **xAPI LRS access:** "Do you host an LRS? Can we query xAPI statements via API for our learners?"

---

---

## Kaltura and in-video interactive capability

**Research status:** Live web search conducted 2026-05-07.

### What was found

| Finding | Confidence |
|---------|------------|
| Cypher Learning officially integrates with Kaltura (listed on integrations page + marketplace) | **Confirmed in official docs** |
| Kaltura is positioned as Cypher's primary video-hosting integration (alongside Panopto as an alternative) | **Confirmed in official docs** |
| Kaltura Interactive Video *itself* supports in-video quizzes, hotspots, and branching at timestamps | **Confirmed — Kaltura product docs** |
| Cypher Learning explicitly enables Kaltura Interactive Video features (in-video quiz at timestamps) | **Not found** — no documentation confirms this is enabled within Cypher's Kaltura integration |
| H5P is also supported by Cypher, and H5P includes an interactive video content type with quiz overlays | **Confirmed — both Cypher and H5P docs** |

### What this means for the micro-check feature

The prototype's "Moment 2" — a quiz check-in that appears during the video lesson — requires the video player to support interactive overlays. There are **two plausible paths** through Cypher:

**Path A: Kaltura Interactive Video**
- If Cypher's Kaltura integration exposes Kaltura's interactive video capabilities, in-video quizzes are technically achievable within the existing video infrastructure
- The integration may be limited to video hosting/playback only (most common LMS-Kaltura integrations are), in which case interactive features are not available without a deeper Kaltura API implementation
- **Verdict:** Plausible but unverified. Ask Cypher: "Does the Kaltura integration support Kaltura Interactive Video quiz overlays, or is it video hosting only?"

**Path B: H5P Interactive Video**
- H5P Interactive Video is a documented Cypher content type
- H5P supports in-video questions, hotspots, and custom overlays at specific timestamps — this is exactly the micro-check use case
- H5P content would need to be authored per lesson, but this is a content workflow question rather than a platform integration question
- **Verdict:** Higher confidence than Kaltura path. H5P is the more likely route to a real V1 micro-check.

### Recommended framing for demo/interview

Frame the micro-check as a concept enabled by existing Cypher infrastructure — specifically H5P or Kaltura Interactive Video. The prototype demonstrates *what the experience would feel like*; the actual delivery mechanism is an authoring/integration question to be resolved in V2.

Suggested language: *"Cypher Learning supports both H5P and Kaltura integration — both of which have interactive video capabilities. The prototype shows the experience we'd build; in V2 we'd instrument lessons with H5P overlays or Kaltura Interactive Video questions to surface these check-ins natively within the student's course view."*

### Questions to add to the Cypher conversation

6. **Interactive video capability:** "Does your Kaltura integration support Kaltura Interactive Video (in-video quiz overlays at timestamps)? Or is it limited to video hosting?"
7. **H5P interactive video in practice:** "Are any Matrix courses currently using H5P Interactive Video content? Can it be embedded within a standard Cypher lesson page?"

---

## Note on "5HP / 5-Hop Protocol"

Research found **no documentation** of "5HP" or "5-Hop Protocol" in Cypher Learning's public materials. This term may have been used in a sales/marketing context not yet published, may be internal terminology, or may have been misremembered from a different source. Treat as unverified — ask Cypher directly.
