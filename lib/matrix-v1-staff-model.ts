/**
 * Matrix+ staff cohort view — derived from the same rule-based coach signals as /student,
 * grouped for visibility (on track · nudge · intervention).
 * Staff table copy is authored for teachers (observational, operational), not student-facing coach strings.
 */

import type { CoachAction } from "@/lib/coach";
import { getCoachForStudent } from "@/lib/coach";
import { referenceNowForCoachingRules } from "@/lib/coach-time";
import {
  lastMeaningfulActivityTime,
  type DbEvent,
  type DbLesson,
  type DbModule,
  type DbProgress,
  type DbQuiz,
  type DbStudent,
} from "@/lib/recommendations";
import { DEMO_PERSONA_STUDENT_ID } from "@/lib/demo-persona-student-ids";

export type CohortKey = "on_track" | "needs_nudge" | "needs_intervention";

export type RenewalRisk = "low" | "medium" | "high";

export type StaffStudentRow = {
  studentId: string;
  label: string;
  cohort: CohortKey;
  currentIssue: string;
  lastActivity: string;
  staffActionPrimary: string;
  staffActionDetail: string;
  renewalRisk: RenewalRisk;
  studentEmail: string | null;
  parentEmail: string | null;
  studentEmailDraft: string;
  parentEmailDraft: string;
};

const SEVERE_SCORE = 55;

