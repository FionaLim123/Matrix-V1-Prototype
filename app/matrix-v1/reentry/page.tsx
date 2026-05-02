import Link from "next/link";
import { matrixV1QuerySuffix } from "@/lib/matrix-v1-query";

type SearchParams = { student?: string };

export default async function MatrixV1ReentryPlaceholderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = matrixV1QuerySuffix(sp);

  return (
    <div className="matrix-v1-placeholder">
      <h1 className="matrix-v1-page-title">Re-entry</h1>
      <p style={{ margin: "0 0 1rem", maxWidth: "34rem", lineHeight: 1.55 }}>
        Placeholder for return visits and gentle recovery messaging in the Matrix+ demo flow.
      </p>
      <p className="muted" style={{ margin: 0 }}>
        <Link href={`/matrix-v1/student${q}`}>Student (Today&apos;s Focus)</Link>
        {" · "}
        <Link href={`/matrix-v1/lesson${q}`}>Lesson</Link>
      </p>
    </div>
  );
}
