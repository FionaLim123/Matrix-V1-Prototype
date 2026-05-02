/**
 * Development-only: warn if the whole class collapses into “Needs intervention”
 * (the failure mode when event rows for students are missing or truncated).
 * See loadDashboardData in lib/dashboard-data.ts.
 */

const TAG = "[demo cohort integrity]";

/**
 * After building staff rows / cohort counts, call this in dev; no-op in production.
 */
export function devWarnIfCohortDataLooksBroken(totalStudents: number, needsInterventionCount: number): void {
  if (process.env.NODE_ENV === "production") return;
  if (totalStudents < 8) return;
  if (needsInterventionCount < totalStudents) return;

  // eslint-disable-next-line no-console -- intentional dev-only signal for demo prep
  console.warn(
    `${TAG} All ${totalStudents} students are in “Needs intervention”. ` +
      `That usually means events for these students were missing or truncated. ` +
      `Confirm loadDashboardData scopes events by student_id (see lib/dashboard-data.ts).`
  );
}
