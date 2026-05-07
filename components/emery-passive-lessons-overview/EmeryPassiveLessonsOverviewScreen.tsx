"use client";

import { useState } from "react";
import type { PersonaPrototypePack } from "@/lib/matrix-persona-prototype-pack";
import { activityFeedMock, lessonsMock } from "./mock-data";
import { ActivityAnnouncementsSidebar } from "@/components/matrix-lessons";
import { CoachCard } from "./CoachCard";
import { LessonsList } from "./LessonsList";
import { LessonsNavSidebar } from "./LessonsNavSidebar";
import { MatrixCourseHeader } from "./MatrixCourseHeader";
import { MatrixIconRail } from "./MatrixIconRail";

export type EmeryPassiveLessonsOverviewProps = PersonaPrototypePack;

/**
 * Passive persona · lessons overview — coach strip from `composeTodaysFocus` output only.
 */
export function EmeryPassiveLessonsOverviewScreen({
  studentDisplayName,
  todaysFocus,
}: EmeryPassiveLessonsOverviewProps) {
  const [quizClicked, setQuizClicked] = useState(false);

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
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Lessons</h2>

              <CoachCard
                todaysFocus={todaysFocus}
                studentDisplayName={studentDisplayName}
                onGoToQuiz={() => setQuizClicked(true)}
                showCtaByline={quizClicked}
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

export { EmeryPassiveLessonsOverviewScreen as EmeryLessonsScreen };
