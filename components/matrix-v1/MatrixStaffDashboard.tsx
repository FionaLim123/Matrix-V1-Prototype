import Link from "next/link";

import type { DashboardData } from "@/lib/dashboard-data";
import { devWarnIfCohortDataLooksBroken } from "@/lib/dashboard-cohort-integrity";
import {
  buildStaffStudentRows,
  cohortCounts,
  type CohortKey,
  type StaffStudentRow,
} from "@/lib/matrix-v1-staff-model";
import {
  hasNonSeedActionType,
  hasSentSupportEmail,
  type InterventionLog,
} from "@/lib/intervention-logs";

const PAGE_TITLE = "Year 11 Maths Advanced — Term 2 Cohort";

const COHORT_LABEL: Record<CohortKey, string> = {
  on_track: "On Track",
  needs_nudge: "Needs Nudge",
  needs_intervention: "Needs Support",
};

const TABLE_SECTION_HEADING: Record<CohortKey | "all", string> = {
  all: "All students",
  needs_intervention: "Students needing support",
  needs_nudge: "Students who need a nudge",
  on_track: "On track students",
};

const COHORT_ORDER: CohortKey[] = ["needs_intervention", "needs_nudge", "on_track"];

export type MatrixStaffDashboardProps = {
  data: DashboardData;
  preservedStudentQuery?: string;
  cohortFilterRaw?: string;
  basePath: string;
  resolveStudentHref: (studentId: string) => string;
  showStudentExperienceFootLink?: boolean;
  showResetLink?: boolean;
};

function effectiveFilter(raw: string | undefined): CohortKey | "all" {
  if (raw === "needs_intervention" || raw === "needs_nudge" || raw === "on_track") return raw;
  return "all";
}

function staffHref(
  preservedStudent: string | undefined,
  cohort: CohortKey | "all",
  basePath: string
): string {
  const params = new URLSearchParams();
  if (preservedStudent?.trim()) params.set("student", preservedStudent.trim());
  if (cohort !== "all") params.set("cohort", cohort);
  const str = params.toString();
  return str ? `${basePath}?${str}` : basePath;
}

const MOMENTUM_CLASS: Record<CohortKey, string> = {
  needs_intervention: "font-semibold text-red-600",
  needs_nudge: "font-semibold text-amber-600",
  on_track: "font-semibold text-emerald-600",
};

