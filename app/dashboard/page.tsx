import { CoachingPeerNavLink, DemoStudentSwitcher, StudentCoachingBlock } from "@/components/StudentCoaching";
import { resolveDemoStudent } from "@/lib/coach";
import { DEMO_STUDENT_TABS, demoStudentSlugForLinks } from "@/lib/demo-student-tabs";
import { loadDashboardData } from "@/lib/dashboard-data";
import { buildRecommendations } from "@/lib/recommendations";
import { buildStudentCoachingViewModel } from "@/lib/student-view-model";

export const dynamic = "force-dynamic";

type SearchParams = { student?: string };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { student: studentParam } = await searchParams;

  let errorMessage: string | null = null;
  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;

  try {
    data = await loadDashboardData();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Unknown error loading data.";
  }

  if (errorMessage) {
    return (
      <>
        <h1>Staff dashboard</h1>
        <div className="card error-box">
          <p style={{ margin: 0 }}>
            <strong>Could not load Supabase data.</strong> {errorMessage}
          </p>
          <p className="muted" style={{ margin: "0.75rem 0 0" }}>
            Check <code>.env.local</code>. If you changed seed data, run <code>reset_demo.sql</code> then{" "}
            <code>seed.sql</code> in Supabase.
          </p>
        </div>
      </>
    );
  }

  const { students, courses, modules, lessons, progress, events, quizzes } = data!;

  if (students.length === 0) {
    return (
      <>
        <h1>Staff dashboard</h1>
        <div className="card">
          <p style={{ margin: 0 }}>No students found. Run <code>seed.sql</code> in Supabase.</p>
        </div>
      </>
    );
  }

  const selected = resolveDemoStudent(students, studentParam ?? undefined) ?? students[0];
  const courseTitle = courses.length === 1 ? courses[0].title : courses.map((c) => c.title).join(", ") || null;
  const coachingModel = buildStudentCoachingViewModel(selected, modules, lessons, progress, events, quizzes);
  const recommendations = buildRecommendations(students, lessons, progress, events);
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;

  const totalLessons = lessons.length;
  const completedForStudent = (studentId: string) =>
    progress.filter((p) => p.student_id === studentId && p.status === "completed").length;

  const slug = demoStudentSlugForLinks(selected.name, studentParam);
  const studentExperienceHref = `/student?student=${encodeURIComponent(slug)}`;

  return (
    <>
      <section className="dashboard-staff-intro">
        <h1>Staff view</h1>
        <p className="dashboard-staff-purpose">
          <span className="dashboard-staff-purpose-main">
            Designed to help staff quickly see where students need support.
          </span>{" "}
          <span className="dashboard-staff-purpose-note">(This view is intentionally simplified.)</span>
        </p>
        <h2 className="dashboard-staff-subtitle">Role-based views (next step)</h2>
        <p className="dashboard-staff-pills-label">Who this will support</p>
        <div className="demo-role-pill-row">
          <span className="demo-role-pill">Teacher</span>
          <span className="demo-role-pill">Head of Subject</span>
          <span className="demo-role-pill">Head of Secondary</span>
          <span className="demo-role-pill">Head of Primary</span>
          <span className="demo-role-pill">TBC</span>
        </div>
        <div className="dashboard-staff-copy dashboard-staff-demo-framing">
          <p className="dashboard-staff-intro-body">
            This is the foundation: turning student behaviour into signals.
          </p>
          <p className="dashboard-staff-intro-body dashboard-staff-intro-body-follow">
            From here, this can evolve into role-specific views that help staff spot where students need support
            and take action - and surface where the program can improve.
          </p>
          <p className="dashboard-staff-examples-heading">
            <strong>Examples:</strong>
          </p>
          <ul className="dashboard-staff-examples">
            <li>Where students are struggling across topics</li>
            <li>Early signs of disengagement</li>
            <li>Patterns across subjects and cohorts</li>
          </ul>
        </div>
      </section>

      <section className="dashboard-foundational-divider">
        <h2>Foundational data layer (demo)</h2>
        <p className="muted" style={{ margin: "0.35rem 0 0" }}>
          The sections below show the raw signals captured from student behaviour.
        </p>
      </section>

      <div className="dashboard-data-layer">
        <details className="reference-details">
          <summary>Student coaching signals (example)</summary>
          <div className="student-next dashboard-coaching-slot">
            <DemoStudentSwitcher
              demoTabs={DEMO_STUDENT_TABS}
              isDemoTabActive={(s) => selected.name.toLowerCase().includes(s)}
              route="dashboard"
            />
            <StudentCoachingBlock
              firstName={coachingModel.firstName}
              topicSummaries={coachingModel.topicSummaries}
              actions={coachingModel.actions}
              emptySummariesMessage={coachingModel.emptySummariesMessage}
              emptyActionsMessage={coachingModel.emptyActionsMessage}
              completedLessons={coachingModel.completedLessons}
              totalLessons={coachingModel.totalLessons}
              hideTitle
            />
            <CoachingPeerNavLink href={studentExperienceHref} label="View student experience" />
          </div>
        </details>

        <details className="reference-details">
          <summary>Student progress (raw view)</summary>
          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Progress (lessons)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const x = completedForStudent(s.id);
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td className="muted">{s.email ?? "—"}</td>
                      <td>
                        {x} / {totalLessons} lessons completed
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>

        <details className="reference-details">
          <summary>Underlying progress (for reference)</summary>
          <p className="muted reference-details-sub">
            Lesson completion and quiz results behind the coaching insights.
          </p>
          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Lesson</th>
                  <th>Status</th>
                  <th>Last quiz %</th>
                </tr>
              </thead>
              <tbody>
                {progress.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No progress rows yet.
                    </td>
                  </tr>
                ) : (
                  progress.map((row) => {
                    const lesson = lessons.find((l) => l.id === row.lesson_id);
                    return (
                      <tr key={`${row.student_id}-${row.lesson_id}`}>
                        <td>{studentName(row.student_id)}</td>
                        <td>{lesson?.title ?? row.lesson_id}</td>
                        <td>
                          <span
                            className={
                              row.status === "completed"
                                ? "badge ok"
                                : row.status === "in_progress"
                                  ? "badge warn"
                                  : "badge"
                            }
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>{row.last_quiz_score_percent ?? "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </details>

        <details className="reference-details">
          <summary>Student activity (for reference)</summary>
          <p className="muted reference-details-sub">
            Behavioural signals (e.g. lessons opened, quizzes taken) used to detect progress and engagement.
          </p>
          <div className="card" style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Event</th>
                  <th>Lesson</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No events yet.
                    </td>
                  </tr>
                ) : (
                  events.map((ev, idx) => (
                    <tr key={idx}>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {new Date(ev.created_at).toLocaleString()}
                      </td>
                      <td>{studentName(ev.student_id)}</td>
                      <td>
                        <code>{ev.event_type}</code>
                      </td>
                      <td className="muted">
                        {ev.lesson_id
                          ? lessons.find((l) => l.id === ev.lesson_id)?.title ?? ev.lesson_id
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </details>

        <details className="reference-details">
          <summary>Learning structure</summary>
          <p className="muted reference-details-sub">
            Course topics and lessons — this structure guides sequencing and recommendations.
          </p>
          <div className="card">
            {courseTitle ? (
              <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>{courseTitle}</p>
            ) : null}
            {modules.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No modules yet.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {modules.map((m) => (
                  <li key={m.id} style={{ marginBottom: "0.75rem" }}>
                    <strong>{m.title}</strong>
                    <ul>
                      {lessons
                        .filter((l) => l.module_id === m.id)
                        .map((l) => (
                          <li key={l.id}>
                            {l.title}
                            {l.is_revision ? (
                              <span className="badge" style={{ marginLeft: "0.35rem" }}>
                                revision
                              </span>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>

        <details className="reference-details">
          <summary>How the coach works (rules)</summary>
          <p className="muted reference-details-sub">
            Simple rules that generate the coaching recommendations.
          </p>
          <div className="card">
            {recommendations.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No rule output to show.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {recommendations.map((r, i) => (
                  <li key={i} style={{ marginBottom: "0.65rem" }}>
                    <span className="badge">{r.rule.replace(/_/g, " ")}</span>{" "}
                    <strong>{r.student_name}</strong> — {r.message}
                    <div className="muted" style={{ marginTop: "0.25rem" }}>
                      {r.detail}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="muted reference-details-sub" style={{ marginTop: "1rem", marginBottom: 0 }}>
            Road ahead: a conversational coach and adaptive paths — built on this explainable rule layer and the
            activity spine.
          </p>
        </details>
      </div>
    </>
  );
}
