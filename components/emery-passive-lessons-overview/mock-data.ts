import type { ActivityFeedItem } from "@/components/matrix-lessons";

export type LessonStatus = "Completed" | "Online";

export type LessonRow = {
  title: string;
  imageColor: string;
  progress: number;
  sections: number;
  status: LessonStatus;
  /** Seeded `lessons.id` — used to anchor coach CTAs when it matches `focalLessonId` from the rule engine. */
  dbLessonId?: string;
};

/** Shared mock “next lesson” line for Drew/Jordan passive coach stubs. */
export const COACH_NEXT_LESSON_TITLE = "Further Trigonometry 1 — Review and Introduction to Radians";

export const lessonsMock: LessonRow[] = [
  {
    title: "Course Introduction",
    imageColor: "bg-gradient-to-r from-gray-200 to-gray-300",
    progress: 100,
    sections: 2,
    status: "Completed",
  },
  {
    title: "Work Book Solutions",
    imageColor: "bg-gradient-to-r from-cyan-400 to-blue-500",
    progress: 100,
    sections: 1,
    status: "Completed",
  },
  {
    title: "Further Trigonometry 1 — Review and Introduction to Radians",
    imageColor: "bg-gradient-to-r from-teal-600 to-emerald-800",
    progress: 80,
    sections: 5,
    status: "Online",
    dbLessonId: "d1111111-1111-1111-1111-111111111101",
  },
  {
    title: "Further Trigonometry 2 — Arc Lengths, Area of Sectors and Segments",
    imageColor: "bg-gradient-to-r from-blue-100 to-blue-200",
    progress: 33,
    sections: 3,
    status: "Online",
    dbLessonId: "d1111111-1111-1111-1111-111111111102",
  },
  {
    title: "Introductory Calculus 1 — Introduction to Differentiation",
    imageColor: "bg-gradient-to-r from-teal-500 to-cyan-700",
    progress: 68,
    sections: 4,
    status: "Online",
    dbLessonId: "d1111111-1111-1111-1111-111111111103",
  },
  {
    title: "Introductory Calculus 2 — Chain Rule, Product Rule, Quotient Rule",
    imageColor: "bg-gradient-to-r from-orange-100 to-amber-200",
    progress: 45,
    sections: 6,
    status: "Online",
    dbLessonId: "d1111111-1111-1111-1111-111111111104",
  },
];

export const activityFeedMock: ActivityFeedItem[] = [
  { title: "A user", description: "Viewed assignment Quiz 2" },
  { title: "A user", description: "Viewed section in lesson Lesson 2 - Fu..." },
  { title: "A user", description: "Viewed lessons overview" },
];
