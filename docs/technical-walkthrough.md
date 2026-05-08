# Technical Walkthrough — Matrix+ Intelligence Prototype

## What this is

A working web application — not a mockup — that reads real student data from a database, applies coaching rules, and surfaces personalised guidance for both students and staff.

---

## Architecture

```
Browser → Next.js (App Router) → Coach Engine → Supabase (Postgres)
                                              ↘ Demo fallback (offline-safe)
```

- **Frontend:** Next.js 16 with React 19. Server components fetch data; client components handle interaction. Styled with Tailwind CSS.
- **Coach engine:** A deterministic rule engine (`lib/coach.ts`) that reads student progress and events and outputs one of four states: RETURNING, STRUGGLING, PASSIVE, ON_TRACK. No AI — pure logic that encodes pedagogical rules.
- **Data layer:** Supabase (Postgres) hosted in the cloud. The app queries it server-side on every page load. A seed script populates three demo students with realistic fictional data.

---

## Routes

| Route | What it shows | Data source |
|-------|---------------|-------------|
| `/v1-prototype` | Unified prototype — staff cohort table + 3 student persona views, switched via URL params | Supabase + fallback |
| `/v1-prototype?persona=emery` | Emery's student experience (PASSIVE state — quiz nudge) | Supabase + fallback |
| `/v1-prototype?persona=jordan` | Jordan's student experience (STRUGGLING — low quiz score) | Supabase + fallback |
| `/v1-prototype?persona=drew` | Drew's student experience (RETURNING — lapsed activity) | Supabase + fallback |
| `/v1-prototype?student=<uuid>` | Staff drill-down view for a specific student | Supabase |
| `/dashboard` | Earlier standalone staff view | Supabase |
| `/student` | Earlier standalone student view | Supabase |

---

## What is real vs what is mocked

| Layer | Source | Status |
|-------|--------|--------|
| Student roster, progress, quiz scores | Supabase — live query | **Real** |
| Event log (lesson opens, quiz submissions, video watch %) | Supabase — live query | **Real** |
| Coach engine rules and state classification | `lib/coach.ts` — deterministic logic | **Real** |
| Coaching copy (headlines, CTAs, signal lines) | `lib/todays-focus.ts` — generated from coach state | **Real** |
| Persona fallback (lesson/quiz names if DB is offline) | `lib/demo-personas.ts` — hardcoded strings | **Fallback only** |
| Emery's lesson list in the overview UI | `mock-data.ts` — hardcoded | **Mocked** |

The fallback exists because Supabase must be running locally to serve live data. At an interview without a network connection, the app degrades gracefully — coaching copy appears correctly; only the lesson list is static.

---

## How Supabase is used

Six tables: `students`, `courses`, `modules`, `lessons`, `student_progress`, `events`.

- `student_progress` is the core signal source: it stores completion status (`not_started` / `in_progress` / `completed`), last quiz score, and the timestamp of the last update. The coach engine reads this to determine each student's state.
- `events` is what separates this from a static mockup. It logs granular behaviour: `lesson_opened`, `quiz_submitted`, `score_received`, `video_watched_80_percent`, `coach_opened`, `recommendation_accepted`. This is the same kind of data a real learning analytics system would collect.
- All staff dashboard queries go through a single function: `loadDashboardData()` in `lib/dashboard-data.ts`. It loads all tables for the relevant students in one pass.
- Three demo students are seeded: Drew Patel (RETURNING), Jordan Blake (STRUGGLING), Emery Chen (PASSIVE). A `refresh_demo_timestamps.sql` script keeps their activity dates relative and demo-stable.

---

## How this connects to Cypher LMS later

Matrix currently delivers courses through Cypher Learning (their LMS). The intelligence layer is designed to sit on top of it, not replace it.

- **Data sync:** Cypher exposes a REST API (v3.0). Matrix+ would pull student progress, quiz scores, and completion events from Cypher on a schedule (hourly batch) into the Matrix+ database — the same Supabase schema used in this prototype.
- **Coach engine stays with Matrix:** Cypher is the data source; the intelligence layer stays entirely within Matrix's codebase. This is the proprietary asset — Cypher can't be configured to do this natively.
- **Embedding the coaching widget:** The coaching card (CoachCard) can be delivered inside Cypher course pages via LTI 1.3 — a standard embedding protocol that Cypher already supports. Students would see their personalised coaching guidance without leaving the Cypher interface.
- **In-video micro-checks:** The video check-in feature (Emery's "Moment 2") would be delivered via H5P Interactive Video or Kaltura Interactive Video — both are available within Cypher today and support in-video questions at specific timestamps.

---

## What needs hardening for production

**Infrastructure:**
- Authentication: there is none currently. Production would require student and staff login, likely via Cypher's SSO (OAuth 2.0 / SAML 2.0).
- Environment secrets: Supabase keys live in `.env.local`. Production needs a secrets manager and environment separation (dev / staging / prod).
- Row-level security: Supabase supports RLS policies so students can only read their own rows. Not configured in this prototype.
- Error handling: minimal. Production needs error boundaries, retry logic, and graceful degradation for Supabase timeouts.

**Data:**
- Demo student UUIDs are hardcoded (`a1111111-*` series). Production would use real student IDs from Cypher.
- The lesson list in the student view is mocked. Production pulls live course structure from the Cypher API.
- Event timestamps are refreshed via a SQL script for demo stability. Production events are written in real time.
- The dashboard query has a 50,000-row cap. Production needs proper pagination and indexing as student numbers scale.
