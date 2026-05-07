/**
 * Today's Focus — behaviour from data + coach engine, copy from shared templates (`buildTodaysFocus`).
 * Matrix+ Lessons + Magic Patterns prototype consume `composeTodaysFocus` output.
 */

import { nextLessonGlobally, type CoachAction } from "@/lib/coach";
import { getDemoPersonaCoachFallback } from "@/lib/demo-personas";
import type { PassiveCoachObject } from "@/lib/passive-coach";
import {
  LOW_SCORE_THRESHOLD,
  lessonById,
  type DbEvent,
  type DbLesson,
  type DbModule,
  type DbProgress,
  type DbQuiz,
} from "@/lib/recommendations";

/** Four template bands — coach engine maps actions into one of these. */
export type CoachEngineState = "RETURNING" | "STRUGGLING" | "PASSIVE" | "ON_TRACK";

export type TodaysFocusCtaTarget =
  | { type: "lesson"; lessonId: string | null }
  | { type: "quiz"; lessonId: string | null };

export type BuildTodaysFocusInput = {
  studentName: string;
  state: CoachEngineState;
  lessonName: string;
  quizName?: string | null;
  score?: number | null;
  /** Optional; reserved for future variants (e.g. date in RETURNING body). */
  lastActivityDate?: string | null;
  focalLessonId?: string | null;
};

export type TodaysFocusCopy = {
  state: CoachEngineState;
  headline: string;
  body: string;
  whyThisMatters: string;
  nextStep: string;
  ctaLabel: string;
  ctaTarget: TodaysFocusCtaTarget;
  /** Warm, non-accusing one-liner shown above the headline — surfaces the signal that triggered this focus state. Null for ON_TRACK. */
  signalContext: string | null;
  /** Shown below the CTA button. Used for PASSIVE state to explain that the quiz lives in the full platform (V2 integration). */
  ctaByline?: string | null;
};

export type TodaysFocus = TodaysFocusCopy & {
  focalLessonId: string | null;
  /** Shown under the strip for RETURNING + STRUGGLING only. */
  supportHelp: string | null;
};

const TODAYS_FOCUS_SUPPORT_HELP =
  "If you need help, you can ask in the Discussion Forum or use Ask Max.";

function modulesSorted(modules: DbModule[]): DbModule[] {
  return [...modules].sort((a, b) => a.order_index - b.order_index);
}

function lessonsForModule(lessons: DbLesson[], moduleId: string): DbLesson[] {
  return lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
}

function progressForLesson(
  progress: DbProgress[],
  studentId: string,
  lessonId: string
): DbProgress | undefined {
  return progress.find((p) => p.student_id === studentId && p.lesson_id === lessonId);
}

function firstNonCompletedLesson(
  studentId: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[]
): DbLesson | undefined {
  for (const mod of modulesSorted(modules)) {
    for (const les of lessonsForModule(lessons, mod.id)) {
      const p = progressForLesson(progress, studentId, les.id);
      const st = p?.status ?? "not_started";
      if (st !== "completed") return les;
    }
  }
  return undefined;
}

function inactiveFocalLessonId(
  studentId: string,
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
): string | null {
  const studentEvents = events.filter((e) => e.student_id === studentId);
  const opened = new Set(
    studentEvents.filter((e) => e.event_type === "lesson_opened" && e.lesson_id).map((e) => e.lesson_id as string)
  );
  const completed = new Set(
    studentEvents.filter((e) => e.event_type === "lesson_completed" && e.lesson_id).map((e) => e.lesson_id as string)
  );
  for (const lid of opened) {
    if (!completed.has(lid)) return lid;
  }
  const studentProgress = progress.filter((p) => p.student_id === studentId);
  const lastProg = studentProgress.sort((a, b) => {
    const la = lessonById(lessons, a.lesson_id);
    const lb = lessonById(lessons, b.lesson_id);
    return (la?.order_index ?? 0) - (lb?.order_index ?? 0);
  })[studentProgress.length - 1];
  return lastProg?.lesson_id ?? null;
}

type FocalResolve = {
  focalLessonId: string | null;
  weakScore: number | null;
};

