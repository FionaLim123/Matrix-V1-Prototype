import Link from "next/link";

import type { DashboardData } from "@/lib/dashboard-data";
import { devWarnIfCohortDataLooksBroken } from "@/lib/dashboard-cohort-integrity";
import {
  buildStaffStudentRows,
  cohortCounts,
  type CohortKey,
  type StaffStudentRow,
} from "@/lib/matrix-v1-staff-model";

const PAGE_TITLE = "Year 11 Maths Advanced — Term 2 Cohort";

const COHORT_LABEL: Record<CohortKey, string> = {
  on_track: "On Track",
  needs_nudge: "Needs Nudge",
  needs_intervention: "Needs Intervention",
};

const TABLE_SECTION_HEADING: Record<CohortKey | "all", string> = {
  all: "All students",
  needs_intervention: "Students needing intervention",
  needs_nudge: "Students who need a nudge",
  on_track: "On track students",
};

const COHORT_ORDER: CohortKey[] = ["needs_intervention", "needs_nudge", "on_track"];

export type MatrixStaffDashboardProps = {
  data: DashboardData;
  /** Preserved on cohort links (Matrix+ `?student=`). */
  preservedStudentQuery?: string;
  cohortFilterRaw?: string;
  /** Base path without query, e.g. `/matrix-v1/staff` or `/emery-passive-lessons-overview`. */
  basePath: string;
  resolveStudentHref: (studentId: string) => string;
  showStudentExperienceFootLink?: boolean;
};

function effectiveFilter(raw: string | undefined): CohortKey | "all" {
  if (raw === "all") return "all";
  if (raw === "on_track" || raw === "needs_nudge" || raw === "needs_intervention") return raw;
  return "needs_nudge";
}

function staffHref(
  preservedStudent: string | undefined,
  cohort: CohortKey | "all",
  basePath: string
): string {
  const params = new URLSearchParams();
  if (preservedStudent?.trim()) params.set("student", preservedStudent.trim());
  if (cohort === "all") params.set("cohort", "all");
  else if (cohort === "needs_nudge") {
    /* default group — omit cohort in URL */
  } else {
    params.set("cohort", cohort);
  }
  const str = params.toString();
  return str ? `${basePath}?${str}` : basePath;
}

function riskClass(r: StaffStudentRow["renewalRisk"]): string {
  if (r === "high") return "matrix-risk-text matrix-risk-text-high";
  if (r === "medium") return "matrix-risk-text matrix-risk-text-medium";
  return "matrix-risk-text matrix-risk-text-low";
}

/**
 * Shared staff cohort UI for `/matrix-v1/staff` and the unified lessons prototype shell.
 */
