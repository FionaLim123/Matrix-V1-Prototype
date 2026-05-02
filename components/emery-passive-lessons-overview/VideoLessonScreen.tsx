"use client";

import { useState } from "react";

import { LessonVideoSidebar } from "@/components/matrix-lessons";
import { fallbackDisplayNameForPersona } from "@/lib/demo-personas";

import {
  EmeryLessonVideoColumn,
  type EmeryCheckState,
  type EmeryVideoSurface,
} from "./emery-lesson-video-column";
import { MatrixCourseHeader } from "./MatrixCourseHeader";
import { MatrixIconRail } from "./MatrixIconRail";

type Props = {
  onBackToLessons: () => void;
  /** Full name from live pack / roster (see `fallbackDisplayNameForPersona` for story-only fallback). */
  studentDisplayName?: string;
};

/**
 * Magic Patterns layout: Icon rail + course header + Lesson 1 sidebar (w-64) + LessonVideoView column.
 * Micro-check state resets when this screen unmounts (EmeryFlow step change).
 */
export function VideoLessonScreen({ onBackToLessons, studentDisplayName }: Props) {
  /** Mirrors MP `LessonVideoView` — default `ended` shows micro-check overlay (no poster clutter). */
  const [videoState, setVideoState] = useState<EmeryVideoSurface>("ended");
  const [checkState, setCheckState] = useState<EmeryCheckState>("unanswered");
  const [q1Answer, setQ1Answer] = useState<string | null>(null);
  const [q2Answer, setQ2Answer] = useState<string | null>(null);

  const handleExit = () => {
    onBackToLessons();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-matrix-bg font-sans text-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <MatrixIconRail />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MatrixCourseHeader
            studentName={studentDisplayName ?? fallbackDisplayNameForPersona("emery")}
          />

          <div className="flex-1 flex px-6 max-w-[1600px] mx-auto w-full overflow-hidden min-h-0">
            <div className="w-64 flex-shrink-0 h-full min-h-0 overflow-y-auto bg-white">
              <LessonVideoSidebar />
            </div>

            <main className="flex min-h-0 flex-1 min-w-0 flex-col overflow-hidden px-6 py-3">
              <EmeryLessonVideoColumn
                videoState={videoState}
                setVideoState={setVideoState}
                checkState={checkState}
                setCheckState={setCheckState}
                q1Answer={q1Answer}
                q2Answer={q2Answer}
                setQ1Answer={setQ1Answer}
                setQ2Answer={setQ2Answer}
                onSuccessContinue={handleExit}
                onDismissVideoEnd={handleExit}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
