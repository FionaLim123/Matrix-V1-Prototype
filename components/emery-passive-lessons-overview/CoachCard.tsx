import { ArrowRight } from "lucide-react";

import { type TodaysFocus, type TodaysFocusCardCopy, todaysFocusToCoachCopy } from "@/lib/todays-focus";

import { HelpSection } from "./HelpSection";

/** Narrow slice derived only from {@link TodaysFocus} via {@link todaysFocusToCoachCopy}. */
export type CoachCopy = TodaysFocusCardCopy;

type Props = {
  todaysFocus: TodaysFocus;
  /** Roster name for “Today’s focus, …” chrome only; coach lines come from `todaysFocus`. */
  studentDisplayName: string;
  /** Formal quiz/checkpoint navigation only — not the in-video micro-check. Omit to disable until a quiz route exists. */
  onGoToQuiz?: () => void;
  /** When set (returning / struggling personas), takes precedence over `onGoToQuiz` for the primary CTA. */
  onCoachCta?: () => void;
  /** Tooltip when the CTA is disabled (defaults to quiz-prototype copy). */
  disabledCtaHint?: string;
  /** When true, renders the ctaByline beneath the button (shown after CTA is clicked for PASSIVE state). */
  showCtaByline?: boolean;
};

const DEFAULT_DISABLED_HINT = "Coming in the next phase.";

const BORDER_COLOR: Record<string, string> = {
  RETURNING: "bg-matrix-maroon",
  STRUGGLING: "bg-matrix-maroon",
  PASSIVE: "bg-amber-500",
  ON_TRACK: "bg-emerald-500",
};

/**
 * Renders `composeTodaysFocus` → `buildTodaysFocus` output only (via {@link todaysFocusToCoachCopy}).
 */
export function CoachCard({
  todaysFocus,
  studentDisplayName,
  onGoToQuiz,
  onCoachCta,
  disabledCtaHint,
  showCtaByline = false,
}: Props) {
  const data = todaysFocusToCoachCopy(todaysFocus);
  const runCta = onCoachCta ?? onGoToQuiz;
  const ctaDisabled = runCta == null;
  const name = studentDisplayName.trim();
  const borderColor = BORDER_COLOR[todaysFocus.state] ?? "bg-matrix-maroon";
  const showHelp = todaysFocus.state === "RETURNING" || todaysFocus.state === "STRUGGLING";

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-[#EAE3DE] bg-[#FFFDFB] shadow-sm">
      <div className={`absolute bottom-0 left-0 top-0 w-1.5 ${borderColor}`} aria-hidden />

      <div className="px-4 py-3 pl-[1.125rem] sm:py-4 sm:pl-6">
        <div className="mb-1 text-[11px] font-bold tracking-wider text-matrix-maroon">
          {name ? (
            <>
              <span className="uppercase">Today&apos;s focus</span>
              <span className="font-bold normal-case tracking-normal">, {name}</span>
            </>
          ) : (
            <span className="uppercase">{data.label}</span>
          )}
        </div>

        {data.signalContext && (
          <p className="mb-1.5 text-[12px] italic text-gray-400">{data.signalContext}</p>
        )}

        <h2 className="mb-1.5 text-lg font-bold leading-snug text-gray-900">{data.headline}</h2>
        <p className="mb-3 text-[15px] leading-snug text-gray-600">{data.body}</p>

        <div className="mb-3 rounded-lg border border-gray-100 bg-white p-3">
          <p className="mb-2 text-sm leading-snug text-gray-700">
            <span className="font-bold text-gray-900">Why this matters:</span> {data.whyMatters}
          </p>

          <div className="flex flex-col justify-between gap-3 border-t border-gray-50 pt-2 sm:flex-row sm:items-center">
            <p className="text-sm font-medium leading-snug text-gray-800">
              <span className="mr-1 text-gray-500">{data.nextStepPrefix}</span>
              {data.nextStepLesson}
            </p>

            <div className="flex flex-col items-start gap-1 sm:items-end">
              <button
                type="button"
                disabled={ctaDisabled}
                title={ctaDisabled ? (disabledCtaHint ?? DEFAULT_DISABLED_HINT) : undefined}
                onClick={() => runCta?.()}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-matrix-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:bg-matrix-red disabled:opacity-50 disabled:hover:bg-matrix-red"
              >
                {data.ctaLabel}
                <ArrowRight size={15} className="ml-1.5" aria-hidden />
              </button>
              {data.ctaByline && showCtaByline && (
                <p className="text-[11px] text-gray-400">{data.ctaByline}</p>
              )}
            </div>
          </div>
        </div>

        {showHelp && <HelpSection />}
      </div>
    </div>
  );
}
