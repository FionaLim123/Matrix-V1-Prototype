"use client";

import type { PersonaPrototypePack } from "@/lib/matrix-persona-prototype-pack";
import { activityFeedMock, lessonsMock } from "./mock-data";
import { ActivityAnnouncementsSidebar } from "@/components/matrix-lessons";
import { CoachCard } from "./CoachCard";
import { LessonsList } from "./LessonsList";
import { LessonsNavSidebar } from "./LessonsNavSidebar";
import { MatrixCourseHeader } from "./MatrixCourseHeader";
import { MatrixIconRail } from "./MatrixIconRail";

/**
 * Returning persona — Magic Patterns shell; coach strip is `composeTodaysFocus` output only.
 */
export function DrewPassiveLessonsOverviewScreen({
  studentDisplayName,
  todaysFocus,
}: PersonaPrototypePack) {
  const handleCoachCta = () => {
    document.getElementById("coach-next-lesson")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-matrix-bg font-sans text-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <MatrixIconRail />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <MatrixCourseHeader studentName={studentDisplayName} />

          <div className="mx-auto flex w-full max-w-[1600px] flex-1 overflow-hidden px-6">
            <div className="h-full w-48 flex-shrink-0 overflow-y-auto">
              <LessonsNavSidebar />
            </div>

            <main className="h-full min-w-0 flex-1 overflow-y-auto px-8 py-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
              </div>

              <CoachCard
                todaysFocus={todaysFocus}
                studentDisplayName={studentDisplayName}
                onCoachCta={handleCoachCta}
              />
              <LessonsList lessons={lessonsMock} coachFocusLessonId={todaysFocus.focalLessonId} />
            </main>

            <div className="h-full w-64 flex-shrink-0 overflow-y-auto">
              <ActivityAnnouncementsSidebar activityFeed={activityFeedMock} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
