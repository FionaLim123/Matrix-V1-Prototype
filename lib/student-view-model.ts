/**
 * Single coaching view model for /student and /dashboard — same summaries + actions from getCoachForStudent.
 * Matrix+ student Lessons also gets `todaysFocus` via `composeTodaysFocus` (see lib/todays-focus.ts).
 */

import { getCoachForStudent } from "@/lib/coach";
import { composeTodaysFocus, type TodaysFocus } from "@/lib/todays-focus";
import type { DbEvent, DbLesson, DbModule, DbProgress, DbQuiz } from "@/lib/recommendations";
export function buildStudentCoachingViewModel(
  selected: { id: string; name: string },
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[],
  quizzes: DbQuiz[] = []
) {
  const { summaries, actions, passiveCoach } = getCoachForStudent(
    selected.id,
    selected.name,
    modules,
    lessons,
    progress,
    events,
    quizzes
  );

  const firstName = selected.name.split(" ")[0] ?? selected.name;
  const totalLessons = lessons.length;
  const completedLessons = progress.filter(
    (p) => p.student_id === selected.id && p.status === "completed"
  ).length;

  const todaysFocus: TodaysFocus = composeTodaysFocus(
    selected.id,
    selected.name,
    modules,
    lessons,
    progress,
    events,
    actions,
    quizzes,
    passiveCoach
  );

  return {
    firstName,
    topicSummaries: summaries,
    actions,
    passiveCoach,
    todaysFocus,
    completedLessons,
    totalLessons,
    emptySummariesMessage: "No summary yet.",
    emptyActionsMessage: studentEmptyActionsMessage(),
  };
}

/** Friendly line when the coach returns no actions. */
export function studentEmptyActionsMessage(): string {
  return "You're all caught up for now — check back after your next lesson.";
}
