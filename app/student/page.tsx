import { CoachingPeerNavLink, DemoStudentSwitcher, StudentCoachingBlock } from "@/components/StudentCoaching";
import { resolveDemoStudent } from "@/lib/coach";
import { DEMO_STUDENT_TABS, demoStudentSlugForLinks } from "@/lib/demo-student-tabs";
import { loadDashboardData } from "@/lib/dashboard-data";
import { buildStudentCoachingViewModel } from "@/lib/student-view-model";

type SearchParams = { key?: string; student?: string };

export default async function StudentCoachPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { key, student: studentParam } = await searchParams;
  const secret = process.env.DASHBOARD_SECRET;

  if (!secret || key !== secret) {
    return (
      <>
        <h1>Your next step</h1>
        <div className="card error-box">
          <p style={{ margin: 0 }}>
            This page is not available. Ask your teacher for the correct link.
          </p>
        </div>
      </>
    );
  }

  const keyQ = encodeURIComponent(key);
  let errorMessage: string | null = null;
  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;

  try {
    data = await loadDashboardData();
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Something went wrong loading your progress.";
  }

  if (errorMessage) {
    return (
      <>
        <h1>Your next step</h1>
        <div className="card error-box">
          <p style={{ margin: 0 }}>We could not load your progress. Please try again later.</p>
        </div>
      </>
    );
  }

  const { students, modules, lessons, progress, events } = data!;

  if (students.length === 0) {
    return (
      <>
        <h1>Your next step</h1>
        <div className="card">
          <p style={{ margin: 0 }}>No student profile is set up yet.</p>
        </div>
      </>
    );
  }

  const selected = resolveDemoStudent(students, studentParam ?? undefined) ?? students[0];
  const model = buildStudentCoachingViewModel(selected, modules, lessons, progress, events);
  const slug = demoStudentSlugForLinks(selected.name, studentParam);

  const staffHref = `/dashboard?key=${keyQ}&student=${encodeURIComponent(slug)}`;

  return (
    <div className="student-next">
      <DemoStudentSwitcher
        keyQ={keyQ}
        demoTabs={DEMO_STUDENT_TABS}
        isDemoTabActive={(s) => selected.name.toLowerCase().includes(s)}
        route="student"
      />
      <StudentCoachingBlock
        firstName={model.firstName}
        topicSummaries={model.topicSummaries}
        actions={model.actions}
        emptySummariesMessage={model.emptySummariesMessage}
        emptyActionsMessage={model.emptyActionsMessage}
        completedLessons={model.completedLessons}
        totalLessons={model.totalLessons}
      />
      <CoachingPeerNavLink href={staffHref} label="View staff perspective" />
    </div>
  );
}
