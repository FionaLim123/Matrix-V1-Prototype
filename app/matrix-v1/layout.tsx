import type { Metadata } from "next";

import { MatrixV1Chrome } from "@/components/matrix-v1/MatrixV1Chrome";

export const metadata: Metadata = {
  title: "Matrix+ Intelligence — Cohort guidance (demo)",
  description: "Matrix+ Guidance & Recovery Layer — weekly cohort prioritisation demo.",
};

export default function MatrixV1Layout({ children }: { children: React.ReactNode }) {
  return <MatrixV1Chrome>{children}</MatrixV1Chrome>;
}