export function MatrixStaffDashboard({
  data,
  preservedStudentQuery,
  cohortFilterRaw,
  basePath,
  resolveStudentHref,
  showStudentExperienceFootLink = false,
  showResetLink = false,
}: MatrixStaffDashboardProps) {
  const { students, modules, lessons, progress, events, quizzes, interventionLogs } = data;
  const filter = effectiveFilter(cohortFilterRaw);
  const rows = buildStaffStudentRows(students, modules, lessons, progress, events, quizzes);
  const counts = cohortCounts(rows);
  devWarnIfCohortDataLooksBroken(students.length, counts.needs_intervention);
  const total = students.length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const filtered = filter === "all" ? rows : rows.filter((r) => r.cohort === filter);

  const cardCopy: Record<CohortKey, { line: string }> = {
    on_track: {
      line: "On track with this term's work — parent digest sends automatically.",
    },
    needs_nudge: {
      line: "Small gaps — nudge emails send automatically; review drafts if needed.",
    },
    needs_intervention: {
      line: "Not engaging or falling behind — direct check-in recommended this week.",
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
              <div className="matrix-staff-summary-count-block">
                <p className="matrix-staff-summary-count">{n}</p>
                <p className="matrix-staff-summary-unit">students</p>
              </div>
              <p className="muted matrix-staff-summary-pct">{pct(n)}%</p>
              <p className="matrix-staff-summary-desc">{cardCopy[id].line}</p>
            </Link>
          );
        })}
      </section>

      <section className="matrix-staff-table-section">
        <h2 className="matrix-staff-table-section-title">{TABLE_SECTION_HEADING[filter]}</h2>

        {filter !== "all" ? (
          <p className="matrix-staff-table-meta">
            <Link href={staffHref(preserved, "all", basePath)} className="matrix-staff-show-all">
              View whole class →
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
                  <th scope="col">Momentum</th>
                  <th scope="col">Student</th>
                  <th scope="col" style={{ width: "15rem" }}>Current signal</th>
                  <th scope="col" style={{ width: "7rem" }}>Last activity</th>
                  <th scope="col" style={{ width: "12rem" }}>Follow up</th>
                  <th scope="col" style={{ width: "8rem", minWidth: "8rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const emailSent = hasSentSupportEmail(interventionLogs, row.studentId);
                  const inBatch = !emailSent && hasNonSeedActionType(interventionLogs, row.studentId, "support");
                  const teacherNotified = hasNonSeedActionType(interventionLogs, row.studentId, "escalated");

                  return (
                    <tr key={row.studentId}>
                      <td>
                        <span className={MOMENTUM_CLASS[row.cohort]}>{COHORT_LABEL[row.cohort]}</span>
                      </td>
                      <td>
                        <strong>{row.label}</strong>
                      </td>
                      <td>
                        <div className="max-w-[15rem]">{row.currentIssue}</div>
                      </td>
                      <td className="muted matrix-staff-nowrap">{row.lastActivity}</td>
                      <td className="muted">
                        <div className="max-w-[12rem]">{row.staffActionPrimary}</div>
                      </td>
                      <td>
                        {row.cohort === "needs_intervention" && (
                          emailSent ? (
                            <Link href={resolveStudentHref(row.studentId)} className="text-[12px] font-semibold text-emerald-700">
                              ✓ Email sent
                            </Link>
                          ) : inBatch ? (
                            <Link href={resolveStudentHref(row.studentId)} className="text-[12px] font-semibold text-emerald-600">
                              ✓ In batch
                            </Link>
                          ) : teacherNotified ? (
                            <Link href={resolveStudentHref(row.studentId)} className="text-[12px] text-gray-400">
                              ✓ Teacher notified
                            </Link>
                          ) : (
                            <Link
                              href={resolveStudentHref(row.studentId)}
                              className="inline-flex items-center whitespace-nowrap rounded-full bg-matrix-maroon px-3 py-0.5 text-[11px] font-semibold text-white hover:bg-red-900"
                            >
                              Review →
                            </Link>
                          )
                        )}
                        {row.cohort === "needs_nudge" && (
                          inBatch ? (
                            <Link href={resolveStudentHref(row.studentId)} className="text-[12px] font-semibold text-emerald-600">
                              ✓ Custom batch
                            </Link>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
                                ✓ Auto-sending
                              </span>
                              <Link href={resolveStudentHref(row.studentId)} className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline">
                                Review draft →
                              </Link>
                            </div>
                          )
                        )}
                        {row.cohort === "on_track" && (
                          <Link href={resolveStudentHref(row.studentId)} className="text-[12px] text-gray-400 hover:text-gray-600">
                            View →
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              <strong>No meaningful activity for 7 days</strong> — grouped under <em>Needs Support</em>{" "}
              (re-engagement).
            </li>
            <li>
              <strong>Quiz well below expectations</strong> — <em>Needs Support</em> if clearly off-track;
              otherwise <em>Needs Nudge</em> (revision).
            </li>
            <li>
              <strong>Lesson opened but not finished</strong> — <em>Needs Nudge</em>.
            </li>
            <li>
              <strong>Video lesson watched but checkpoint quiz not attempted</strong> — <em>Needs Nudge</em>{" "}
              (passive consumption).
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

      {showResetLink && (
        <p className="muted matrix-staff-foot" style={{ marginTop: "1.5rem" }}>
          <Link
            href={`${basePath}?reset=demo`}
            className="text-[11px] text-gray-300 hover:text-gray-500"
            prefetch={false}
          >
            ↺ Reset demo
          </Link>
        </p>
      )}
    </div>
  );
}
