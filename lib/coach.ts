/**
 * "Coach in your pocket" V1 — rules only, explainable.
 * Priority when merging actions: 1 inactive → 2 weak topic → 3 incomplete lesson → 4 strong next step.
 */

import {
  INACTIVE_DAYS,
  LOW_SCORE_THRESHOLD,
  daysAgo,
  lastEventTime,
  lessonById,
  nextLessonInModule,
  revisionLessonInModule,
  type DbEvent,
  type DbLesson,
  type DbModule,
  type DbProgress,
} from "@/lib/recommendations";

export type CoachAction = {
  priority: 1 | 2 | 3 | 4;
  dedupeKey: string;
  title: string;
  detail: string;
};

const STRONG_SCORE = 80;

function modulesSorted(modules: DbModule[]): DbModule[] {
  return [...modules].sort((a, b) => a.order_index - b.order_index);
}

function lessonsForModule(lessons: DbLesson[], moduleId: string): DbLesson[] {
  return lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
}

function progressForLesson(progress: DbProgress[], studentId: string, lessonId: string): DbProgress | undefined {
  return progress.find((p) => p.student_id === studentId && p.lesson_id === lessonId);
}

/** Next lesson in course order (module order_index, then lesson order_index). */
export function nextLessonGlobally(
  modules: DbModule[],
  lessons: DbLesson[],
  currentLessonId: string | null
): DbLesson | undefined {
  const orderedMods = modulesSorted(modules);
  if (!currentLessonId) {
    const m0 = orderedMods[0];
    if (!m0) return undefined;
    const first = lessonsForModule(lessons, m0.id)[0];
    return first;
  }
  const cur = lessonById(lessons, currentLessonId);
  if (!cur) {
    const m0 = orderedMods[0];
    return m0 ? lessonsForModule(lessons, m0.id)[0] : undefined;
  }
  const mod = orderedMods.find((m) => m.id === cur.module_id);
  if (!mod) return undefined;
  const inMod = nextLessonInModule(lessons, mod.id, cur.order_index);
  if (inMod) return inMod;
  const modIdx = orderedMods.findIndex((m) => m.id === mod.id);
  const nextMod = orderedMods[modIdx + 1];
  if (!nextMod) return undefined;
  return lessonsForModule(lessons, nextMod.id)[0];
}

/** Topic snapshot lines (module title = topic name for demo). */
export function getTopicSummaries(
  studentId: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
): string[] {
  const lines: string[] = [];
  const studentEvents = events.filter((e) => e.student_id === studentId);

  for (const mod of modulesSorted(modules)) {
    const modLessons = lessonsForModule(lessons, mod.id);
    if (modLessons.length === 0) continue;

    const scores: number[] = [];
    let hasActivity = false;
    for (const les of modLessons) {
      const p = progressForLesson(progress, studentId, les.id);
      if (p?.last_quiz_score_percent != null) scores.push(p.last_quiz_score_percent);
      if (p && p.status !== "not_started") hasActivity = true;
      const opened = studentEvents.some(
        (e) => e.lesson_id === les.id && (e.event_type === "lesson_opened" || e.event_type === "lesson_completed")
      );
      if (opened) hasActivity = true;
    }

    const minScore = scores.length ? Math.min(...scores) : null;
    const maxScore = scores.length ? Math.max(...scores) : null;

    if (minScore != null && minScore < LOW_SCORE_THRESHOLD) {
      lines.push(`You're struggling in ${mod.title} — latest quiz results are below the ${LOW_SCORE_THRESHOLD}% target.`);
    } else if (scores.length > 0 && minScore != null && minScore >= STRONG_SCORE) {
      lines.push(`You're doing well in ${mod.title} — scores are consistently strong.`);
    } else if (hasActivity && scores.length === 0) {
      lines.push(`${mod.title}: keep going — complete the next checkpoint quiz to see how you're tracking.`);
    } else if (!hasActivity) {
      lines.push(`${mod.title}: not started yet — when you're ready, open the first lesson.`);
    } else {
      lines.push(`${mod.title}: solid progress — keep completing lessons and quizzes to stay on track.`);
    }
  }

  return lines.length ? lines : ["Not enough activity yet to summarise topics — open a lesson to get started."];
}

