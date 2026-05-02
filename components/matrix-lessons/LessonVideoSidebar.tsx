import { Check, ChevronDown, ChevronRight } from "lucide-react";

/**
 * Lesson tree sidebar for Matrix video-lesson layouts (Magic Patterns LessonSidebar).
 */
export function LessonVideoSidebar() {
  return (
    <aside className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <button
          type="button"
          className="flex items-center text-sm font-bold text-gray-900 hover:text-matrix-maroon transition-colors"
        >
          <ChevronDown size={16} className="mr-2" />
          Expand all
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 group cursor-default">
          <span className="text-sm font-bold text-gray-900 group-hover:text-matrix-maroon pr-4 leading-tight">
            Meet Max — your Matrix AI tutor for Maths...!
          </span>
          <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>

        <div className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 group cursor-default">
          <span className="text-sm font-bold text-gray-900 group-hover:text-matrix-maroon pr-4 leading-tight">
            Course Introduction
          </span>
          <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>

        <div className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 group cursor-default">
          <span className="text-sm font-bold text-gray-900 group-hover:text-matrix-maroon pr-4 leading-tight">
            Work Book Solutions
          </span>
          <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>

        <div className="bg-gray-50/50">
          <div className="px-4 py-3 flex items-start justify-between cursor-default">
            <span className="text-sm font-bold text-gray-900 pr-4 leading-tight">
              Lesson 1 — Further Trigonometry 1
            </span>
            <ChevronDown
              size={16}
              className="text-gray-900 shrink-0 mt-0.5 transform rotate-180"
            />
          </div>

          <div className="pl-4 pr-2 pb-2 relative">
            <div className="absolute left-6 top-0 bottom-4 w-px bg-gray-300" />

            <div className="flex items-start py-2.5 pl-6 relative group cursor-default">
              <div className="absolute left-2 top-3.5 w-2 h-px bg-gray-300" />
              <Check size={14} className="text-matrix-teal mr-2 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-gray-900 leading-tight">
                Theory Lesson Video — Lesson 1 — Video 1
              </span>
            </div>

            <div className="flex items-start py-2.5 pl-6 relative group cursor-default">
              <div className="absolute left-2 top-3.5 w-2 h-px bg-gray-300" />
              <Check size={14} className="text-matrix-teal mr-2 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-gray-900 leading-tight">
                Theory Lesson Video — Lesson 1 — Video 2
              </span>
            </div>

            <div className="flex items-start py-2.5 pl-6 relative group cursor-default">
              <div className="absolute left-2 top-3.5 w-2 h-px bg-gray-300" />
              <Check size={14} className="text-matrix-teal mr-2 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-gray-900 leading-tight">
                Theory Lesson Video — Lesson 1 — Video 3
              </span>
            </div>

            <div className="flex items-start py-2.5 pl-6 relative group cursor-default">
              <div className="absolute left-2 top-3.5 w-2 h-px bg-gray-300" />
              <Check size={14} className="text-matrix-teal mr-2 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-gray-900 leading-tight">
                Theory Lesson Video — Lesson 1 — Video 4
              </span>
            </div>

            <div className="flex items-start py-2.5 pl-6 relative group cursor-default">
              <div className="absolute left-2 top-3.5 w-2 h-px bg-gray-300" />
              <ChevronRight size={14} className="text-gray-400 mr-2 shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-gray-600 leading-tight">Quiz 1</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 group cursor-default">
          <span className="text-sm font-bold text-gray-900 group-hover:text-matrix-maroon pr-4 leading-tight">
            Lesson 2 — Further Trigonometry 2
          </span>
          <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>

        <div className="px-4 py-3 flex items-start justify-between hover:bg-gray-50 group cursor-default">
          <span className="text-sm font-bold text-gray-900 group-hover:text-matrix-maroon pr-4 leading-tight">
            Lesson 3 — Introductory Calculus 1
          </span>
          <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        </div>
      </div>
    </aside>
  );
}
