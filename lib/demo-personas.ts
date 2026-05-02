/**
 * Central demo persona facts for the three seeded Matrix+ prototype students.
 * Used when coach resolution is missing a lesson title, quiz title, or score (partial/offline data).
 */

import { PERSONA_SLUG_TO_STUDENT_ID, type PersonaSlug } from "@/lib/demo-persona-student-ids";

export function demoPersonaSlugFromStudentId(studentId: string): PersonaSlug | null {
  const entries = Object.entries(PERSONA_SLUG_TO_STUDENT_ID) as [PersonaSlug, string][];
  const hit = entries.find(([, id]) => id === studentId);
  return hit ? hit[0] : null;
}

export type DemoPersonaCoachFallback = {
  lessonName?: string;
  quizName?: string | null;
  /** Used when STRUGGLING and progress has no score */
  score?: number;
  lastActivityDate?: string;
};

type DemoPersonaRow = {
  displayName: string;
  firstName: string;
  coachFallback: DemoPersonaCoachFallback;
};

export const DEMO_PERSONAS: Record<PersonaSlug, DemoPersonaRow> = {
  drew: {
    displayName: "Drew Patel",
    firstName: "Drew",
    coachFallback: {
      lessonName: "Further Trigonometry 2 – Arc Lengths, Area of Sectors and Segments",
      lastActivityDate: "10 April 2026",
    },
  },
  jordan: {
    displayName: "Jordan Blake",
    firstName: "Jordan",
    coachFallback: {
      lessonName: "Introductory Calculus 1 – Introduction to Differentiation",
      score: 68,
    },
  },
  emery: {
    displayName: "Emery Chen",
    firstName: "Emery",
    coachFallback: {
      lessonName: "Introductory Calculus 2 – Chain Rule, Product Rule, Quotient Rule",
      quizName: "Checkpoint",
    },
  },
};

export function getDemoPersonaCoachFallback(studentId: string): DemoPersonaCoachFallback | null {
  const slug = demoPersonaSlugFromStudentId(studentId);
  return slug ? DEMO_PERSONAS[slug].coachFallback : null;
}

/** UI fallback when a screen has no live `studentDisplayName` (e.g. Storybook). */
export function fallbackDisplayNameForPersona(slug: PersonaSlug): string {
  return DEMO_PERSONAS[slug].displayName;
}