function resolveFocal(
  primary: CoachAction,
  studentId: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
): FocalResolve {
  if (primary.dedupeKey === "inactive") {
    const focal = inactiveFocalLessonId(studentId, lessons, progress, events);
    const next = nextLessonGlobally(modules, lessons, focal);
    return { focalLessonId: focal ?? next?.id ?? null, weakScore: null };
  }
  if (primary.dedupeKey.startsWith("weak:")) {
    const modId = primary.dedupeKey.slice("weak:".length);
    const modLessons = lessonsForModule(lessons, modId);
    let worst: { id: string; score: number } | null = null;
    for (const les of modLessons) {
      const p = progressForLesson(progress, studentId, les.id);
      const sc = p?.last_quiz_score_percent;
      if (sc != null && sc < LOW_SCORE_THRESHOLD) {
        if (!worst || sc < worst.score) worst = { id: les.id, score: sc };
      }
    }
    return { focalLessonId: worst?.id ?? null, weakScore: worst?.score ?? null };
  }
  if (primary.dedupeKey.startsWith("incomplete:")) {
    const id = primary.dedupeKey.slice("incomplete:".length);
    return { focalLessonId: id || null, weakScore: null };
  }
  if (primary.dedupeKey.startsWith("passive:")) {
    const id = primary.dedupeKey.slice("passive:".length);
    return { focalLessonId: id || null, weakScore: null };
  }
  if (primary.dedupeKey === "next:start") {
    const orderedMods = modulesSorted(modules);
    const first = orderedMods[0] ? lessonsForModule(lessons, orderedMods[0].id)[0] : undefined;
    return { focalLessonId: first?.id ?? null, weakScore: null };
  }
  const STRONG = 80;
  let latestStrong: DbLesson | null = null;
  for (const mod of modulesSorted(modules)) {
    for (const les of lessonsForModule(lessons, mod.id)) {
      const p = progressForLesson(progress, studentId, les.id);
      const sc = p?.last_quiz_score_percent;
      if (p?.status === "completed" && sc != null && sc >= STRONG) {
        latestStrong = les;
      }
    }
  }
  const nextAfter = latestStrong ? nextLessonGlobally(modules, lessons, latestStrong.id) : undefined;
  if (nextAfter) return { focalLessonId: nextAfter.id, weakScore: null };
  const fallback = firstNonCompletedLesson(studentId, modules, lessons, progress);
  return { focalLessonId: fallback?.id ?? null, weakScore: null };
}

function engineStateFromPrimary(primary: CoachAction): CoachEngineState {
  if (primary.dedupeKey === "inactive") return "RETURNING";
  if (primary.dedupeKey.startsWith("weak:")) return "STRUGGLING";
  if (primary.dedupeKey.startsWith("passive:")) return "PASSIVE";
  return "ON_TRACK";
}

function weakTopicWorstScore(
  primary: CoachAction,
  studentId: string,
  lessons: DbLesson[],
  progress: DbProgress[]
): number | null {
  if (!primary.dedupeKey.startsWith("weak:")) return null;
  const modId = primary.dedupeKey.slice("weak:".length);
  let worst: number | null = null;
  for (const les of lessonsForModule(lessons, modId)) {
    const sc = progressForLesson(progress, studentId, les.id)?.last_quiz_score_percent;
    if (sc != null && sc < LOW_SCORE_THRESHOLD) {
      if (worst == null || sc < worst) worst = sc;
    }
  }
  return worst;
}

function mergeCoachDraftWithDemoFallbacks(
  studentId: string,
  draft: Omit<BuildTodaysFocusInput, "studentName">
): Omit<BuildTodaysFocusInput, "studentName"> {
  const fb = getDemoPersonaCoachFallback(studentId);
  const lessonTrimmed = draft.lessonName.trim();
  const lessonName =
    lessonTrimmed.length > 0 ? draft.lessonName : (fb?.lessonName?.trim() || draft.lessonName);

  const hadQuiz =
    draft.quizName != null &&
    typeof draft.quizName === "string" &&
    draft.quizName.trim().length > 0;
  const quizName =
    hadQuiz ? draft.quizName : fb?.quizName != null ? fb.quizName : draft.quizName;

  const score =
    draft.state === "STRUGGLING" && draft.score == null ? (fb?.score ?? draft.score) : draft.score;

  const lastActivityDate = draft.lastActivityDate ?? fb?.lastActivityDate;

  return {
    ...draft,
    lessonName,
    quizName,
    score,
    lastActivityDate,
  };
}

/**
 * PASSIVE demo sugar: treat the lesson title segment before the first spaced dash as the topic/module label.
 * Primary delimiter is en-dash "–"; em-dash or " - " handled as lightweight fallback — no sequencing logic.
 */
