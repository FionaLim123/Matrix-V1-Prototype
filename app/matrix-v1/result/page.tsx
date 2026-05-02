import Link from "next/link";
import { matrixV1QuerySuffix } from "@/lib/matrix-v1-query";

type SearchParams = { student?: string };

export default async function MatrixV1ResultPlaceholderPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = matrixV1QuerySuffix(sp);

  return (
    <div className="matrix-v1-placeholder">
      <h1 className="matrix-v1-page-title">Result</h1>
      <p style={{ margin: "0 0 1rem", maxWidth: "34rem", lineHeight: 1.55 }}>
        Placeholder for quiz or checkpoint outcomes in the Matrix+ demo story.
      </p>
      <p className="muted" style={{ margin: 0 }}>
        <Link href={`/matrix-v1/reentry${q}`}>Re-entry</Link>
        {" · "}
        <Link href={`/matrix-v1/student${q}`}>Student</Link>
      </p>
    </div>
  );
}
