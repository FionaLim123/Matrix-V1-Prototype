import { BookOpen, FileText, MessageSquare } from "lucide-react";

/**
 * Lessons / Assignments / Discussion — Magic Patterns SidebarLeft.
 */
export function LessonsNavSidebar() {
  return (
    <aside className="w-full py-6 pr-2">
      <nav className="space-y-1" aria-label="Course sections">
        <div className="flex items-center px-3 py-2.5 bg-white rounded-r-lg border-l-4 border-matrix-maroon text-gray-900 font-bold text-sm shadow-sm">
          <BookOpen size={16} className="mr-3 text-matrix-maroon" />
          Lessons
        </div>
        <div className="flex items-center px-3 py-2.5 text-gray-600 rounded-r-lg font-medium text-sm border-l-4 border-transparent">
          <FileText size={16} className="mr-3 text-gray-400" />
          Assignments
        </div>
        <div className="flex items-center px-3 py-2.5 text-gray-600 rounded-r-lg font-medium text-sm border-l-4 border-transparent">
          <MessageSquare size={16} className="mr-3 text-gray-400" />
          Discussion boards
        </div>
      </nav>
    </aside>
  );
}
