import type { LessonRow } from "./mock-data";
import { LessonItem } from "./LessonItem";

type Props = {
  lessons: LessonRow[];
  /** When it matches `lesson.dbLessonId`, that row receives `id="coach-next-lesson"` (from focal lesson in coaching rules). */
  coachFocusLessonId?: string | null;
};

/**
 * Status legend + lesson stack — mirrors Magic Patterns LessonList.
 */
export function LessonsList({ lessons, coachFocusLessonId }: Props) {
  return (
    <div>
      <div className="flex justify-end items-center space-x-5 mb-4 text-xs font-bold text-gray-700">
        <div className="flex items-center">
          <svg
            className="w-3.5 h-3.5 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Available
        </div>
        <div className="flex items-center">
          <svg
            className="w-3.5 h-3.5 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Partial
        </div>
        <div className="flex items-center">
          <svg
            className="w-3.5 h-3.5 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Completed
        </div>
      </div>

      {lessons.map((lesson) => (
        <LessonItem
          key={lesson.title}
          lesson={lesson}
          id={coachFocusLessonId && lesson.dbLessonId === coachFocusLessonId ? "coach-next-lesson" : undefined}
        />
      ))}
    </div>
  );
}
