import Link from "next/link";
import type { CoachAction } from "@/lib/coach";

export type StudentDemoTab = { slug: string; label: string };

type SwitcherProps = {
  keyQ: string;
  demoTabs: readonly StudentDemoTab[];
  isDemoTabActive: (slug: string) => boolean;
  route: "student" | "dashboard";
};

export function DemoStudentSwitcher({ keyQ, demoTabs, isDemoTabActive, route }: SwitcherProps) {
  const base = route === "student" ? "/student" : "/dashboard";
  return (
    <p className="demo-student-switcher">
      <span className="demo-student-switcher-label">Viewing demo student:</span>{" "}
      {demoTabs.map((t, i) => (
        <span key={t.slug}>
          {i > 0 ? " " : null}
          <Link
            href={`${base}?key=${keyQ}&student=${encodeURIComponent(t.slug)}`}
            className={isDemoTabActive(t.slug) ? "demo-student-link demo-student-link-active" : "demo-student-link"}
            prefetch={false}
          >
            {t.label}
          </Link>
        </span>
      ))}
    </p>
  );
}

type BlockProps = {
  firstName: string;
  topicSummaries: string[];
  actions: CoachAction[];
  emptySummariesMessage: string;
  emptyActionsMessage: string;
  completedLessons: number;
  totalLessons: number;
  /** When true, omit the main "Your next step" heading (e.g. staff dashboard uses a collapsible summary title). */
  hideTitle?: boolean;
};

/** Shared coaching UI — identical on /student and /dashboard. */
export function StudentCoachingBlock({
  firstName,
  topicSummaries,
  actions,
  emptySummariesMessage,
  emptyActionsMessage,
  completedLessons,
  totalLessons,
  hideTitle = false,
}: BlockProps) {
  return (
    <div className="student-coaching-block">
      {hideTitle ? null : <h1 className="student-next-title">Your next step</h1>}
      <p className="student-next-name">{firstName}</p>

      <section className="student-coach-summary-section" aria-labelledby="coach-summary-heading">
        <h2 id="coach-summary-heading" className="student-coach-section-heading">
          How you&apos;re doing
        </h2>
        {topicSummaries.length === 0 ? (
          <p className="student-coach-empty">{emptySummariesMessage}</p>
        ) : (
          <ul className="student-coach-topic-list">
            {topicSummaries.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="student-today-section" aria-labelledby="today-heading">
        <h2 id="today-heading" className="student-today-heading">
          What should I do today?
        </h2>
        {actions.length === 0 ? (
          <p className="student-today-empty">{emptyActionsMessage}</p>
        ) : (
          <ol className="student-coach-action-list">
            {actions.map((a) => (
              <li key={a.dedupeKey}>
                <strong>{a.title}</strong>
                <div className="student-coach-action-detail">{a.detail}</div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="student-progress-line">
        {completedLessons} / {totalLessons} lessons completed
      </p>

      <p className="student-support-hint">Need help understanding this topic?</p>
    </div>
  );
}

type PeerNavProps = {
  href: string;
  label: string;
};

export function CoachingPeerNavLink({ href, label }: PeerNavProps) {
  return (
    <p className="student-coach-peer-nav muted">
      <Link href={href}>{label}</Link>
    </p>
  );
}
