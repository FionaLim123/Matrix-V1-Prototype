import { createAdminClient } from "@/lib/supabase/admin";
import type { DbCourse, DbEvent, DbLesson, DbModule, DbProgress, DbStudent } from "@/lib/recommendations";

export type DashboardData = {
  students: DbStudent[];
  courses: DbCourse[];
  modules: DbModule[];
  lessons: DbLesson[];
  progress: DbProgress[];
  events: DbEvent[];
};

/** Loads all rows needed for staff dashboard + coach. Safe to call when env is valid. */
export async function loadDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();

  const [sRes, cRes, mRes, lRes, pRes, eRes] = await Promise.all([
    supabase.from("students").select("id, name, email").order("name"),
    supabase.from("courses").select("id, title, slug").order("title"),
    supabase.from("modules").select("id, course_id, title, order_index").order("order_index"),
    supabase.from("lessons").select("id, module_id, title, is_revision, order_index").order("order_index"),
    supabase.from("student_progress").select("student_id, lesson_id, status, last_quiz_score_percent"),
    supabase
      .from("events")
      .select("event_type, student_id, lesson_id, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  if (sRes.error) throw sRes.error;
  if (cRes.error) throw cRes.error;
  if (mRes.error) throw mRes.error;
  if (lRes.error) throw lRes.error;
  if (pRes.error) throw pRes.error;
  if (eRes.error) throw eRes.error;

  return {
    students: (sRes.data ?? []) as DbStudent[],
    courses: (cRes.data ?? []) as DbCourse[],
    modules: (mRes.data ?? []) as DbModule[],
    lessons: (lRes.data ?? []) as DbLesson[],
    progress: (pRes.data ?? []) as DbProgress[],
    events: (eRes.data ?? []) as DbEvent[],
  };
}