function passiveModuleTitleFromLessonTitle(lessonTitle: string): string {
  const trimmed = lessonTitle.trim();
  if (!trimmed) return "";
  let cut = -1;
  for (const sep of ["\u2013", "\u2014"] as const) {
    const idx = trimmed.indexOf(sep);
    if (idx !== -1 && (cut === -1 || idx < cut)) cut = idx;
  }
  if (cut === -1) {
    const hy = trimmed.search(/\s-\s/);
    if (hy !== -1) return trimmed.slice(0, hy).trim();
    return trimmed;
  }
  return trimmed.slice(0, cut).trim();
}

/** Deterministic PASSIVE quiz line for demos: `{topic}` from lesson title — not a real quiz index. */
function passiveQuizDisplayNameFromLessonTitle(lessonTitle: string): string {
  const moduleName = passiveModuleTitleFromLessonTitle(lessonTitle);
  if (!moduleName) return "";
  return `Quiz 1 — ${moduleName}`;
}

/** PASSIVE only: replace generic DB quiz titles when we have a usable lesson title. */
function applyPassiveQuizNameDerivation(
  draft: Omit<BuildTodaysFocusInput, "studentName">
): Omit<BuildTodaysFocusInput, "studentName"> {
  if (draft.state !== "PASSIVE") return draft;
  const lessonTrimmed = draft.lessonName.trim();
  if (!lessonTrimmed) return draft;
  const derived = passiveQuizDisplayNameFromLessonTitle(lessonTrimmed);
  if (!derived.trim()) return draft;
  return { ...draft, quizName: derived };
}

/** Shared motivational templates only — interpolate facts; callers supply state from coach rules. */
export function buildTodaysFocus(input: BuildTodaysFocusInput): TodaysFocusCopy {
  const name = input.studentName.trim() || "there";
  const lesson = input.lessonName.trim() || "your next lesson";
  const quiz =
    input.quizName != null && String(input.quizName).trim() !== ""
      ? String(input.quizName).trim()
      : "the checkpoint quiz";
  const lid = input.focalLessonId ?? null;

  switch (input.state) {
    case "RETURNING": {
      const dateStr = input.lastActivityDate?.trim();
      const signalContext = dateStr
        ? `You were last here ${dateStr}.`
        : "It looks like you've been away for a little while.";
      return {
        state: input.state,
        signalContext,
        headline: `Nice to have you back, ${name}. You're in a good position to keep going.`,
        body: "Everything you worked on still counts. One lesson today and you'll be right back in the flow.",
        whyThisMatters: "Picking this up now will make the next lesson much easier to follow.",
        nextStep: lesson,
        ctaLabel: "Jump back into lesson",
        ctaTarget: { type: "lesson", lessonId: lid },
      };
    }
    case "STRUGGLING": {
      const pctRaw = input.score ?? 0;
      const pct = Math.round(Number(pctRaw));
      const signalContext = pct > 0
        ? `Last checkpoint: ${pct}%.`
        : "Your recent results gave us something useful to work with.";
      return {
        state: input.state,
        signalContext,
        headline: "You're close — let's tighten up this part before moving on.",
        body: `Your last quiz was ${pct}%. You've got the foundations — now we just need to strengthen a few key parts.`,
        whyThisMatters: "Getting this clear now will make the next topics much easier.",
        nextStep: lesson,
        ctaLabel: "Review this concept",
        ctaTarget: { type: "lesson", lessonId: lid },
      };
    }
    case "PASSIVE":
      return {
        state: input.state,
        signalContext: "You've already watched this lesson — great work getting started.",
        headline: "You've covered the content — now it's time to test it.",
        body: "You've moved through the lesson, but haven't tested your understanding yet. A quick attempt will show exactly where you stand.",
        whyThisMatters:
          "Trying the quiz now gives you a clear signal — either you're ready to move on, or you'll know exactly what to revisit.",
        nextStep: quiz,
        ctaLabel: "Go to quiz",
        ctaTarget: { type: "quiz", lessonId: lid },
        ctaByline: "Quiz opens in the full Matrix+ platform",
      };
    case "ON_TRACK":
      return {
        state: input.state,
        signalContext: null,
        headline: "You're in a good position to keep moving.",
        body: "Your recent work is in a solid range — keep that momentum going.",
        whyThisMatters: "Staying on track here means the next topic will feel more straightforward.",
        nextStep: lesson,
        ctaLabel: "Continue lesson",
        ctaTarget: { type: "lesson", lessonId: lid },
      };
  }
}

