import { createAdminClient } from "@/lib/supabase/admin";
import {
  type DbCourse,
  type DbEvent,
  type DbLesson,
  type DbModule,
  type DbProgress,
  type DbQuiz,
  type DbStudent,
} from "@/lib/recommendations";

export type DashboardData = {
  students: DbStudent[];
  courses: DbCourse[];
  modules: DbModule[];
  lessons: DbLesson[];
  progress: DbProgress[];
  events: DbEvent[];
  quizzes: DbQuiz[];
};

/**
 * Load events **only** for the students we already selected — never a global “latest N in the
 * table”. Do not add a `created_at` lower bound: it can drop every row in some DB/timezone setups
 * and make the app think nobody has any activity.
 */
const EVENTS_MAX_ROWS = 50_000;
/** Supabase `in()` lists that are too long can break requests; chunk and merge. */
const EVENTS_STUDENT_ID_CHUNK = 150;

async function loadEventsForDashboardStudents(
  supabase: ReturnType<typeof createAdminClient>,
  studentIds: string[]
): Promise<DbEvent[]> {
  if (studentIds.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < studentIds.length; i += EVENTS_STUDENT_ID_CHUNK) {
    chunks.push(studentIds.slice(i, i + EVENTS_STUDENT_ID_CHUNK));
  }
  const parts = await Promise.all(
    chunks.map((ids) =>
      supabase
        .from("events")
        .select("event_type, student_id, lesson_id, created_at, metadata")
        .in("student_id", ids)
        .order("created_at", { ascending: false })
        .limit(EVENTS_MAX_ROWS)
    )
  );
  for (const p of parts) {
    if (p.error) throw p.error;
  }
  const merged = parts.flatMap((p) => (p.data ?? []) as DbEvent[]);
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return merged.slice(0, EVENTS_MAX_ROWS);
}

/** Loads all rows needed for staff dashboard + coach. Safe to call when env is valid. */
export async function loadDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();

  const [sRes, cRes, mRes, lRes, pRes, qRes] = await Promise.all([
    supabase.from("students").select("id, name, email").order("name"),
    supabase.from("courses").select("id, title, slug").order("title"),
    supabase.from("modules").select("id, course_id, title, order_index").order("order_index"),
    supabase.from("lessons").select("id, module_id, title, is_revision, order_index").order("order_index"),
    supabase
      .from("student_progress")
      .select("student_id, lesson_id, status, last_quiz_score_percent, updated_at"),
    supabase.from("quizzes").select("id, lesson_id, title").order("lesson_id"),
  ]);

  if (sRes.error) throw sRes.error;
  if (cRes.error) throw cRes.error;
  if (mRes.error) throw mRes.error;
  if (lRes.error) throw lRes.error;
  if (pRes.error) throw pRes.error;
  if (qRes.error) throw qRes.error;

  const students = (sRes.data ?? []) as DbStudent[];
  const studentIds = students.map((s) => s.id);
  const events = await loadEventsForDashboardStudents(supabase, studentIds);

  return {
    students,
    courses: (cRes.data ?? []) as DbCourse[],
    modules: (mRes.data ?? []) as DbModule[],
    lessons: (lRes.data ?? []) as DbLesson[],
    progress: (pRes.data ?? []) as DbProgress[],
    events,
    quizzes: (qRes.data ?? []) as DbQuiz[],
  };
}
