import Link from "next/link";
import { matrixV1QuerySuffix } from "@/lib/matrix-v1-query";

type SearchParams = { student?: string };

export default async function MatrixV1LessonPlaceholderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = matrixV1QuerySuffix(sp);

  return (
    <div className="matrix-v1-placeholder">
      <h1 className="matrix-v1-page-title">Lesson</h1>
      <p style={{ margin: "0 0 1rem", maxWidth: "34rem", lineHeight: 1.55 }}>
        Placeholder for a single-lesson Matrix+ demo flow (open, checkpoint, wrap-up).
      </p>
      <p className="muted" style={{ margin: 0 }}>
        <Link href={`/matrix-v1/student${q}`}>Student</Link>
        {" · "}
        <Link href={`/matrix-v1/result${q}`}>Result</Link>
      </p>
    </div>
  );
}
