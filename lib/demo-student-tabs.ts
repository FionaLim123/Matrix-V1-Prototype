/** Demo walkthrough: same tabs on /student and /dashboard. */

export const DEMO_STUDENT_TABS = [
  { slug: "drew", label: "Drew Patel" },
  { slug: "emery", label: "Emery Chen" },
  { slug: "jordan", label: "Jordan Blake" },
] as const;

/** Preserve URL slug when valid; otherwise infer from selected student name. */
export function demoStudentSlugForLinks(selectedName: string, studentParam: string | undefined | null): string {
  const p = studentParam?.trim().toLowerCase();
  if (p && DEMO_STUDENT_TABS.some((t) => t.slug === p)) return p;
  const hit = DEMO_STUDENT_TABS.find((t) => selectedName.toLowerCase().includes(t.slug));
  return hit?.slug ?? DEMO_STUDENT_TABS[0].slug;
}
