import { createAdminClient } from "@/lib/supabase/admin";

export type ActionType = "support" | "nudge" | "on_track" | "escalated";
export type CohortTier = "needs_intervention" | "needs_nudge" | "on_track";

export type InterventionLog = {
  id: string;
  student_id: string;
  action_type: ActionType;
  cohort_tier: CohortTier;
  student_email_draft: string | null;
  parent_email_draft: string | null;
  emails_sent_at: string | null;
  logged_at: string;
  is_seed: boolean;
};

export async function loadInterventionLogs(): Promise<InterventionLog[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("intervention_logs")
    .select(
      "id, student_id, action_type, cohort_tier, student_email_draft, parent_email_draft, emails_sent_at, logged_at, is_seed"
    )
    .order("logged_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InterventionLog[];
}

export function getLogsForStudent(logs: InterventionLog[], studentId: string): InterventionLog[] {
  return logs.filter((l) => l.student_id === studentId);
}

// Returns Monday 00:00:00 of the current calendar week (local time).
function getCurrentWeekStart(): Date {
  const now = new Date();
  const daysFromMonday = (now.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0, …
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isThisWeek(loggedAt: string): boolean {
  return new Date(loggedAt) >= getCurrentWeekStart();
}

// ─── This-week action state checks ───────────────────────────────────────────
// These functions only consider logs from the current Mon–Sun window so the
// dashboard auto-resets each Monday without any manual intervention.
// Historical functions (getMostRecentLog, getPriorWeeksInTier) remain
// unfiltered so Duration and Last-week fields retain full history.

/** Non-seed support actions from this week not yet sent = current outbox. */
export function countPendingBatch(logs: InterventionLog[]): number {
  return logs.filter(
    (l) => l.action_type === "support" && !l.is_seed && !l.emails_sent_at && isThisWeek(l.logged_at)
  ).length;
}

/** Student IDs of this-week non-seed support actions pending send. */
export function getPendingBatchStudentIds(logs: InterventionLog[]): string[] {
  return logs
    .filter((l) => l.action_type === "support" && !l.is_seed && !l.emails_sent_at && isThisWeek(l.logged_at))
    .map((l) => l.student_id);
}

/** True if any non-seed log exists for this student this week. */
export function hasNonSeedLog(logs: InterventionLog[], studentId: string): boolean {
  return logs.some((l) => l.student_id === studentId && !l.is_seed && isThisWeek(l.logged_at));
}

/** True if a specific non-seed action type was logged for this student this week. */
export function hasNonSeedActionType(
  logs: InterventionLog[],
  studentId: string,
  actionType: ActionType
): boolean {
  return logs.some(
    (l) =>
      l.student_id === studentId &&
      !l.is_seed &&
      l.action_type === actionType &&
      isThisWeek(l.logged_at)
  );
}

/** True if a this-week non-seed support action has been sent (emails_sent_at is set). */
export function hasSentSupportEmail(logs: InterventionLog[], studentId: string): boolean {
  return logs.some(
    (l) =>
      l.student_id === studentId &&
      !l.is_seed &&
      l.action_type === "support" &&
      l.emails_sent_at !== null &&
      isThisWeek(l.logged_at)
  );
}

// ─── Historical functions (no week filter) ───────────────────────────────────

/** Number of logged entries for this student in this tier (seed + non-seed). Used for Duration. */
export function getPriorWeeksInTier(logs: InterventionLog[], studentId: string, tier: CohortTier): number {
  return logs.filter((l) => l.student_id === studentId && l.cohort_tier === tier).length;
}

/** Most recent log for a student (any type, seed or not). Used for Last week field. */
export function getMostRecentLog(logs: InterventionLog[], studentId: string): InterventionLog | null {
  const matched = logs.filter((l) => l.student_id === studentId);
  return matched[0] ?? null; // already sorted desc by logged_at
}
