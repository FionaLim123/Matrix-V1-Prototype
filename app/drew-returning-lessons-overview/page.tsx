import { redirect } from "next/navigation";

/** Deep link into unified prototype (Returning). */
export default function DrewReturningLessonsOverviewPage() {
  redirect("/v1-prototype?persona=drew");
}
