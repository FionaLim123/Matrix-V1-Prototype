import { Suspense } from "react";

import MatrixStudentLessonsCore from "@/components/matrix-v1/MatrixStudentLessonsCore";
import { StaffStudentContextBanner } from "@/components/matrix-v1/StaffStudentContextBanner";
import { TeacherActionPanel } from "@/components/matrix-v1/TeacherActionPanel";
import { MatrixStaffDashboard } from "@/components/matrix-v1/MatrixStaffDashboard";
import type { PrototypePrimaryTab } from "@/components/emery-passive-lessons-overview/EmeryPrototypeNav";
import { EmeryFlow } from "@/components/emery-passive-lessons-overview/EmeryFlow";
import { buildAllPersonaPrototypePacks } from "@/lib/matrix-persona-prototype-pack";
import { loadDashboardData } from "@/lib/dashboard-data";
import { isUuidParam } from "@/lib/uuid-param";
import { buildStaffStudentRows } from "@/lib/matrix-v1-staff-model";
import { STUDENT_ID_TO_PERSONA_SLUG } from "@/lib/demo-persona-student-ids";
import {
  countPendingBatch,
  getPendingBatchStudentIds,
  hasNonSeedActionType,
} from "@/lib/intervention-logs";
import { resetDemoInterventions } from "@/lib/intervention-actions";

function extractSubject(draft: string | null | undefined): string | null {
  if (!draft) return null;
  const nl = draft.indexOf("\n");
  const line = nl === -1 ? draft : draft.slice(0, nl);
  return line.startsWith("Subject: ") ? line.slice(9) : line;
}

function cohortOnlyParams(cohortRaw?: string): URLSearchParams {
  const params = new URLSearchParams();
  const filter =
    cohortRaw === "needs_intervention" || cohortRaw === "needs_nudge" || cohortRaw === "on_track"
      ? cohortRaw
      : undefined;
  if (filter) params.set("cohort", filter);
  return params;
}

function initialTabsFromSearch(sp: { persona?: string; student?: string }): {
  initialPrimaryTab: PrototypePrimaryTab;
  initialStaffFeedbackStudentId: string | null;
} {
  const persona = sp.persona;
  const trimmedStudent = sp.student?.trim() ?? "";

  if (persona === "drew" || persona === "jordan" || persona === "emery") {
    return { initialPrimaryTab: persona, initialStaffFeedbackStudentId: null };
  }

  if (isUuidParam(trimmedStudent)) {
    return {
      initialPrimaryTab: "staff",
      initialStaffFeedbackStudentId: trimmedStudent,
    };
  }
  return { initialPrimaryTab: "staff", initialStaffFeedbackStudentId: null };
}

/** Unified prototype: staff cohort · Returning (Drew) · Struggling (Jordan) · Passive (Emery) — DB + coach rules. */
export default async function V1PrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ persona?: string; cohort?: string; student?: string; reset?: string }>;
}) {
  const sp = await searchParams;

  if (sp.reset === "demo" && process.env.DEMO_RESET_ENABLED === "true") {
    await resetDemoInterventions();
  }

  const { initialPrimaryTab, initialStaffFeedbackStudentId } = initialTabsFromSearch(sp);

  let packsByPersona = null as ReturnType<typeof buildAllPersonaPrototypePacks> | null;
  let dashboardError: string | null = null;
  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;

  try {
    data = await loadDashboardData();
    packsByPersona = buildAllPersonaPrototypePacks(data);
  } catch (e) {
    dashboardError =
      e instanceof Error
        ? e.message
        : "Could not reach the demo database — check `.env.local` and Supabase.";
  }

  const hasPersonaTab = sp.persona === "drew" || sp.persona === "jordan" || sp.persona === "emery";
  const trimmedStudentParams = sp.student?.trim() ?? "";
  const preservedStudentQuery =
    hasPersonaTab ? undefined : isUuidParam(trimmedStudentParams) ? trimmedStudentParams : undefined;

  const interventionLogs = data?.interventionLogs ?? [];
  const pendingBatchCount = countPendingBatch(interventionLogs);
  const pendingBatchStudentIds = getPendingBatchStudentIds(interventionLogs);
  const pendingBatchStudents = data
    ? data.students
        .filter((s) => pendingBatchStudentIds.includes(s.id))
        .map((s) => {
          const log = interventionLogs.find(
            (l) => l.student_id === s.id && l.action_type === "support" && !l.is_seed && !l.emails_sent_at
          );
          return {
            id: s.id,
            name: s.name,
            studentSubject: extractSubject(log?.student_email_draft),
            parentSubject: extractSubject(log?.parent_email_draft),
          };
        })
    : [];

  const staffDashboard =
    data && !dashboardError ? (
      <MatrixStaffDashboard
        data={data}
        preservedStudentQuery={preservedStudentQuery}
        cohortFilterRaw={sp.cohort}
        basePath="/v1-prototype"
        resolveStudentHref={(id) => {
          const q = cohortOnlyParams(sp.cohort);
          q.set("student", id);
          const qs = q.toString();
          return qs ? `/v1-prototype?${qs}` : "/v1-prototype";
        }}
        showResetLink={process.env.DEMO_RESET_ENABLED === "true"}
      />
    ) : null;

  const backHref = (() => {
    const q = cohortOnlyParams(sp.cohort);
    const qs = q.toString();
    return qs ? `/v1-prototype?${qs}` : "/v1-prototype";
  })();

  const staffFeedbackBody = (() => {
    if (!data || dashboardError || !initialStaffFeedbackStudentId) return null;
    const rows = buildStaffStudentRows(
      data.students,
      data.modules,
      data.lessons,
      data.progress,
      data.events,
      data.quizzes
    );
    const row = rows.find((r) => r.studentId === initialStaffFeedbackStudentId);
    if (!row) return null;
    const alreadyActioned = hasNonSeedActionType(interventionLogs, initialStaffFeedbackStudentId, "support");
    const alreadyEscalated = hasNonSeedActionType(
      interventionLogs,
      initialStaffFeedbackStudentId,
      "escalated"
    );
    const fn = row.label.split(" ")[0] ?? row.label;
    const personaSlug = STUDENT_ID_TO_PERSONA_SLUG[initialStaffFeedbackStudentId] ?? null;
    return (
      <>
        <StaffStudentContextBanner
          studentId={initialStaffFeedbackStudentId}
          data={data}
          backHref={backHref}
        />
        <TeacherActionPanel
          row={row}
          alreadyActioned={alreadyActioned}
          alreadyEscalated={alreadyEscalated}
        />
        <div className="mb-3 mt-6 flex items-center justify-between max-w-[42rem]">
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">
            What {fn} is currently seeing
          </h3>
          {personaSlug && (
            <a
              href={`/v1-prototype?persona=${personaSlug}`}
              className="text-[12px] font-medium text-matrix-maroon hover:underline"
            >
              See {fn}&apos;s full experience →
            </a>
          )}
        </div>
        <MatrixStudentLessonsCore studentParam={initialStaffFeedbackStudentId} />
      </>
    );
  })();

  return (
    <Suspense fallback={<div className="h-dvh bg-matrix-bg" aria-hidden />}>
      <EmeryFlow
        initialPrimaryTab={initialPrimaryTab}
        initialStaffFeedbackStudentId={initialStaffFeedbackStudentId}
        staffFeedbackBody={staffFeedbackBody}
        packsByPersona={packsByPersona}
        dashboardError={dashboardError}
        pendingBatchCount={pendingBatchCount}
        pendingBatchStudents={pendingBatchStudents}
      >
        {staffDashboard}
      </EmeryFlow>
    </Suspense>
  );
}
