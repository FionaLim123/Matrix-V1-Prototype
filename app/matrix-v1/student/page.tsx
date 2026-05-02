import MatrixStudentLessonsCore from "@/components/matrix-v1/MatrixStudentLessonsCore";

export const dynamic = "force-dynamic";

type SearchParams = { student?: string };

/**
 * Presentation guardrails (Matrix+ /matrix-v1/student — keep when changing this file):
 * 1) Lessons-first: the screen is a Lessons page; Today’s Focus is only an embedded strip at the top
 *    of the lessons column, not a separate hero or product surface.
 * 2) Controlled visual weight: moderate padding and border contrast for that strip; no oversized gap
 *    or floating-card treatment separating it from the list.
 * 3) Lesson list body unchanged: “Your lessons”, module panels, lesson rows, status badges, and quiz
 *    lines stay exactly as the main body — do not remove or restructure them here.
 */
export default async function MatrixV1StudentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { student: studentParam } = await searchParams;
  return <MatrixStudentLessonsCore studentParam={studentParam} />;
}