/** Whole calendar days from activity date to reference date (0 = same calendar day). */
function calendarDaysFromActivityToReference(lastActivityDate: Date, referenceNow: Date): number {
  const L = new Date(
    lastActivityDate.getFullYear(),
    lastActivityDate.getMonth(),
    lastActivityDate.getDate()
  );
  const R = new Date(referenceNow.getFullYear(), referenceNow.getMonth(), referenceNow.getDate());
  return Math.round((R.getTime() - L.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Staff table label aligned with coaching time anchor — same reference as the 7-day inactive rule.
 */
export function formatLastActivityRelative(lastActivityDate: Date, referenceNow: Date): string {
  const raw = calendarDaysFromActivityToReference(lastActivityDate, referenceNow);
  const days = Math.max(0, raw);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function minQuizPercent(studentId: string, progress: DbProgress[]): number | null {
  const nums = progress
    .filter((p) => p.student_id === studentId)
    .map((p) => p.last_quiz_score_percent)
    .map((x) => (x == null ? null : Number(x)))
    .filter((x): x is number => x != null && Number.isFinite(x));
  if (nums.length === 0) return null;
  return Math.min(...nums);
}

function normalizeCoachPriority(p: number | string | undefined): number | undefined {
  if (p == null) return undefined;
  const n = Number(p);
  if (!Number.isFinite(n)) return undefined;
  const r = Math.round(n);
  if (r < 1 || r > 4) return undefined;
  return r;
}

function classifyFromTopAction(
  topPriority: number | string | undefined,
  minScore: number | null
): { cohort: CohortKey; renewalRisk: RenewalRisk } {
  const pri = normalizeCoachPriority(topPriority);
  if (pri === undefined || pri === 4) {
    return { cohort: "on_track", renewalRisk: "low" };
  }
  if (pri === 1) {
    return { cohort: "needs_intervention", renewalRisk: "high" };
  }
  if (pri === 2) {
    if (minScore != null && minScore < SEVERE_SCORE) {
      return { cohort: "needs_intervention", renewalRisk: "high" };
    }
    return { cohort: "needs_nudge", renewalRisk: "medium" };
  }
  return { cohort: "needs_nudge", renewalRisk: "medium" };
}

function lessonById(lessons: DbLesson[], id: string): DbLesson | undefined {
  return lessons.find((l) => l.id === id);
}

function moduleById(modules: DbModule[], id: string): DbModule | undefined {
  return modules.find((m) => m.id === id);
}

/** Coach merge dedupeKey: inactive | weak:{moduleId} | incomplete:{lessonId} | passive:{lessonId} | next:* … */
function parseDedupeKey(key: string | undefined):
  | { kind: "inactive" }
  | { kind: "weak"; moduleId: string }
  | { kind: "incomplete"; lessonId: string }
  | { kind: "passive"; lessonId: string }
  | { kind: "other" } {
  if (!key) return { kind: "other" };
  if (key === "inactive") return { kind: "inactive" };
  if (key.startsWith("weak:")) return { kind: "weak", moduleId: key.slice("weak:".length) };
  if (key.startsWith("incomplete:")) return { kind: "incomplete", lessonId: key.slice("incomplete:".length) };
  if (key.startsWith("passive:")) return { kind: "passive", lessonId: key.slice("passive:".length) };
  return { kind: "other" };
}

type StaffProfile =
  | { kind: "steady" }
  | { kind: "disengagement"; variant: number }
  | { kind: "low_quiz_severe"; topic: string }
  | { kind: "concept_gap_nudge"; topic: string; phraseVariant: number }
  | { kind: "incomplete"; topic: string; lessonTitle: string; actionVariant: number }
  | { kind: "passive_consumption"; topic: string; lessonTitle: string };

function deriveStaffProfile(
  top: CoachAction | undefined,
  cohort: CohortKey,
  modules: DbModule[],
  lessons: DbLesson[],
  inactiveVariant: number,
  studentId: string
): StaffProfile {
  if (!top || top.priority === 4) {
    return { kind: "steady" };
  }
  if (top.priority === 1) {
    return { kind: "disengagement", variant: inactiveVariant };
  }
  const dk = parseDedupeKey(top.dedupeKey);
  if (top.priority === 2 && dk.kind === "weak") {
    const mod = moduleById(modules, dk.moduleId);
    const topic = mod?.title ?? "this topic";
    if (cohort === "needs_intervention") {
      return { kind: "low_quiz_severe", topic };
    }
    const phraseVariant =
      (studentId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 2) as 0 | 1;
    return { kind: "concept_gap_nudge", topic, phraseVariant };
  }
  if (top.priority === 3 && dk.kind === "incomplete") {
    const les = lessonById(lessons, dk.lessonId);
    const mod = les ? moduleById(modules, les.module_id) : undefined;
    const actionVariant =
      dk.lessonId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 2;
    return {
      kind: "incomplete",
      topic: mod?.title ?? "this topic",
      lessonTitle: les?.title ?? "lesson",
      actionVariant,
    };
  }
  if (top.priority === 3 && dk.kind === "passive") {
    const les = lessonById(lessons, dk.lessonId);
    const mod = les ? moduleById(modules, les.module_id) : undefined;
    return {
      kind: "passive_consumption",
      topic: mod?.title ?? "this topic",
      lessonTitle: les?.title ?? "lesson",
    };
  }
  return { kind: "steady" };
}

function staffCurrentSignal(profile: StaffProfile): string {
  switch (profile.kind) {
    case "steady":
      return "On pace with recent lessons and checkpoints.";
    case "disengagement":
      return profile.variant === 0
        ? "No meaningful engagement recently — last activity over a week ago."
        : "Learning activity has stalled — no return since prior work in the course.";
    case "low_quiz_severe":
      return `Low quiz performance in ${profile.topic} — at risk of falling behind on the sequence.`;
    case "concept_gap_nudge":
      return profile.phraseVariant === 0
        ? `Quiz below target in ${profile.topic} — concepts may need consolidation.`
        : `Struggling with ${profile.topic} — results are below the expected level.`;
    case "incomplete":
      return `Started ${profile.topic} (${profile.lessonTitle}) — not yet completed.`;
    case "passive_consumption":
      return `Watched at least 80% of the lesson video but has not yet attempted the checkpoint quiz — ${profile.topic} (${profile.lessonTitle}).`;
    default:
      return "No urgent flags — patterns look stable.";
  }
}

function staffSuggestedAction(profile: StaffProfile): { primary: string; detail: string } {
  switch (profile.kind) {
    case "steady":
      return {
        primary: "Maintain current rhythm",
        detail: "Acknowledge steady progress; offer an extension only if there is capacity.",
      };
    case "disengagement":
      return profile.variant === 0
        ? {
            primary: "Personal check-in and restart with a small step",
            detail: "Brief contact and one concrete next step usually restore momentum.",
          }
        : {
            primary: "Re-establish contact and set a manageable next step",
            detail: "Keep the ask small so re-entry feels achievable this week.",
          };
    case "low_quiz_severe":
      return {
        primary: "Targeted revision before continuing",
        detail: `Focus on ${profile.topic} fundamentals before moving the class forward on that thread.`,
      };
    case "concept_gap_nudge":
      return profile.phraseVariant === 0
        ? {
            primary: "Consolidate before progressing",
            detail: `Short revision on ${profile.topic} before layering new material.`,
          }
        : {
            primary: "Reinforce before introducing the next topic",
            detail: `Strengthen ${profile.topic} before moving the class forward.`,
          };
    case "incomplete":
      return profile.actionVariant === 0
        ? {
            primary: "Help them finish the lesson they started",
            detail: `Wrap up the ${profile.topic} checkpoint so progress is clear and complete.`,
          }
        : {
            primary: "Prompt completion before moving on",
            detail: `Finish the ${profile.topic} checkpoint so progress is clear and complete.`,
          };
    case "passive_consumption":
      return {
        primary: "Prompt for concept understanding where necessary",
        detail: "A quick check that ideas landed before the next topic helps move from watching to doing.",
      };
    default:
      return {
        primary: "Review progress with the student",
        detail: "Use recent activity to agree a single next step.",
      };
  }
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

const DEMO_STUDENT_EMAIL: Partial<Record<string, string>> = {
  [DEMO_PERSONA_STUDENT_ID.drewPatel]: `Subject: Just checking in, Drew\n\nHi Drew, I noticed you haven't logged into Matrix+ for a little while and wanted to check in. It happens — life gets busy, and sometimes it's hard to find the rhythm again.\n\nThe good news is you're in a solid position with your work. When you're ready, picking up from where you left off is simpler than it might feel right now.\n\nIf there's anything on your mind, just reply to this email.\n\n— Ms Jessica Luong, Year 11 Maths Advanced`,
  [DEMO_PERSONA_STUDENT_ID.jordanBlake]: `Subject: Your Calculus 2 progress — a quick note\n\nHi Jordan, I can see you've been putting in the effort in Calculus 2 — attempting the checkpoint is exactly the right approach. Your recent result tells me some of the concepts might benefit from a bit more consolidation before you move forward, which is completely normal at this stage.\n\nWhen you next log in, Today's Focus will show you exactly where to start — it's already pointing you to the right place.\n\n— Ms Jessica Luong, Year 11 Maths Advanced`,
  [DEMO_PERSONA_STUDENT_ID.emeryChen]: `Subject: Great work on the lesson, Emery — one more step\n\nHi Emery, great work keeping up with the lesson videos in Calculus 1 — you've been consistent and that matters. The next step is to test your understanding with the checkpoint quiz.\n\nIt's not about getting everything right — it's about finding out what's landed and what might need a second look. Give it a go when you're ready. You're in a good position.\n\n— Ms Jessica Luong, Year 11 Maths Advanced`,
};

const DEMO_PARENT_EMAIL: Partial<Record<string, string>> = {
  [DEMO_PERSONA_STUDENT_ID.drewPatel]: `Subject: A quick update on Drew's Matrix+ progress\n\nDear Drew's parent,\n\nI wanted to reach out with a brief update on Drew's recent engagement with Matrix+ for Year 11 Maths Advanced.\n\nDrew has been doing solid work this term, but we've noticed he hasn't logged in recently. This isn't unusual — students sometimes need a nudge to re-establish their study rhythm at this point in the term.\n\nOur student success team will be in touch with you directly over the next day or two. In the meantime, a quiet check-in at home can make all the difference.\n\n— Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education`,
  [DEMO_PERSONA_STUDENT_ID.jordanBlake]: `Subject: Jordan's Maths Advanced progress — week update\n\nDear Jordan's parent,\n\nHere's a brief update on Jordan's progress in Year 11 Maths Advanced.\n\nJordan has been engaging with the course and attempting her checkpoints — which is exactly the right approach. Her most recent Calculus 2 result was slightly below the expected level, which tells us some consolidation would help before she moves forward.\n\nNo alarm needed — this is exactly the kind of early signal we watch for. A quiet check-in at home about how study is going is always helpful.\n\n— Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education`,
  [DEMO_PERSONA_STUDENT_ID.emeryChen]: `Subject: Emery's Maths Advanced progress — week update\n\nDear Emery's parent,\n\nA quick update on Emery's recent activity in Year 11 Maths Advanced.\n\nEmery has been consistently watching the lesson videos — a great habit. The next step in her learning path is to complete the checkpoint quiz for Calculus 1, which will confirm the concepts have landed before she moves on. Matrix+ has already sent her a gentle reminder.\n\nIf you get a chance to check in at home about how her study is going, that always helps.\n\n— Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education`,
};

function generateStudentEmailDraft(profile: StaffProfile, student: DbStudent): string {
  const override = DEMO_STUDENT_EMAIL[student.id];
  if (override) return override;

  const fn = firstName(student.name);
  const sig = "\n\n— Ms Jessica Luong, Year 11 Maths Advanced";
  switch (profile.kind) {
    case "disengagement":
      return `Subject: ${fn}, we noticed you've been away — we're here to help\n\nHi ${fn},\n\nWe noticed you haven't logged in to your Year 11 Maths Advanced course for a little while, and we wanted to check in.\n\nWe know Term 2 can get busy, and sometimes it's hard to know where to start when you've had a break. The good news is that your progress is all saved — when you next log in, Today's Focus will show you exactly where to pick up.\n\nIf there's anything on your mind, just reply to this email and we'll get back to you.${sig}`;
    case "low_quiz_severe":
      return `Subject: ${fn}, let's get you back on track in ${profile.topic}\n\nHi ${fn},\n\nYour teacher has noticed that your recent ${profile.topic} checkpoint was below target, and we want to make sure you get the support you need.\n\nDon't worry — when you next log in, Today's Focus will guide you to exactly the right starting point. If you're finding the concepts tricky, your teacher is here to help — just reply to this email if you'd like to arrange a time to chat.${sig}`;
    case "concept_gap_nudge":
      return `Subject: ${fn}, a quick note on your Maths progress\n\nHi ${fn},\n\nWell done for keeping up with your Year 11 Maths — you're making solid progress!\n\nWe noticed your recent ${profile.topic} checkpoint came in a little below your usual standard. That's completely normal — it's one of the trickier topics this term. When you next log in, Today's Focus will show you exactly where to start to build your confidence back up.\n\nKeep going — small steps this week will make a real difference!${sig}`;
    case "incomplete":
      return `Subject: ${fn}, you're almost there — finish off ${profile.topic}\n\nHi ${fn},\n\nYou're so close! You started ${profile.lessonTitle} but haven't quite finished it yet.\n\nWhen you next log in, Today's Focus will take you straight back to where you left off. Even 20 minutes this week will get you across the line.${sig}`;
    case "passive_consumption":
      return `Subject: ${fn}, great effort on the lesson — now try the checkpoint!\n\nHi ${fn},\n\nNice work getting through the ${profile.topic} lesson! The next step is the checkpoint quiz — it only takes a few minutes and helps lock in what you've just learned.\n\nWhen you next log in, Today's Focus will take you straight there.${sig}`;
    default:
      return "";
  }
}

function generateParentEmailDraft(profile: StaffProfile, student: DbStudent): string {
  const override = DEMO_PARENT_EMAIL[student.id];
  if (override) return override;

  const fn = firstName(student.name);
  const sig = "\n\n— Ms Jessica Luong, Year 11 Maths Advanced, Matrix Education";
  switch (profile.kind) {
    case "disengagement":
      return `Subject: An update on ${fn}'s progress in Year 11 Maths Advanced\n\nDear parent or guardian,\n\nWe're writing to let you know that ${fn} hasn't logged in to their Year 11 Maths Advanced course for the past 10 days. We wanted to make sure you were aware in case there's something we can help with.\n\n${fn}'s teacher has been notified, and our student success team will reach out to ${fn} directly this week to help them get back on track.\n\nIf you'd like to discuss ${fn}'s progress, please don't hesitate to reply to this email.${sig}`;
    case "low_quiz_severe":
      return `Subject: An update on ${fn}'s progress — ${profile.topic}\n\nDear parent or guardian,\n\n${fn}'s teacher has flagged that their recent ${profile.topic} checkpoint came in significantly below target. We want to make sure ${fn} gets the right support before this affects their broader progress.\n\n${fn}'s teacher has been notified and will follow up directly. Our student success team will also be in touch this week.\n\nIf you'd like to discuss further, please reply to this email.${sig}`;
    case "concept_gap_nudge":
      return `Subject: ${fn}'s weekly Maths progress update\n\nDear parent or guardian,\n\nHere's a quick update on ${fn}'s Year 11 Maths Advanced course this week.\n\n${fn} has been actively working through the course. Their recent ${profile.topic} checkpoint came in a little below target, so their personalised learning path has been updated to focus on consolidating those concepts.\n\nNo action is needed from you — ${fn}'s Today's Focus has been updated to guide them to the right next step. We'll keep you posted each week.${sig}`;
    case "incomplete":
      return `Subject: ${fn}'s weekly Maths progress update\n\nDear parent or guardian,\n\nA quick update on ${fn}'s Year 11 Maths Advanced course this week.\n\n${fn} has made a good start on ${profile.lessonTitle} — they just need to complete the final step. Today's Focus will guide them straight back to where they left off.\n\nNo action needed from you. We'll keep you updated each week.${sig}`;
    case "passive_consumption":
      return `Subject: ${fn}'s weekly Maths progress update\n\nDear parent or guardian,\n\nA quick update on ${fn}'s Year 11 Maths Advanced course.\n\n${fn} has been watching their ${profile.topic} lesson — great effort! The next step is the checkpoint quiz, which helps consolidate what they've learned. Today's Focus will guide them there.\n\nNo action needed from you.${sig}`;
    case "steady":
      return `Subject: ${fn}'s weekly Maths progress update\n\nDear parent or guardian,\n\nGreat news — ${fn} is on track with their Year 11 Maths Advanced course this week. They've been making steady progress and there's nothing urgent to flag.\n\nWe'll continue to send you a weekly digest each week.${sig}`;
    default:
      return "";
  }
}

type RowDraft = {
  student: DbStudent;
  top: CoachAction | undefined;
  cohort: CohortKey;
  renewalRisk: RenewalRisk;
  lastActivity: string;
  lastActivityTs: number; // ms epoch, 0 = no activity; used for sort only
};

/** One row per student — same signals as student-facing coaching; staff-only copy for the table. */
export function buildStaffStudentRows(
  students: DbStudent[],
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[],
  quizzes: DbQuiz[] = []
): StaffStudentRow[] {
  const drafts: RowDraft[] = [];
  const referenceNow = referenceNowForCoachingRules(events, progress);

  for (const s of students) {
    const { actions } = getCoachForStudent(s.id, s.name, modules, lessons, progress, events, quizzes);
    const top = actions[0];
    const minScore = minQuizPercent(s.id, progress);
    const { cohort, renewalRisk } = classifyFromTopAction(top?.priority, minScore);

    const last = lastMeaningfulActivityTime(events, progress, s.id);
    const lastActivity = last ? formatLastActivityRelative(last, referenceNow) : "No activity logged yet";
    const lastActivityTs = last?.getTime() ?? 0;

    drafts.push({ student: s, top, cohort, renewalRisk, lastActivity, lastActivityTs });
  }

  const inactiveSorted = drafts
    .filter((d) => d.top?.priority === 1 && parseDedupeKey(d.top.dedupeKey).kind === "inactive")
    .map((d) => d.student)
    .sort((a, b) => a.name.localeCompare(b.name));

  const inactiveVariantById = new Map<string, number>();
  inactiveSorted.forEach((stu, idx) => {
    inactiveVariantById.set(stu.id, idx % 2);
  });

  const rows: StaffStudentRow[] = drafts.map((d) => {
    const inactiveVar = inactiveVariantById.get(d.student.id) ?? 0;
    const profile = deriveStaffProfile(d.top, d.cohort, modules, lessons, inactiveVar, d.student.id);
    const currentIssue = staffCurrentSignal(profile);
    const { primary, detail } = staffSuggestedAction(profile);
    const studentEmailDraft = d.cohort === "on_track" ? "" : generateStudentEmailDraft(profile, d.student);
    const parentEmailDraft = generateParentEmailDraft(profile, d.student);

    return {
      studentId: d.student.id,
      label: d.student.name,
      cohort: d.cohort,
      currentIssue,
      lastActivity: d.lastActivity,
      staffActionPrimary: primary,
      staffActionDetail: detail,
      renewalRisk: d.renewalRisk,
      studentEmail: d.student.email,
      parentEmail: d.student.parent_email,
      studentEmailDraft,
      parentEmailDraft,
    };
  });

  /** Intervention first, then nudge, then on track — priority ordering for staff triage. */
  const order: Record<CohortKey, number> = {
    needs_intervention: 0,
    needs_nudge: 1,
    on_track: 2,
  };
  const tsById = new Map(drafts.map((d) => [d.student.id, d.lastActivityTs]));
  rows.sort((a, b) => {
    const cohortDiff = order[a.cohort] - order[b.cohort];
    if (cohortDiff !== 0) return cohortDiff;
    if (a.cohort === "needs_intervention") {
      // Longest away first (lowest timestamp = furthest in the past)
      return (tsById.get(a.studentId) ?? 0) - (tsById.get(b.studentId) ?? 0);
    }
    return a.label.localeCompare(b.label);
  });

  return rows;
}

export function cohortCounts(rows: StaffStudentRow[]): Record<CohortKey, number> {
  const init: Record<CohortKey, number> = {
    on_track: 0,
    needs_nudge: 0,
    needs_intervention: 0,
  };
  for (const r of rows) init[r.cohort]++;
  return init;
}
