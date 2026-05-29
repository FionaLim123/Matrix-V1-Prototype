import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard-data";
import { buildStaffStudentRows, type CohortKey } from "@/lib/matrix-v1-staff-model";
import { getMostRecentLog, getPriorWeeksInTier, type InterventionLog } from "@/lib/intervention-logs";

const COHORT_LABEL: Record<CohortKey, string> = {
  on_track: "On Track",
  needs_nudge: "Needs Nudge",
  needs_intervention: "Needs Support",
};

const ACTION_LABEL: Record<string, string> = {
  support: "Support email sent",
  nudge: "Nudge sent",
  on_track: "Digest sent",
  escalated: "Teacher notified",
};

function persistenceText(weeks: number): string {
  if (weeks <= 1) return "1st week";
  if (weeks === 2) return "2nd week";
  if (weeks === 3) return "3rd week";
  return `${weeks}th week`;
}

function lastWeekLine(log: InterventionLog | null, currentCohort: CohortKey): string {
  if (!log) return "No prior action";
  const action = ACTION_LABEL[log.action_type] ?? log.action_type;
  const outcome = log.cohort_tier === currentCohort ? "no change in status" : "status has changed";
  return `${action} · ${outcome}`;
}

function InfoRow({
  label,
  value,
  valueLarge,
}: {
  label: string;
  value: React.ReactNode;
  valueLarge?: boolean;
}) {
  if (!value) return null;
  return (
    <>
      <dt className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-gray-500 pt-0.5">
        {label}
      </dt>
      <dd
        className={
          valueLarge
            ? "text-[20px] font-bold leading-tight text-gray-900"
            : "text-[13px] leading-snug text-gray-700"
        }
      >
        {value}
      </dd>
    </>
  );
}

type Props = { studentId: string; data: DashboardData; backHref?: string };

export function StaffStudentContextBanner({ studentId, data, backHref }: Props) {
  const { students, modules, lessons, progress, events, quizzes, interventionLogs } = data;
  const rows = buildStaffStudentRows(students, modules, lessons, progress, events, quizzes);
  const row = rows.find((r) => r.studentId === studentId);

  if (!row) return null;

  const recentLog = getMostRecentLog(interventionLogs, studentId);
  const historyLine = lastWeekLine(recentLog, row.cohort);
  const priorWeeks = getPriorWeeksInTier(interventionLogs, studentId, row.cohort);
  const totalWeeks = priorWeeks + 1;
  const persistence = persistenceText(totalWeeks);

  return (
    <div className="mb-6 max-w-[42rem]">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 block text-[12px] text-gray-400 hover:text-gray-600"
          prefetch={false}
        >
          ← Back to cohort
        </Link>
      )}
      <div className="rounded-lg bg-white px-4 py-4 shadow-sm">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
          <InfoRow label="Student" value={row.label} valueLarge />
          <InfoRow label="Current state" value={COHORT_LABEL[row.cohort]} />
          <InfoRow label="Duration" value={`${persistence} in this state`} />
          <InfoRow label="Last week" value={historyLine} />
          <div className="col-span-2 my-1 border-t border-gray-100" />
          <InfoRow label="Current signal" value={row.currentIssue} />
          <InfoRow label="Follow up" value={row.staffActionPrimary} />
        </dl>
      </div>
    </div>
  );
}
