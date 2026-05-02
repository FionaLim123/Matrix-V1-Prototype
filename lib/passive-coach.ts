/**
 * PASSIVE_CONSUMPTION — watch-through without a comprehension attempt (Matrix+ rules).
 * Does not replace existing coach action detection; see `mergePassiveCoachAction`.
 */

import { referenceNowForCoachingRules } from "@/lib/coach-time";
import {
  INACTIVE_DAYS,
  LOW_SCORE_THRESHOLD,
  daysAgo,
  lastMeaningfulActivityTime,
  lessonById,
  type DbEvent,
  type DbLesson,
  type DbProgress,
  type DbQuiz,
} from "@/lib/recommendations";
import type { CoachAction } from "@/lib/coach";

const PASSIVE_MIN_AFTER_MS = 10 * 60 * 1000;
const PASSIVE_MAX_AFTER_MS = 48 * 60 * 60 * 1000;

export type PassiveIntervention = {
  type: "MICRO_CHECK";
  recommendedRewatchTimestamp: string | null;
};

export type PassiveCoachObject = {
  key: `passive:${string}`;
  state: "PASSIVE";
  learningRisk: "PASSIVE_CONSUMPTION";
  coachGoal: "PROMPT_COMPREHENSION_CHECK";
  confidenceLevel: "LOW";
  studentName: string;
  lessonName: string;
  quizName: string;
  moduleId: string;
  lessonVideoCount: number;
  lastEngagementAt: string;
  intervention: PassiveIntervention;
};

