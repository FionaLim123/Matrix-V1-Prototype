import { Suspense } from "react";

import MatrixStudentLessonsCore from "@/components/matrix-v1/MatrixStudentLessonsCore";
import { StaffStudentContextBanner } from "@/components/matrix-v1/StaffStudentContextBanner";
import { MatrixStaffDashboard } from "@/components/matrix-v1/MatrixStaffDashboard";
import type { PrototypePrimaryTab } from "@/components/emery-passive-lessons-overview/EmeryPrototypeNav";
import { EmeryFlow } from "@/components/emery-passive-lessons-overview/EmeryFlow";
import { buildAllPersonaPrototypePacks } from "@/lib/matrix-persona-prototype-pack";
import { loadDashboardData } from "@/lib/dashboard-data";
import { isUuidParam } from "@/lib/uuid-param";

function cohortOnlyParams(cohortRaw?: string): URLSearchParams {
  const params = new URLSearchParams();
  const filter =
    cohortRaw === "all"
      ? ("all" as const)
      : cohortRaw === "on_track" || cohortRaw === "needs_nudge" || cohortRaw === "needs_intervention"
        ? cohortRaw
        : ("needs_nudge" as const);
  if (filter === "all") params.set("cohort", "all");
  else if (filter !== "needs_nudge") params.set("cohort", filter);
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
  searchParams: Promise<{ persona?: string; cohort?: string; student?: string }>;
}) {
  const sp = await searchParams;
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
      />
    ) : null;

  const staffFeedbackBody =
    data && !dashboardError && initialStaffFeedbackStudentId ? (
      <>
        <StaffStudentContextBanner studentId={initialStaffFeedbackStudentId} data={data} />
        <MatrixStudentLessonsCore studentParam={initialStaffFeedbackStudentId} />
      </>
    ) : null;

  return (
    <Suspense fallback={<div className="h-dvh bg-matrix-bg" aria-hidden />}>
      <EmeryFlow
        initialPrimaryTab={initialPrimaryTab}
        initialStaffFeedbackStudentId={initialStaffFeedbackStudentId}
        staffFeedbackBody={staffFeedbackBody}
        packsByPersona={packsByPersona}
        dashboardError={dashboardError}
      >
        {staffDashboard}
      </EmeryFlow>
    </Suspense>
  );
}
