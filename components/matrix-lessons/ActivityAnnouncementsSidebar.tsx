import { Activity, FileText, Megaphone } from "lucide-react";

/** One line in the Activity list (e.g. “A user” + description). */
export type ActivityFeedItem = {
  title: string;
  description: string;
};

type Props = {
  activityFeed: ActivityFeedItem[];
};

/**
 * Right column: Activity + Announcements — shared across all Matrix “lessons pattern” student screens
 * (Magic Patterns SidebarRight fidelity). Import from `@/components/matrix-lessons` on new lessons UIs
 * so spacing and chrome stay in sync.
 */
export function ActivityAnnouncementsSidebar({ activityFeed }: Props) {
  return (
    <aside className="w-full py-6 pl-2 space-y-4">
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <header className="px-4 py-2.5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            <Activity size={16} className="text-matrix-maroon mr-2" />
            <h2 className="font-bold text-gray-900 text-sm">Activity</h2>
          </div>
          <div className="w-2.5 h-2.5 shrink-0 rounded-full bg-matrix-teal ring-[3px] ring-matrix-teal/20" />
        </header>
        <div className="px-4 py-2.5 space-y-1">
          {activityFeed.map((item) => (
            <div key={`${item.title}-${item.description}`} className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0 text-gray-400">
                <FileText size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-snug">{item.title}</p>
                <p className="text-[11px] text-gray-500 mt-px leading-snug">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <header className="px-4 py-2.5 border-b border-gray-50 flex items-center">
          <Megaphone size={16} className="text-matrix-maroon mr-2" />
          <h2 className="font-bold text-gray-900 text-sm">Announcements</h2>
        </header>
        <div className="px-4 py-2.5 flex items-center text-gray-500 text-xs">
          <Megaphone size={12} className="mr-2 shrink-0 opacity-50" />
          None
        </div>
      </section>
    </aside>
  );
}
