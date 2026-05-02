import { COACH_NEXT_LESSON_TITLE } from "./mock-data";

export const drewCoachMock = {
  label: "Today's focus, Drew",
  headline: "Nice to have you back, Drew. You're in a good position to keep going.",
  body: "Everything you worked on still counts. One lesson today and you'll be right back in the flow.",
  whyMatters: "Picking this up now will make the next lesson much easier to follow.",
  nextStepPrefix: "Next step:",
  nextStepLesson: COACH_NEXT_LESSON_TITLE,
  ctaLabel: "Jump back into lesson",
} as const;

export const jordanCoachMock = {
  label: "Today's focus, Jordan",
  headline: "You're close — let's tighten up this part before moving on.",
  body: "Your last quiz was 68%. You've got the foundations — now we just need to strengthen a few key parts.",
  whyMatters: "Getting this clear now will make the next topics much easier.",
  nextStepPrefix: "Next step:",
  nextStepLesson: COACH_NEXT_LESSON_TITLE,
  ctaLabel: "Review this concept",
} as const;
