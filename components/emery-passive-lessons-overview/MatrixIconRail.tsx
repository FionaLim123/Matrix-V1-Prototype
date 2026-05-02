import { Home, Users, Star, HelpCircle } from "lucide-react";

/**
 * Left maroon icon rail — Magic Patterns IconSidebar (static).
 */
export function MatrixIconRail() {
  return (
    <aside className="flex h-full min-h-0 w-14 shrink-0 self-stretch flex-col items-center border-r border-matrix-maroon bg-matrix-maroon py-4">
      <div className="mb-6 flex flex-col items-center">
        <div
          className="text-matrix-red font-black text-xl leading-none"
          style={{ fontFamily: "Georgia, serif" }}
        >
          M
        </div>
        <div className="flex flex-col items-center mt-[3px] space-y-[2px]">
          <div className="w-4 h-[2px] bg-matrix-red rounded-full" />
          <div className="w-4 h-[2px] bg-matrix-red rounded-full" />
        </div>
      </div>

      <nav className="flex flex-col items-center space-y-1 w-full" aria-label="Primary icon navigation">
        <div className="w-full h-11 flex items-center justify-center text-white/50">
          <Home size={20} strokeWidth={1.5} />
        </div>

        <div className="w-full h-11 flex items-center justify-center text-white relative">
          <Users size={20} strokeWidth={1.5} />
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#4EADD5] rounded-r-full" />
        </div>
      </nav>

      <div className="flex flex-col items-center space-y-1 mt-auto w-full">
        <div className="w-full h-11 flex items-center justify-center text-white/50">
          <Star size={20} strokeWidth={1.5} />
        </div>
        <div className="w-full h-11 flex items-center justify-center text-white/50">
          <HelpCircle size={20} strokeWidth={1.5} />
        </div>
      </div>
    </aside>
  );
}
