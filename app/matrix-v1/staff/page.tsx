import { MatrixStaffDashboard } from "@/components/matrix-v1/MatrixStaffDashboard";
import { loadDashboardData } from "@/lib/dashboard-data";
import { type MatrixV1SearchParams } from "@/lib/matrix-v1-query";

/** Always read fresh data from Supabase; never serve a built/cached staff snapshot. */
export const dynamic = "force-dynamic";

type SearchParams = MatrixV1SearchParams & { cohort?: string };

const PAGE_TITLE = "Year 11 Maths Advanced — Term 2 Cohort";

export default async function MatrixV1StaffPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  let errorMessage: string | null = null;
  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;
  try {
    data = await loadDashboardData();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Could not load data.";
  }

  if (errorMessage || !data) {
    return (
      <div className="matrix-v1-staff">
        <h1 className="matrix-v1-page-title">{PAGE_TITLE}</h1>
        <div className="card error-box">
          <p style={{ margin: 0 }}>{errorMessage ?? "Something went wrong."}</p>
        </div>
      </div>
    );
  }

  return (
    <MatrixStaffDashboard
      data={data}
      preservedStudentQuery={sp.student?.trim()}
      cohortFilterRaw={sp.cohort}
      basePath="/matrix-v1/staff"
      resolveStudentHref={(id) => `/matrix-v1/student?student=${encodeURIComponent(id)}`}
      showStudentExperienceFootLink
    />
  );
}