type RawAction = CoachAction;

function collectCoachActions(
  studentId: string,
  studentName: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
): RawAction[] {
  const raw: RawAction[] = [];
  const now = new Date();
  const cutoff = daysAgo(now, INACTIVE_DAYS);
  const studentEvents = events.filter((e) => e.student_id === studentId);
  const last = lastEventTime(events, studentId);

  // 1 — Inactivity / re-engagement
  if (last && last < cutoff) {
    const studentProgress = progress.filter((p) => p.student_id === studentId);
    const opened = new Set(
      studentEvents.filter((e) => e.event_type === "lesson_opened" && e.lesson_id).map((e) => e.lesson_id as string)
    );
    const completed = new Set(
      studentEvents
        .filter((e) => e.event_type === "lesson_completed" && e.lesson_id)
        .map((e) => e.lesson_id as string)
    );
    let resumeLessonId: string | null = null;
    for (const lid of opened) {
      if (!completed.has(lid)) {
        resumeLessonId = lid;
        break;
      }
    }
    const focal =
      resumeLessonId ??
      studentProgress.sort((a, b) => {
        const la = lessonById(lessons, a.lesson_id);
        const lb = lessonById(lessons, b.lesson_id);
        return (la?.order_index ?? 0) - (lb?.order_index ?? 0);
      })[studentProgress.length - 1]?.lesson_id ??
      null;

    const next = nextLessonGlobally(modules, lessons, focal);
    const resumeTitle = focal ? lessonById(lessons, focal)?.title : null;
    raw.push({
      priority: 1,
      dedupeKey: "inactive",
      title: "Pick up where you left off",
      detail: `You haven't studied in over ${INACTIVE_DAYS} days (last activity ${last.toISOString().slice(0, 10)}).${
        resumeTitle
          ? ` Resume "${resumeTitle}" or start fresh with "${next?.title ?? "the next lesson"}" in your course.`
          : ` When you're ready, open "${next?.title ?? "your next lesson"}" to restart momentum.`
      }`,
    });
  }

  // 2 — Weak topic (module-level)
  for (const mod of modulesSorted(modules)) {
    const modLessons = lessonsForModule(lessons, mod.id);
    let worst: { lessonTitle: string; score: number } | null = null;
    for (const les of modLessons) {
      const p = progressForLesson(progress, studentId, les.id);
      const sc = p?.last_quiz_score_percent;
      if (sc != null && sc < LOW_SCORE_THRESHOLD) {
        if (!worst || sc < worst.score) worst = { lessonTitle: les.title, score: sc };
      }
    }
    if (worst) {
      const rev = revisionLessonInModule(lessons, mod.id);
      raw.push({
        priority: 2,
        dedupeKey: `weak:${mod.id}`,
        title: `Strengthen ${mod.title}`,
        detail: `Your last score on "${worst.lessonTitle}" was ${worst.score}%. ${
          rev
            ? `Review "${rev.title}" before moving on.`
            : "Redo the lesson checkpoint before moving on."
        }`,
      });
    }
  }

  // 3 — Incomplete lesson (opened, not completed)
  const opened = new Set(
    studentEvents.filter((e) => e.event_type === "lesson_opened" && e.lesson_id).map((e) => e.lesson_id as string)
  );
  const completed = new Set(
    studentEvents.filter((e) => e.event_type === "lesson_completed" && e.lesson_id).map((e) => e.lesson_id as string)
  );
  for (const lessonId of opened) {
    if (!completed.has(lessonId)) {
      const les = lessonById(lessons, lessonId);
      raw.push({
        priority: 3,
        dedupeKey: `incomplete:${lessonId}`,
        title: "Finish the lesson you started",
        detail: les
          ? `You opened "${les.title}" — complete the lesson and checkpoint so we can update your progress.`
          : "Complete the lesson you started so we can update your progress.",
      });
    }
  }

  // 4 — Strong next step (only if nothing more urgent, or as lower-ranked filler)
  const hasP123 = raw.some((r) => r.priority <= 3);
  const orderedMods = modulesSorted(modules);

  let latestStrongLesson: DbLesson | null = null;
  for (const mod of orderedMods) {
    for (const les of lessonsForModule(lessons, mod.id)) {
      const p = progressForLesson(progress, studentId, les.id);
      const sc = p?.last_quiz_score_percent;
      if (p?.status === "completed" && sc != null && sc >= STRONG_SCORE) {
        latestStrongLesson = les;
      }
    }
  }

  const nextAfterStrong = latestStrongLesson ? nextLessonGlobally(modules, lessons, latestStrongLesson.id) : undefined;

  if (!hasP123 && nextAfterStrong) {
    const nextMod = orderedMods.find((m) => m.id === nextAfterStrong.module_id);
    const firstName = studentName?.split(" ")[0] ?? "there";
    raw.push({
      priority: 4,
      dedupeKey: "next:strong",
      title: "You're ready for the next step",
      detail: `Great momentum, ${firstName}. Continue with "${nextAfterStrong.title}"${
        nextMod ? ` in ${nextMod.title}` : ""
      }.`,
    });
    raw.push({
      priority: 4,
      dedupeKey: "reflect:strong",
      title: "Quick win today",
      detail: `Spend 10–15 minutes previewing the next lesson so class time feels easier — small habits compound.`,
    });
  } else if (!hasP123 && !nextAfterStrong && orderedMods.length > 0) {
    const first = lessonsForModule(lessons, orderedMods[0].id)[0];
    if (first) {
      raw.push({
        priority: 4,
        dedupeKey: "next:start",
        title: "Start your next lesson",
        detail: `Open "${first.title}" to build your weekly study rhythm.`,
      });
    }
  } else if (hasP123 && nextAfterStrong && raw.filter((r) => r.priority <= 3).length < 3) {
    // Allow one progression hint as third item if we only have one urgent item
    const nextMod = orderedMods.find((m) => m.id === nextAfterStrong.module_id);
    raw.push({
      priority: 4,
      dedupeKey: "next:extra",
      title: "When you're ready, push ahead",
      detail: `After you close out today's priorities, continue with "${nextAfterStrong.title}"${nextMod ? ` (${nextMod.title})` : ""}.`,
    });
  }

  return raw;
}

