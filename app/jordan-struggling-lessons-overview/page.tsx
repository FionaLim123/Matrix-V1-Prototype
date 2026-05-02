import { redirect } from "next/navigation";

/** Deep link into unified prototype (Struggling). */
export default function JordanStrugglingLessonsOverviewPage() {
  redirect("/v1-prototype?persona=jordan");
}
