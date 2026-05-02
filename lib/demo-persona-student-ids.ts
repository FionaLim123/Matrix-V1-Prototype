/**
 * Fixed UUIDs from `supabase/seed.sql` — Matrix+ demo students used for behaviour-signal coaching.
 * Keep in sync with seed when adding or renaming rows.
 */
export const DEMO_PERSONA_STUDENT_ID = {
  drewPatel: "a1111111-1111-1111-1111-111111111111",
  jordanBlake: "a1111111-1111-1111-1111-111111111109",
  emeryChen: "a1111111-1111-1111-1111-111111111113",
} as const;

export type PersonaSlug = "drew" | "jordan" | "emery";

export const PERSONA_SLUG_TO_STUDENT_ID: Record<PersonaSlug, string> = {
  drew: DEMO_PERSONA_STUDENT_ID.drewPatel,
  jordan: DEMO_PERSONA_STUDENT_ID.jordanBlake,
  emery: DEMO_PERSONA_STUDENT_ID.emeryChen,
};

/** Map roster id → ?persona= slug (top nav student-facing prototypes). Staff table View uses ?student=<uuid> with MatrixStudentLessonsCore (same as /matrix-v1/student). */
export const STUDENT_ID_TO_PERSONA_SLUG: Record<string, PersonaSlug> = {
  [DEMO_PERSONA_STUDENT_ID.drewPatel]: "drew",
  [DEMO_PERSONA_STUDENT_ID.jordanBlake]: "jordan",
  [DEMO_PERSONA_STUDENT_ID.emeryChen]: "emery",
};