function timeMs(s: string): number {
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function getMeta(e: DbEvent): Record<string, unknown> {
  if (!e.metadata || typeof e.metadata !== "object") return {};
  return e.metadata as Record<string, unknown>;
}

/** Final video: explicit flag, or last in sequence, or default single-video lesson. */
function isFinalVideoWatchedEvent(e: DbEvent, allLessonVideoEvents: DbEvent[]): boolean {
  if (e.event_type !== "video_watched_80_percent" || !e.lesson_id) return false;
  const m = getMeta(e);
  if (m.is_final === true) return true;
  const idx = m.video_index != null ? Number(m.video_index) : null;
  const count = m.video_count != null ? Number(m.video_count) : null;
  if (idx != null && count != null && !Number.isNaN(idx) && !Number.isNaN(count) && count > 0) {
    return idx === count;
  }
  // Single-video lesson: no indices in any event for this lesson
  const withIdx = allLessonVideoEvents.filter((x) => getMeta(x).video_index != null);
  if (withIdx.length === 0) return true;
  return false;
}

function lessonVideoCountForLesson(lessonId: string, allStudentEvents: DbEvent[]): number {
  const started = allStudentEvents.filter(
    (e) => e.lesson_id === lessonId && (e.event_type === "video_started" || e.event_type === "video_watched_80_percent")
  );
  let maxCount = 0;
  for (const e of started) {
    const c = getMeta(e).video_count;
    if (c != null) {
      const n = Number(c);
      if (!Number.isNaN(n) && n > maxCount) maxCount = n;
    }
  }
  if (maxCount > 0) return maxCount;
  return 1;
}

function rewatchFromMetadata(m: Record<string, unknown>): string | null {
  if (typeof m.recommended_rewatch === "string") return m.recommended_rewatch;
  if (typeof m.recommended_rewatch_timestamp === "string") return m.recommended_rewatch_timestamp;
  if (m.recommended_rewatch_sec != null) {
    const s = Number(m.recommended_rewatch_sec);
    if (Number.isFinite(s) && s >= 0) {
      const mm = Math.floor(s / 60);
      const r = Math.floor(s % 60);
      return r === 0 ? String(mm) : `${mm}:${String(r).padStart(2, "0")}`;
    }
  }
  return null;
}

function hasQuizSubmitted(studentId: string, lessonId: string, events: DbEvent[]): boolean {
  return events.some(
    (e) =>
      e.student_id === studentId &&
      e.event_type === "quiz_submitted" &&
      e.lesson_id === lessonId
  );
}

/** Checkpoint already reflected in progress — do not treat as passive consumption for this lesson. */
function hasProgressComprehensionEvidence(studentId: string, lessonId: string, progress: DbProgress[]): boolean {
  const row = progress.find((p) => p.student_id === studentId && p.lesson_id === lessonId);
  if (!row) return false;
  if (row.status === "completed") return true;
  if (row.last_quiz_score_percent != null) return true;
  return false;
}

type AnchorRow = { lessonId: string; atMs: number; rewatch: string | null };

function anchorForLesson(lessonId: string, studentEvents: DbEvent[]): { atMs: number; rewatch: string | null } | null {
  const lEvents = studentEvents.filter((e) => e.lesson_id === lessonId);
  const completed = lEvents
    .filter((e) => e.event_type === "lesson_completed")
    .map((e) => timeMs(e.created_at));
  const videoFinal = lEvents.filter(
    (e) => e.event_type === "video_watched_80_percent" && isFinalVideoWatchedEvent(e, lEvents)
  );

  const vTimes = videoFinal.map((e) => ({ t: timeMs(e.created_at), e }));
  const maxV = vTimes.length ? vTimes.sort((a, b) => b.t - a.t)[0] : null;

  const maxC = completed.length ? Math.max(...completed) : 0;
  let atMs = Math.max(maxC, maxV?.t ?? 0);
  if (atMs <= 0) return null;
  const fromVideo = maxV && maxV.t >= maxC && maxV.t > 0 ? maxV.e : null;
  return {
    atMs,
    rewatch: fromVideo ? rewatchFromMetadata(getMeta(fromVideo)) : null,
  };
}

function studentIsReturning(events: DbEvent[], progress: DbProgress[], studentId: string, now: Date): boolean {
  const last = lastMeaningfulActivityTime(events, progress, studentId);
  if (!last) return false;
  return last < daysAgo(now, INACTIVE_DAYS);
}

function studentIsStruggling(studentId: string, progress: DbProgress[]): boolean {
  for (const p of progress.filter((r) => r.student_id === studentId)) {
    const sc = p.last_quiz_score_percent;
    if (sc != null && sc < LOW_SCORE_THRESHOLD) return true;
  }
  return false;
}

function inPassiveTimeWindow(anchorMs: number, nowMs: number): boolean {
  const delta = nowMs - anchorMs;
  return delta >= PASSIVE_MIN_AFTER_MS && delta <= PASSIVE_MAX_AFTER_MS;
}

export function buildPassiveCoachObject(
  studentId: string,
  studentName: string,
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[],
  quizzes: DbQuiz[]
): PassiveCoachObject | null {
  const now = referenceNowForCoachingRules(events, progress);
  const nowMs = now.getTime();
  if (studentIsReturning(events, progress, studentId, now)) return null;
  if (studentIsStruggling(studentId, progress)) return null;

  const byLesson = new Map<string, (typeof quizzes)[0]>();
  for (const q of quizzes) {
    if (!byLesson.has(q.lesson_id)) byLesson.set(q.lesson_id, q);
  }

  const studentEvents = events.filter((e) => e.student_id === studentId);
  const candidates: AnchorRow[] = [];

  for (const [lessonId, _quiz] of byLesson) {
    if (hasQuizSubmitted(studentId, lessonId, events)) continue;
    if (hasProgressComprehensionEvidence(studentId, lessonId, progress)) continue;
    const anchor = anchorForLesson(lessonId, studentEvents);
    if (!anchor) continue;
    if (!inPassiveTimeWindow(anchor.atMs, nowMs)) continue;
    const les = lessonById(lessons, lessonId);
    if (!les) continue;
    candidates.push({
      lessonId,
      atMs: anchor.atMs,
      rewatch: anchor.rewatch,
    });
  }

  if (candidates.length === 0) return null;
  const best = candidates.sort((a, b) => b.atMs - a.atMs)[0];
  const les = lessonById(lessons, best.lessonId);
  if (!les) return null;
  const quiz = byLesson.get(best.lessonId);
  if (!quiz) return null;
  const lastEngagementAt = new Date(best.atMs).toISOString();
  const videoCount = lessonVideoCountForLesson(best.lessonId, studentEvents);

  return {
    key: `passive:${best.lessonId}` as const,
    state: "PASSIVE",
    learningRisk: "PASSIVE_CONSUMPTION",
    coachGoal: "PROMPT_COMPREHENSION_CHECK",
    confidenceLevel: "LOW",
    studentName,
    lessonName: les.title,
    quizName: quiz.title,
    moduleId: les.module_id,
    lessonVideoCount: videoCount,
    lastEngagementAt,
    intervention: {
      type: "MICRO_CHECK",
      recommendedRewatchTimestamp: best.rewatch,
    },
  };
}

const PASSIVE_ACTION_TITLE = "\u200b";

/** Synthetic coach row so priority merge and staff view see PASSIVE as priority 3. */
export function mergePassiveCoachAction(
  studentId: string,
  studentName: string,
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[],
  quizzes: DbQuiz[],
  existing: CoachAction[]
): { merged: CoachAction[]; passiveCoach: PassiveCoachObject | null } {
  const passive = buildPassiveCoachObject(studentId, studentName, lessons, progress, events, quizzes);
  if (!passive) {
    return { merged: existing, passiveCoach: null };
  }
  const lid = passive.key.slice("passive:".length);
  const withoutIncomplete = existing.filter(
    (a) => a.dedupeKey !== `incomplete:${lid}`
  );
  const passiveAction: CoachAction = {
    priority: 3,
    dedupeKey: passive.key,
    title: PASSIVE_ACTION_TITLE,
    detail: "",
  };
  return {
    merged: [...withoutIncomplete, passiveAction],
    passiveCoach: passive,
  };
}
