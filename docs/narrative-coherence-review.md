# Narrative Coherence Review — Matrix+ Intelligence Prototype

## The story the demo needs to tell

> Student falls slightly behind → system detects signals → student gets warm guidance → staff sees cohort-level risk → staff can intervene appropriately.

---

## Beat-by-beat audit

### Beat 1 — Student falls slightly behind ✅

All three personas represent different flavours of "slightly behind":
- **Drew** — went inactive (7+ days, no logins)
- **Jordan** — quiz score below threshold (~68%)
- **Emery** — watched the lesson video but hasn't attempted the quiz

This is well-designed. The three states cover the real spectrum of early disengagement without dramatising it.

---

### Beat 2 — System detects signals ⚠️ GAP

The coach engine correctly classifies students via priority rules (inactive → RETURNING, weak score → STRUGGLING, passive consumption → PASSIVE). The detection logic works.

**Problem: the detection is invisible to the student.**

The CoachCard appears on screen with warm guidance copy, but nothing on screen says "we noticed X." There's no moment where the student understands that the system has been watching their progress. The guidance lands without context — it feels like a generic motivational card rather than a personalised observation.

**Example of what's missing:**
> *You haven't opened a lesson in 11 days.* [small signal tag]  
> "Nice to have you back, Drew. You're in a good position to keep going."

Without that connection, the viewer (demo audience) doesn't see the intelligence — they just see a card with copy.

---

### Beat 3 — Student gets warm guidance ⚠️ GAPS

The copy templates (RETURNING / STRUGGLING / PASSIVE / ON_TRACK) are warm and well-calibrated. The structure of the CoachCard (headline → body → why this matters → next step → CTA) is solid.

**Gap 3a — Emery's CTA is broken (highest priority)**  
The "Go to quiz" button on Emery's tab is disabled with tooltip "Coming in the next phase." But Emery's entire coaching moment is built around this call to action. The in-lesson check-in screen (the micro-check video flow) already exists in the prototype — it's just not wired to this button. During a live demo, this break in the flow kills the story dead at its climax.

**Gap 3b — Help section shows for PASSIVE state**  
The "If you need help" section (Ask Max / Discussion Forum) appears on all three persona tabs. For Drew (RETURNING) and Jordan (STRUGGLING), this makes sense — they may need support. For Emery (PASSIVE), it's wrong: the message is "you've done the content, just try the quiz." Help options dilute this by suggesting she might be stuck. The primary action and the help options are competing for attention.

**Gap 3c — No urgency differentiation between persona cards**  
All three CoachCards look identical — same card, same left-border colour, same layout. Drew (inactive, high risk) and Emery (passive, low risk) are visually indistinguishable. The urgency gradient from the coach engine isn't reflected in the visual treatment.

**Gap 3d — RETURNING copy doesn't personalise the time away**  
The data model carries `lastActivityDate` but the RETURNING copy doesn't use it. "Nice to have you back" works but "You haven't logged in for 11 days" + "Nice to have you back" is far more compelling and demonstrates the system's awareness.

---

### Beat 4 — Staff sees cohort-level risk ⚠️ GAPS

The three cohort cards and the table exist and contain the right information.

**Gap 4a — Engagement risk column has no visual encoding**  
The "Engagement risk" column shows "high", "medium", "low" as plain lowercase text. It has no colour, no badge weight, no visual hierarchy. A teacher scanning the table cannot immediately see which students need urgent attention. The most important signal in the table is invisible at a glance.

**Gap 4b — Table column order is analytics-first, not triage-first**  
Current order: Student → Suggested action → Current signal → Last activity → Engagement risk → View  
A teacher triaging a class would scan: *who is at risk?* → *why?* → *what should I do?*  
The risk column is last. The signal column ("no engagement in 10 days") is in the middle. This is data reporting order, not intervention order.

**Gap 4c — Cohort cards don't guide which group to act on first**  
The three summary cards show counts and descriptions but don't express urgency sequence. "Needs Intervention — Not engaging recently or falling behind" is correct but a teacher doesn't know: start here, not there.

---

### Beat 5 — Staff can intervene appropriately ⚠️ GAP

The "Suggested staff action" column is well-written and action-oriented. The "View details →" link exists.

**Gap 5a — Staff drill-down has no staff-facing context**  
Clicking "View details" from the staff table takes the teacher directly into the student's lessons view — the same screen the student sees. There's no staff-specific framing. The teacher arrives on a page headed "Lessons" and sees "Today's focus, Jordan." There's no bridge that says: *you're viewing this as a staff member, here's what the system flagged, here's what we suggest you say.*

The transition is jarring and the demo opportunity to show "staff intelligence on a specific student" is lost.

---

### Beat — The loop is invisible

The strongest product story is the closed loop: coach detects risk → student gets guidance → staff is also notified → staff acts → student recovers. The prototype shows these moments in separate tabs but never makes the loop explicit.

When a demo viewer is on Jordan's tab, they can't easily see "and here's what the staff would see about Jordan right now." The connection between the student experience and the staff view is a tab switch with no narrative bridge.

---

## Summary of gaps by priority

| # | Gap | Beat affected | Priority |
|---|-----|---------------|----------|
| 1 | Emery quiz CTA is disabled — kills the demo climax | Beat 3 | Critical |
| 2 | Engagement risk has no visual encoding | Beat 4 | High |
| 3 | Staff drill-down has no staff-facing context | Beat 5 | High |
| 4 | No signal→guidance connection visible to student | Beat 2 | High |
| 5 | Help section showing for PASSIVE dilutes the message | Beat 3 | Medium |
| 6 | No urgency differentiation across CoachCard states | Beat 3 | Medium |
| 7 | RETURNING copy doesn't use lastActivityDate | Beat 3 | Medium |
| 8 | Table column order is analytics-first, not triage-first | Beat 4 | Medium |
| 9 | Demo loop (student ↔ staff) is not visible | All | Medium |
| 10 | Cohort cards don't express which to act on first | Beat 4 | Low |
