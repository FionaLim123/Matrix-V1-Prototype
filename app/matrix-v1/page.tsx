import { redirect } from "next/navigation";

type SearchParams = { student?: string };

export default async function MatrixV1RootPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.student?.trim()) q.set("student", sp.student.trim());
  const s = q.toString();
  redirect(s ? `/matrix-v1/staff?${s}` : "/matrix-v1/staff");
}
