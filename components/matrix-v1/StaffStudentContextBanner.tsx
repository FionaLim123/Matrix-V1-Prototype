import type { DashboardData } from "@/lib/dashboard-data";
import { buildStaffStudentRows, type CohortKey } from "@/lib/matrix-v1-staff-model";

const COHORT_LABEL: Record<CohortKey, string> = {
  on_track: "On Track",
  needs_nudge: "Needs Nudge",
  needs_intervention: "Needs Intervention",
};

const COHORT_BORDER: Record<CohortKey, string> = {
  needs_intervention: "border-matrix-maroon",
  needs_nudge: "border-amber-400",
  on_track: "border-emerald-400",
};

type Props = { studentId: string; data: DashboardData };

export function StaffStudentContextBanner({ studentId, data }: Props) {
  const { students, modules, lessons, progress, events, quizzes } = data;
  const rows = buildStaffStudentRows(students, modules, lessons, progress, events, quizzes);
  const row = rows.find((r) => r.studentId === studentId);

  if (!row) return null;

  const borderClass = COHORT_BORDER[row.cohort];

  return (
    <div className={`mb-5 max-w-[42rem] rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm ${borderClass}`}>
      <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-matrix-maroon">
        Staff view — {COHORT_LABEL[row.cohort]}
      </p>
      <p className="mb-1.5 text-[13px] text-gray-500">{row.currentIssue}</p>
      <p className="text-[13px] font-semibold text-gray-800">
        Suggested action:{" "}
        <span className="font-normal">{row.staffActionPrimary}.</span>{" "}
        <span className="text-gray-500">{row.staffActionDetail}</span>
      </p>
    </div>
  );
}
