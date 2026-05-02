import { CoachingPeerNavLink, DemoStudentSwitcher, StudentCoachingBlock } from "@/components/StudentCoaching";
import { resolveDemoStudent } from "@/lib/coach";
import { DEMO_STUDENT_TABS, demoStudentSlugForLinks } from "@/lib/demo-student-tabs";
import { loadDashboardData } from "@/lib/dashboard-data";
import { buildStudentCoachingViewModel } from "@/lib/student-view-model";

export const dynamic = "force-dynamic";

type SearchParams = { student?: string };

export default async function StudentCoachPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { student: studentParam } = await searchParams;

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

  const { students, modules, lessons, progress, events, quizzes } = data!;

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
  const model = buildStudentCoachingViewModel(selected, modules, lessons, progress, events, quizzes);
  const slug = demoStudentSlugForLinks(selected.name, studentParam);

  const staffHref = `/dashboard?student=${encodeURIComponent(slug)}`;

  return (
    <div className="student-next">
      <DemoStudentSwitcher
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
