import Link from "next/link";

export type StudentDemoTab = { slug: string; label: string };

type Props = {
  keyQ: string;
  demoTabs: readonly StudentDemoTab[];
  isDemoTabActive: (slug: string) => boolean;
  firstName: string;
  headlineSummary: string;
  actionLines: string[];
  emptyActionsFallback: string;
  completedLessons: number;
  totalLessons: number;
  staffHref: string;
};

export function StudentNextStep({
  keyQ,
  demoTabs,
  isDemoTabActive,
  firstName,
  headlineSummary,
  actionLines,
  emptyActionsFallback,
  completedLessons,
  totalLessons,
  staffHref,
}: Props) {
  return (
    <div className="student-next">
      <p className="demo-student-switcher">
        <span className="demo-student-switcher-label">Viewing demo student:</span>{" "}
        {demoTabs.map((t, i) => (
          <span key={t.slug}>
            {i > 0 ? " " : null}
            <Link
              href={`/student?key=${keyQ}&student=${encodeURIComponent(t.slug)}`}
              className={isDemoTabActive(t.slug) ? "demo-student-link demo-student-link-active" : "demo-student-link"}
              prefetch={false}
            >
              {t.label}
            </Link>
          </span>
        ))}
      </p>

      <h1 className="student-next-title">Your next step</h1>
      <p className="student-next-name">{firstName}</p>
      <p className="student-next-summary">{headlineSummary}</p>

      <section className="student-today-section" aria-labelledby="today-heading">
        <h2 id="today-heading" className="student-today-heading">
          What should I do today?
        </h2>
        {actionLines.length === 0 ? (
          <p className="student-today-empty">{emptyActionsFallback}</p>
        ) : (
          <ol className="student-today-list">
            {actionLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        )}
      </section>

      <p className="student-progress-line">
        {completedLessons} / {totalLessons} lessons completed
      </p>

      <p className="student-support-hint">Need help understanding this topic?</p>

      <p className="student-staff-foot muted">
        <Link href={staffHref}>Staff view</Link>
      </p>
    </div>
  );
}