/** Sort by priority, dedupe by dedupeKey, keep top 2–3. */
export function mergeCoachActions(candidates: RawAction[], max = 3): CoachAction[] {
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  const seen = new Set<string>();
  const out: CoachAction[] = [];
  for (const c of sorted) {
    if (seen.has(c.dedupeKey)) continue;
    seen.add(c.dedupeKey);
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}

export function getCoachForStudent(
  studentId: string,
  studentName: string,
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
): { summaries: string[]; actions: CoachAction[] } {
  const summaries = getTopicSummaries(studentId, modules, lessons, progress, events);
  const candidates = collectCoachActions(studentId, studentName, modules, lessons, progress, events);
  const actions = mergeCoachActions(candidates, 3);
  return { summaries, actions };
}

/** Map URL param aspen|emery|jordan or raw UUID to a student row. */
export function resolveDemoStudent(
  students: { id: string; name: string; email: string | null }[],
  param: string | undefined | null
): { id: string; name: string; email: string | null } | null {
  if (students.length === 0) return null;
  if (!param || !param.trim()) return students[0] ?? null;

  const p = param.trim().toLowerCase();
  if (p === "aspen") return students.find((s) => s.name.toLowerCase().includes("aspen")) ?? null;
  if (p === "emery") return students.find((s) => s.name.toLowerCase().includes("emery")) ?? null;
  if (p === "jordan") return students.find((s) => s.name.toLowerCase().includes("jordan")) ?? null;

  return students.find((s) => s.id === p) ?? students[0] ?? null;
}
