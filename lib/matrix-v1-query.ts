/** Preserves demo persona when linking between Matrix+ V1 routes. */
export type MatrixV1SearchParams = { student?: string };

export function matrixV1QuerySuffix(sp: MatrixV1SearchParams): string {
  const q = new URLSearchParams();
  if (sp.student?.trim()) q.set("student", sp.student.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}
