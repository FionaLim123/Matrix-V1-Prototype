import { Bell, Calendar, ChevronDown, Mail, User } from "lucide-react";

type Props = {
  studentName: string;
};

/**
 * Course title + notifications + avatar — Magic Patterns Header.
 */
export function MatrixCourseHeader({ studentName }: Props) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 text-gray-900">
      <div className="flex items-center">
        <h1 className="text-lg font-bold tracking-tight text-gray-900">Year 11 Maths Advanced</h1>
      </div>

      <div className="flex items-center space-x-5">
        <div className="text-gray-500">
          <Mail size={20} />
        </div>

        <div className="text-gray-500 relative">
          <Bell size={20} />
          <span className="absolute -top-1.5 -right-1.5 bg-matrix-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
            2
          </span>
        </div>

        <div className="text-gray-500">
          <Calendar size={20} />
        </div>

        <div className="flex items-center space-x-3 ml-2 pl-4 border-l border-gray-200">
          <span className="text-sm font-medium text-gray-700">{studentName}</span>
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-cyan-400 flex items-center justify-center overflow-hidden border-2 border-gray-100">
              <User size={20} className="text-white mt-2" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm">
              <ChevronDown size={10} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
