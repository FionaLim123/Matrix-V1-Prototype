# Prototype Improvements — Independent of Cypher Learning

These changes improve the demo's narrative coherence and can be made now, entirely within the prototype. No Cypher Learning integration is required.

Ordered by priority. Each item is self-contained and can be done independently.

---

## 1 — Wire Emery's quiz CTA to the in-lesson check screen [CRITICAL]

**Problem:** The "Go to quiz" button on Emery's tab is disabled. During the demo, this kills the story at its climax.

**Fix:** The micro-check (in-lesson check-in) screen already exists in the prototype as the `inLessonCheck` sub-view. Wire the CoachCard's `onGoToQuiz` prop to call `handleEmerySub("inLessonCheck")` on Emery's screen — same as the existing "Watch lesson" button flow.

**Files:** `components/emery-passive-lessons-overview/EmeryPassiveLessonsOverviewScreen.tsx`, `CoachCard.tsx`

**Result:** Demo can complete the full Emery arc: sees guidance → clicks CTA → arrives at micro-check → system captures the attempt.

---

## 2 — Add visual encoding to Engagement Risk in staff table [HIGH]

**Problem:** "high", "medium", "low" appear as plain lowercase text. A teacher scanning the table can't see who needs urgent attention at a glance.

**Fix:** Add CSS badge classes that colour-code the three levels:
- `high` → red/maroon text or badge
- `medium` → amber
- `low` → muted/grey

The `riskClass()` function in `MatrixStaffDashboard.tsx` already exists and returns `matrix-risk-text-high` / `matrix-risk-text-medium` / `matrix-risk-text-low` — the logic is there, just needs the CSS rules in `globals.css` to be visually distinct enough to be scannable.

**Files:** `app/globals.css`, optionally `MatrixStaffDashboard.tsx`

---

## 3 — Add staff-facing context strip on student drill-down [HIGH]

**Problem:** Clicking "View details" from the staff table dumps the teacher onto the student's lessons page with no context. Heading reads "Lessons", coach card says "Today's focus, Jordan" — it's the student view with no staff framing.

**Fix:** When `staffFeedbackStudentId` is set (i.e., staff is viewing a student), render a small context banner above the lessons content:
- Student's cohort group (e.g. "Needs Intervention")
- The recommended staff action ("Personal check-in and restart with a small step")
- A "Back to cohort" link

This bridges the table → student view transition and makes the staff intelligence feel continuous.

**Files:** `components/emery-passive-lessons-overview/EmeryFlow.tsx`, `components/matrix-v1/MatrixStudentLessonsCore.tsx` (or a new thin wrapper component)

---

## 4 — Show signal context on the student CoachCard [HIGH]

**Problem:** The CoachCard shows warm guidance but gives no indication of *why* this is the student's focus today. The system intelligence is invisible.

**Fix:** Add a small signal tag or eyebrow line above the headline, derived from coach state:
- RETURNING → "No activity detected in 10+ days"
- STRUGGLING → "Recent quiz result: 68%"  
- PASSIVE → "Lesson watched — quiz not yet attempted"
- ON_TRACK → omit (no need to explain on-track)

This makes the detection→guidance connection explicit without changing the warmth of the copy.

**Files:** `lib/todays-focus.ts` (add `signalContext` field to `TodaysFocus`), `components/emery-passive-lessons-overview/CoachCard.tsx` (render it), `components/matrix-v1/MatrixStudentLessonsCore.tsx` (render it in the staff drill-down view too)

---

## 5 — Suppress help section for PASSIVE state [MEDIUM]

**Problem:** The "If you need help — Ask Max / Discussion Forum" section appears on all three persona tabs including Emery (PASSIVE). For PASSIVE, the message is "you've done the work, just try the quiz." Help options compete with that singular call to action.

**Fix:** Conditionally render `<HelpSection />` only when coach state is RETURNING or STRUGGLING. Pass the coach state down through `CoachCard` and suppress the section for PASSIVE and ON_TRACK.

**Files:** `components/emery-passive-lessons-overview/CoachCard.tsx`, `components/emery-passive-lessons-overview/HelpSection.tsx`

---

## 6 — Use lastActivityDate in RETURNING copy [MEDIUM]

**Problem:** The RETURNING copy says "Nice to have you back" but doesn't say how long the student was away. The `lastActivityDate` field is already in the data model and passed through the coach engine.

**Fix:** Thread `lastActivityDate` into the `buildTodaysFocus` RETURNING template and add a specific line: "You last visited [X] days ago" or "You were last here on [date]." This makes the coach feel observant rather than generic.

**Files:** `lib/todays-focus.ts` (RETURNING case in `buildTodaysFocus`), `lib/demo-personas.ts` (ensure fallback has a plausible lastActivityDate for Drew)

---

## 7 — Add visual urgency differentiation to CoachCard states [MEDIUM]

**Problem:** All three CoachCards look identical — same card, same left-border colour. Drew (inactive, high risk) and Emery (passive, low risk) are visually indistinguishable.

**Fix:** Vary the left-border accent colour and/or the eyebrow label colour by coach state:
- RETURNING / STRUGGLING → maroon/red border (urgent)
- PASSIVE → amber/orange border (nudge-level)
- ON_TRACK → green border

This mirrors the urgency tiers in the staff dashboard (intervention vs nudge vs on track) and makes the coach state legible at a glance.

**Files:** `components/emery-passive-lessons-overview/CoachCard.tsx`, `app/globals.css`

---

## 8 — Reorder staff table columns for triage-first scanning [MEDIUM]

**Problem:** Current column order — Student → Action → Signal → Last activity → Risk — is reporting order, not intervention order. A teacher scanning a class list wants to see risk first, then why, then name, then action.

**Proposed order:** Risk → Student → Current signal → Last activity → Suggested action → View

This is a small change to the `<th>` order and the corresponding `<td>` order in `MatrixStaffDashboard.tsx`.

**Files:** `components/matrix-v1/MatrixStaffDashboard.tsx`

---

## 9 — Add "View as staff see them" link from persona tabs [MEDIUM]

**Problem:** The demo loop (student experience → staff view) is invisible. When showing Jordan's tab, there's no easy way to say "and here's what the staff sees about Jordan."

**Fix:** Add a small "See Jordan in staff view →" link on each persona tab that navigates to the staff tab with that student's name visible in the table. This closes the loop in the demo and makes the end-to-end story walkable without manual explanation.

**Files:** `components/emery-passive-lessons-overview/DrewPassiveLessonsOverviewScreen.tsx`, `JordanPassiveLessonsOverviewScreen.tsx`, `EmeryPassiveLessonsOverviewScreen.tsx`, `EmeryPrototypeNav.tsx` (to expose a nav callback)
