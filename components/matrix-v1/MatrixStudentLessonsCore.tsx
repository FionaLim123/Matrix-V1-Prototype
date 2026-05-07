import { resolveDemoStudent } from "@/lib/coach";
import { loadDashboardData } from "@/lib/dashboard-data";
import { COACH_CARD_NEXT_STEP_PREFIX } from "@/lib/todays-focus";
import type { DbLesson, DbModule, DbProgress } from "@/lib/recommendations";
import { buildStudentCoachingViewModel } from "@/lib/student-view-model";

/**
 * Presentation guardrails (Matrix+ Lessons — aligned with `/matrix-v1/student`).
 * Thin shell for coach strip + lesson list only; callers provide outer positioning (route layout vs prototype).
 */

function modulesSorted(modules: DbModule[]): DbModule[] {
  return [...modules].sort((a, b) => a.order_index - b.order_index);
}

function lessonsForModule(lessons: DbLesson[], moduleId: string): DbLesson[] {
  return lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
}

function progressForLesson(
  progress: DbProgress[],
  studentId: string,
  lessonId: string
): DbProgress | undefined {
  return progress.find((p) => p.student_id === studentId && p.lesson_id === lessonId);
}

function statusBadgeClass(status: string): string {
  if (status === "completed") return "badge ok";
  if (status === "in_progress") return "badge warn";
  return "badge";
}

type Props = { studentParam?: string };

/** Shared Lessons + Today’s Focus markup for `/matrix-v1/student` and unified prototype drill-down (`?student=`). */
export default async function MatrixStudentLessonsCore({ studentParam }: Props) {
  let errorMessage: string | null = null;
  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;

  try {
    data = await loadDashboardData();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Something went wrong loading your progress.";
  }

  if (errorMessage) {
    return (
      <div className="matrix-v1-lessons">
        <h1 className="matrix-v1-page-title">Lessons</h1>
        <div className="card error-box">
          <p style={{ margin: 0 }}>We couldn&apos;t load your lessons. Please try again later.</p>
        </div>
      </div>
    );
  }

  const { students, modules, lessons, progress, events, quizzes } = data!;

  if (students.length === 0) {
    return (
      <div className="matrix-v1-lessons">
        <h1 className="matrix-v1-page-title">Lessons</h1>
        <div className="card">
          <p style={{ margin: 0 }}>No student profile is set up yet.</p>
        </div>
      </div>
    );
  }

  const selected = resolveDemoStudent(students, studentParam ?? undefined) ?? students[0];
  const model = buildStudentCoachingViewModel(selected, modules, lessons, progress, events, quizzes);

  const tf = model.todaysFocus;
  const focusToneClass =
    tf.state === "RETURNING" || tf.state === "STRUGGLING"
      ? "matrix-focus-card--intervention"
      : tf.state === "PASSIVE"
        ? "matrix-focus-card--nudge"
        : "matrix-focus-card--ontrack";

  const orderedMods = modulesSorted(modules);

  return (
    <div className="matrix-v1-lessons matrix-v1-student-lessons">
      <h1 className="matrix-v1-student-page-heading">Lessons</h1>
      <div className="matrix-v1-lessons-embedded">
        <section className="matrix-focus-overlay" aria-labelledby="matrix-focus-heading">
          <div className={`matrix-focus-card card ${focusToneClass}`}>
            <p className="matrix-focus-eyebrow matrix-focus-eyebrow-named">
              <span className="matrix-focus-eyebrow-uc">Today&apos;s focus</span>
              <span>, {selected.name}</span>
            </p>
            {tf.signalContext && (
              <p className="mb-1 text-[12px] italic text-gray-400">{tf.signalContext}</p>
            )}
            <h2 id="matrix-focus-heading" className="matrix-focus-title">
              {tf.headline}
            </h2>
            <p className="matrix-focus-detail">{tf.body}</p>
            <p className="matrix-focus-why">
              <span className="matrix-focus-why-label">Why this matters </span>
              {tf.whyThisMatters}
            </p>
            <p className="matrix-focus-next">
              <span className="matrix-focus-next-label">{COACH_CARD_NEXT_STEP_PREFIX} </span>
              <strong className="matrix-focus-next-lesson">{tf.nextStep}</strong>
              {tf.focalLessonId ? (
                <>
                  {" "}
                  <a className="matrix-focus-jump" href={`#lesson-${tf.focalLessonId}`}>
                    Jump to this lesson
                  </a>
                </>
              ) : null}
            </p>
            {tf.supportHelp ? <p className="matrix-focus-support muted">{tf.supportHelp}</p> : null}
          </div>
        </section>

        <section className="matrix-lessons-board" aria-labelledby="lessons-board-heading">
          <div className="matrix-lessons-board-head">
            <h2 id="lessons-board-heading" className="matrix-lessons-board-title">
              Your lessons
            </h2>
            <p className="muted matrix-lessons-board-sub" style={{ margin: 0 }}>
              {model.completedLessons} / {model.totalLessons} lessons completed along your path
            </p>
          </div>

          {orderedMods.length === 0 ? (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>
                No modules are set up yet.
              </p>
            </div>
          ) : (
            <div className="matrix-lesson-panels">
              {orderedMods.map((mod) => {
                const modLessons = lessonsForModule(lessons, mod.id);
                return (
                  <article key={mod.id} className="matrix-module-panel">
                    <div className="matrix-module-panel-head">
                      <span className="matrix-module-accent" aria-hidden />
                      <h3 className="matrix-module-title">{mod.title}</h3>
                    </div>
                    <ul className="matrix-lesson-list">
                      {modLessons.map((les) => {
                        const p = progressForLesson(progress, selected.id, les.id);
                        const status = p?.status ?? "not_started";
                        const quiz = p?.last_quiz_score_percent;
                        return (
                          <li key={les.id} id={`lesson-${les.id}`} className="matrix-lesson-row">
                            <div className="matrix-lesson-main">
                              <span className="matrix-lesson-title">{les.title}</span>
                              {les.is_revision ? (
                                <span className="badge matrix-lesson-revision" style={{ marginLeft: "0.35rem" }}>
                                  revision
                                </span>
                              ) : null}
                            </div>
                            <div className="matrix-lesson-meta">
                              <span className={statusBadgeClass(status)}>{status.replace(/_/g, " ")}</span>
                              {quiz != null ? (
                                <span className="muted matrix-lesson-quiz">Quiz: {quiz}%</span>
                              ) : (
                                <span className="muted matrix-lesson-quiz">Quiz: —</span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
