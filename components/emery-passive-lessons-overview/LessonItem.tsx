import { ChevronDown, Play } from "lucide-react";

import type { LessonRow } from "./mock-data";

type Props = {
  lesson: LessonRow;
  /** Optional DOM id — used by persona coach CTAs to scroll the target lesson into view. */
  id?: string;
};

/**
 * Single lesson row — mirrors Magic Patterns LessonCard (static, no click handlers).
 */
export function LessonItem({ lesson, id }: Props) {
  const { title, imageColor, progress, sections, status } = lesson;

  return (
    <article id={id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4 scroll-mt-28">
      <div className="flex flex-col sm:flex-row p-3 gap-4 items-center sm:items-stretch">
        <div
          className={`w-full sm:w-44 h-28 rounded-lg flex-shrink-0 ${imageColor} relative overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-gradient-to-br from-black to-transparent" />
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white opacity-10 rounded-full" />
        </div>

        <div className="flex-1 flex flex-col justify-between py-1 w-full">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{title}</h3>
            <div className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center">
              {status}
              {status === "Completed" && (
                <svg
                  className="w-3 h-3 ml-1 text-gray-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
              <div className="relative w-4 h-4">
                <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 36 36" aria-hidden>
                  <path
                    className="text-gray-200"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-matrix-teal"
                    strokeWidth="4"
                    strokeDasharray={`${progress}, 100`}
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
              <span className="text-xs font-bold text-gray-900">
                {progress}% Resume
              </span>
              <Play size={12} className="text-gray-900 ml-0.5" />
            </div>

            <div className="flex items-center text-xs font-bold text-gray-900">
              {sections} sections
              <ChevronDown size={14} className="ml-1" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