function composeOnTrackOnly(
  studentId: string,
  fullStudentName: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[]
): TodaysFocus {
  const nextLes = firstNonCompletedLesson(studentId, modules, lessons, progress);
  const focalLessonId = nextLes?.id ?? null;
  const firstName = fullStudentName.split(" ")[0] ?? fullStudentName;
  let draft: Omit<BuildTodaysFocusInput, "studentName"> = {
    state: "ON_TRACK",
    lessonName: nextLes?.title ?? "",
    focalLessonId,
  };
  draft = mergeCoachDraftWithDemoFallbacks(studentId, draft);
  const copy = buildTodaysFocus({
    studentName: firstName,
    ...draft,
  });
  return {
    ...copy,
    focalLessonId,
    supportHelp: null,
  };
}

/**
 * Compose Today’s Focus for a student row: resolves focal lesson/quiz/score from the coach priority
 * actions, merges demo-persona fallbacks when needed, then runs `buildTodaysFocus` templates.
 */
export function composeTodaysFocus(
  studentId: string,
  fullStudentName: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[],
  precomputedActions: CoachAction[] | undefined,
  quizzes: DbQuiz[],
  passiveCoach: PassiveCoachObject | null | undefined
): TodaysFocus {
  const actions = precomputedActions ?? [];

  const primary = actions[0];

  if (!primary || modules.length === 0) {
    return composeOnTrackOnly(studentId, fullStudentName, modules, lessons, progress);
  }

  const { focalLessonId, weakScore } = resolveFocal(primary, studentId, modules, lessons, progress, events);
  const focalLes = focalLessonId ? lessonById(lessons, focalLessonId) : undefined;
  let lesson_name = focalLes?.title ?? "";
  const quizRow = focalLessonId ? quizzes.find((q) => q.lesson_id === focalLessonId) : undefined;

  let quiz_name: string | null | undefined =
    quizRow?.title ??
    (passiveCoach && passiveCoach.key === `passive:${focalLessonId ?? ""}` ? passiveCoach.quizName : null);

  const state = engineStateFromPrimary(primary);

  const scoreMerged =
    state === "STRUGGLING"
      ? (weakTopicWorstScore(primary, studentId, lessons, progress) ??
        weakScore ??
        (focalLessonId
          ? progressForLesson(progress, studentId, focalLessonId)?.last_quiz_score_percent ?? null
          : null))
      : null;

  const firstName = fullStudentName.split(" ")[0] ?? fullStudentName;

  let draft: Omit<BuildTodaysFocusInput, "studentName"> = {
    state,
    lessonName: lesson_name,
    quizName: quiz_name,
    score: scoreMerged,
    focalLessonId,
  };

  draft = mergeCoachDraftWithDemoFallbacks(studentId, draft);
  draft = applyPassiveQuizNameDerivation(draft);
  const copy = buildTodaysFocus({
    studentName: firstName,
    ...draft,
  });

  const supportHelp =
    copy.state === "RETURNING" || copy.state === "STRUGGLING" ? TODAYS_FOCUS_SUPPORT_HELP : null;

  return {
    ...copy,
    focalLessonId,
    supportHelp,
  };
}

/**
 * Coaching strings on the Lessons coach strip must originate from {@link composeTodaysFocus} /
 * {@link buildTodaysFocus} only — this mapper adds non-motivational card chrome (`nextStep` prefix layout).
 */
export const COACH_CARD_NEXT_STEP_PREFIX = "Next step:" as const;

export type TodaysFocusCardCopy = {
  /** Eyebrow fallback when student name omitted in UI chrome; motivational lines come from `TodaysFocus`. */
  label: string;
  signalContext: string | null;
  headline: string;
  body: string;
  whyMatters: string;
  nextStepPrefix: typeof COACH_CARD_NEXT_STEP_PREFIX;
  nextStepLesson: string;
  ctaLabel: string;
  ctaByline?: string | null;
};

export function todaysFocusToCoachCopy(tf: TodaysFocus): TodaysFocusCardCopy {
  return {
    label: "Today's focus",
    signalContext: tf.signalContext,
    headline: tf.headline,
    body: tf.body,
    whyMatters: tf.whyThisMatters,
    nextStepPrefix: COACH_CARD_NEXT_STEP_PREFIX,
    nextStepLesson: tf.nextStep,
    ctaLabel: tf.ctaLabel,
    ctaByline: tf.ctaByline ?? null,
  };
}
