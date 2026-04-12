/**
 * Single coaching view model for /student and /dashboard — same summaries + actions from getCoachForStudent.
 */

import { getCoachForStudent } from "@/lib/coach";
import type { DbEvent, DbLesson, DbModule, DbProgress } from "@/lib/recommendations";

export function buildStudentCoachingViewModel(
  selected: { id: string; name: string },
  modules: DbModule[],
  lessons: DbLesson[],
  progress: DbProgress[],
  events: DbEvent[]
) {
  const { summaries, actions } = getCoachForStudent(selected.id, selected.name, modules, lessons, progress, events);
  const firstName = selected.name.split(" ")[0] ?? selected.name;
  const totalLessons = lessons.length;
  const completedLessons = progress.filter(
    (p) => p.student_id === selected.id && p.status === "completed"
  ).length;

  return {
    firstName,
    topicSummaries: summaries,
    actions,
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
