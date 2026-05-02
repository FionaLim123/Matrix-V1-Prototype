import type { DashboardData } from "@/lib/dashboard-data";
import { PERSONA_SLUG_TO_STUDENT_ID, type PersonaSlug } from "@/lib/demo-persona-student-ids";
import { getCoachForStudent } from "@/lib/coach";
import { composeTodaysFocus, type TodaysFocus } from "@/lib/todays-focus";

export type PersonaPrototypePack = {
  studentDisplayName: string;
  /** All coach strip messaging — {@link composeTodaysFocus} / {@link buildTodaysFocus} only. */
  todaysFocus: TodaysFocus;
};

/** Lessons prototype — engine output only; UI maps via `todaysFocusToCoachCopy` / direct field access. */
export function buildPersonaPrototypePack(persona: PersonaSlug, data: DashboardData): PersonaPrototypePack | null {
  const id = PERSONA_SLUG_TO_STUDENT_ID[persona];
  const student = data.students.find((s) => s.id === id);
  if (!student) return null;

  const { modules, lessons, progress, events, quizzes } = data;
  const { actions, passiveCoach } = getCoachForStudent(
    student.id,
    student.name,
    modules,
    lessons,
    progress,
    events,
    quizzes
  );

  const todaysFocus = composeTodaysFocus(
    student.id,
    student.name,
    modules,
    lessons,
    progress,
    events,
    actions,
    quizzes,
    passiveCoach
  );

  return {
    studentDisplayName: student.name,
    todaysFocus,
  };
}

export function buildAllPersonaPrototypePacks(data: DashboardData): Record<PersonaSlug, PersonaPrototypePack | null> {
  return {
    drew: buildPersonaPrototypePack("drew", data),
    jordan: buildPersonaPrototypePack("jordan", data),
    emery: buildPersonaPrototypePack("emery", data),
  };
}
