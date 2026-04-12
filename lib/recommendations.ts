/**
 * Rule-based recommendations (no AI).
 * Plain English: we look at progress + events and apply a few if/then rules.
 */

export type DbStudent = { id: string; name: string; email: string | null };
export type DbCourse = { id: string; title: string; slug: string };
/** Course section (e.g. "Term 1") — named DbModule to avoid clashing with JS `Module`. */
export type DbModule = { id: string; course_id: string; title: string; order_index: number };
export type DbLesson = {
  id: string;
  module_id: string;
  title: string;
  is_revision: boolean;
  order_index: number;
};
export type DbProgress = {
  student_id: string;
  lesson_id: string;
  status: string;
  last_quiz_score_percent: number | null;
};
export type DbEvent = {
  event_type: string;
  student_id: string;
  lesson_id: string | null;
  created_at: string;
};

export type Recommendation = {
  rule: "low_quiz_score" | "lesson_not_finished" | "inactive_7_days";
  student_id: string;
  student_name: string;
  message: string;
  detail: string;
};

export const LOW_SCORE_THRESHOLD = 70;
export const INACTIVE_DAYS = 7;

export function daysAgo(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function lessonById(lessons: DbLesson[], id: string): DbLesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function revisionLessonInModule(lessons: DbLesson[], moduleId: string): DbLesson | undefined {
  return lessons
    .filter((l) => l.module_id === moduleId && l.is_revision)
    .sort((a, b) => a.order_index - b.order_index)[0];
}

export function nextLessonInModule(lessons: DbLesson[], moduleId: string, afterOrderIndex: number): DbLesson | undefined {
  return lessons
    .filter((l) => l.module_id === moduleId && l.order_index > afterOrderIndex)
    .sort((a, b) => a.order_index - b.order_index)[0];
}

export function lastEventTime(events: DbEvent[], studentId: string): Date | null {
  const times = events
    .filter((e) => e.student_id === studentId)
    .map((e) => new Date(e.created_at));
  if (times.length === 0) return null;
  return new Date(Math.max(...times.map((t) => t.getTime())));
}

export function buildRecommendations(
  students: DbStudent[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
): Recommendation[] {
  const out: Recommendation[] = [];
  const now = new Date();
  const cutoff = daysAgo(now, INACTIVE_DAYS);

  for (const s of students) {
    const studentEvents = events.filter((e) => e.student_id === s.id);

    // Rule: quiz score < 70% → suggest revision lesson in the same module
    for (const row of progress.filter((p) => p.student_id === s.id)) {
      const score = row.last_quiz_score_percent;
      if (score != null && score < LOW_SCORE_THRESHOLD) {
        const baseLesson = lessonById(lessons, row.lesson_id);
        const modId = baseLesson?.module_id;
        const revision = modId ? revisionLessonInModule(lessons, modId) : undefined;
        const target = revision ?? baseLesson;
        out.push({
          rule: "low_quiz_score",
          student_id: s.id,
          student_name: s.name,
          message: "Retry with a revision lesson",
          detail: target
            ? `Latest quiz on "${baseLesson?.title ?? "a lesson"}" was ${score}%. Next step: "${target.title}".`
            : `Latest quiz score was ${score}%. Add a revision lesson in the same module in the database to link this rule to content.`,
        });
      }
    }

    // Rule: lesson opened but not completed → nudge to finish
    const opened = new Set(
      studentEvents.filter((e) => e.event_type === "lesson_opened" && e.lesson_id).map((e) => e.lesson_id as string)
    );
    const completed = new Set(
      studentEvents.filter((e) => e.event_type === "lesson_completed" && e.lesson_id).map((e) => e.lesson_id as string)
    );
    for (const lessonId of opened) {
      if (!completed.has(lessonId)) {
        const les = lessonById(lessons, lessonId);
        out.push({
          rule: "lesson_not_finished",
          student_id: s.id,
          student_name: s.name,
          message: "Finish the lesson you started",
          detail: les
            ? `Opened "${les.title}" but no completion event yet.`
            : "Opened a lesson but no completion event yet.",
        });
      }
    }

    // Rule: no activity for 7 days → suggest restarting with the next lesson in the module
    const last = lastEventTime(events, s.id);
    if (last && last < cutoff) {
      const studentProgress = progress.filter((p) => p.student_id === s.id);
      const sortedByUpdate = [...studentProgress].sort((a, b) => {
        // use lesson order as proxy for "where they were"
        const la = lessonById(lessons, a.lesson_id);
        const lb = lessonById(lessons, b.lesson_id);
        return (la?.order_index ?? 0) - (lb?.order_index ?? 0);
      });
      const focal = sortedByUpdate[sortedByUpdate.length - 1];
      const focalLesson = focal ? lessonById(lessons, focal.lesson_id) : undefined;
      const moduleId = focalLesson?.module_id;
      const next =
        moduleId && focalLesson
          ? nextLessonInModule(lessons, moduleId, focalLesson.order_index)
          : lessons.sort((a, b) => a.order_index - b.order_index)[0];

      out.push({
        rule: "inactive_7_days",
        student_id: s.id,
        student_name: s.name,
        message: "Come back — pick up the next lesson",
        detail: next
          ? `No activity since ${last.toISOString().slice(0, 10)}. Suggested next: "${next.title}".`
          : `No activity since ${last.toISOString().slice(0, 10)}. Add more lessons or check progress rows.`,
      });
    }
  }

  // De-dupe same rule + student + similar detail (keep demo list readable)
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.rule}:${r.student_id}:${r.message}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
