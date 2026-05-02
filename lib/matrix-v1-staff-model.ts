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

type RowDraft = {
  student: DbStudent;
  top: CoachAction | undefined;
  cohort: CohortKey;
  renewalRisk: RenewalRisk;
  lastActivity: string;
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

    drafts.push({ student: s, top, cohort, renewalRisk, lastActivity });
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

    return {
      studentId: d.student.id,
      label: d.student.name,
      cohort: d.cohort,
      currentIssue,
      lastActivity: d.lastActivity,
      staffActionPrimary: primary,
      staffActionDetail: detail,
      renewalRisk: d.renewalRisk,
    };
  });

  /** On track first (then nudge, intervention) so “whole class” matches card order 5 / 4 / 3. */
  const order: Record<CohortKey, number> = {
    on_track: 0,
    needs_nudge: 1,
    needs_intervention: 2,
  };
  rows.sort((a, b) => order[a.cohort] - order[b.cohort] || a.label.localeCompare(b.label));

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