export function MatrixStaffDashboard({
  data,
  preservedStudentQuery,
  cohortFilterRaw,
  basePath,
  resolveStudentHref,
  showStudentExperienceFootLink = false,
}: MatrixStaffDashboardProps) {
  const { students, modules, lessons, progress, events, quizzes } = data;
  const filter = effectiveFilter(cohortFilterRaw);
  const rows = buildStaffStudentRows(students, modules, lessons, progress, events, quizzes);
  const counts = cohortCounts(rows);
  devWarnIfCohortDataLooksBroken(students.length, counts.needs_intervention);
  const total = students.length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const filtered = filter === "all" ? rows : rows.filter((r) => r.cohort === filter);

  const cardCopy: Record<CohortKey, { line: string }> = {
    on_track: {
      line: "On track with this term’s work — no urgent follow-up needed.",
    },
    needs_nudge: {
      line: "Small gaps: an unfinished lesson or a softer result — a prompt usually helps.",
    },
    needs_intervention: {
      line: "Not engaging recently or falling behind — worth a direct check-in this week.",
    },
  };

  const firstId = students[0]?.id ?? "";
  const preserved = preservedStudentQuery;

  return (
    <div className="matrix-v1-staff">
      <section className="matrix-staff-lead">
        <h1 className="matrix-v1-page-title">{PAGE_TITLE}</h1>
      </section>

      <section className="matrix-staff-cards" aria-label="Cohort summary">
        {COHORT_ORDER.map((id) => {
          const n = counts[id];
          const active = filter !== "all" && filter === id;
          return (
            <Link
              key={id}
              href={staffHref(preserved, id, basePath)}
              prefetch={false}
              className={`matrix-staff-cohort-card card matrix-staff-cohort-card-${id} ${
                active ? "matrix-staff-summary-card-active" : ""
              }`}
            >
              <p className="matrix-staff-summary-eyebrow">{COHORT_LABEL[id]}</p>
              <p className="matrix-staff-summary-count">{n}</p>
              <p className="muted matrix-staff-summary-pct">{pct(n)}%</p>
              <p className="muted matrix-staff-summary-meta">{n === 1 ? "1 student" : `${n} students`}</p>
              <p className="matrix-staff-summary-desc">{cardCopy[id].line}</p>
            </Link>
          );
        })}
      </section>

      <section className="matrix-staff-table-section">
        <h2 className="matrix-staff-table-section-title">{TABLE_SECTION_HEADING[filter]}</h2>

        {filter !== "all" ? (
          <p className="matrix-staff-table-meta muted">
            <Link href={staffHref(preserved, "all", basePath)} className="matrix-staff-show-all">
              View whole class
            </Link>
          </p>
        ) : null}

        <div className="matrix-staff-table-wrap card matrix-staff-table-wrap--secondary">
          {filtered.length === 0 ? (
            <p className="muted" style={{ margin: 0, padding: "0.5rem 0" }}>
              No students in this group.
            </p>
          ) : (
            <table className="matrix-staff-table matrix-staff-table--secondary">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Suggested staff action</th>
                  <th scope="col">Current signal</th>
                  <th scope="col">Last activity</th>
                  <th scope="col">Renewal risk</th>
                  {filter === "all" ? <th scope="col">Group</th> : null}
                  <th scope="col">View</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.studentId}>
                    <td>
                      <strong>{row.label}</strong>
                    </td>
                    <td>
                      <span className="matrix-staff-action-primary">{row.staffActionPrimary}</span>
                      <div className="muted matrix-staff-action-detail">{row.staffActionDetail}</div>
                    </td>
                    <td>{row.currentIssue}</td>
                    <td className="muted matrix-staff-nowrap">{row.lastActivity}</td>
                    <td>
                      <span className={riskClass(row.renewalRisk)}>{row.renewalRisk}</span>
                    </td>
                    {filter === "all" ? <td className="muted">{COHORT_LABEL[row.cohort]}</td> : null}
                    <td>
                      <Link href={resolveStudentHref(row.studentId)}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <details className="matrix-staff-how reference-details card matrix-staff-how--tertiary">
        <summary>About these groups</summary>
        <div className="matrix-staff-how-body">
          <ul className="matrix-staff-how-list">
            <li>
              <strong>No meaningful activity for 7 days</strong> — grouped under <em>Needs Intervention</em>{" "}
              (re-engagement).
            </li>
            <li>
              <strong>Quiz well below expectations</strong> — <em>Needs Intervention</em> if clearly off-track;
              otherwise <em>Needs Nudge</em> (revision).
            </li>
            <li>
              <strong>Lesson opened but not finished</strong> — <em>Needs Nudge</em>.
            </li>
            <li>
              <strong>Otherwise</strong> — <em>On Track</em> for this weekly view.
            </li>
          </ul>
          <p className="muted matrix-staff-how-foot">
            Based on recent activity and results — same signals as Today&apos;s Focus.
          </p>
        </div>
      </details>

      {showStudentExperienceFootLink && firstId ? (
        <p className="muted matrix-staff-foot">
          <Link href={resolveStudentHref(firstId)}>View student experience</Link>
        </p>
      ) : null}
    </div>
  );
}
