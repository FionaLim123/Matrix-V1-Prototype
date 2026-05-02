"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Play,
  RotateCcw,
} from "lucide-react";

/** Matches Magic Patterns LessonVideoView.checkState / videoState. */
export type EmeryCheckState = "unanswered" | "success" | "recovery";
export type EmeryVideoSurface = "playing" | "ended" | "ended-dismissed";

/** Hollow ring always visible before selection (Magic Patterns: light ring on dark, not faint). */
function radioRingClass(submitted: boolean, selected: boolean, isCorrectAnswer: boolean): string {
  const base =
    "box-border flex shrink-0 h-5 w-5 min-h-[20px] min-w-[20px] items-center justify-center rounded-full";
  if (!submitted) {
    if (selected) {
      return `${base} border-2 border-white bg-black/35`;
    }
    /* Idle: bright ring reads clearly on brown panels */
    return `${base} border-2 border-white bg-black/35 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]`;
  }
  if (isCorrectAnswer) {
    return `${base} border-2 border-emerald-400 bg-emerald-950/60`;
  }
  if (selected) return `${base} border-2 border-amber-400 bg-amber-950/40`;
  return `${base} border-2 border-zinc-500 bg-zinc-950/90`;
}

function radioDotClass(
  submitted: boolean,
  selected: boolean,
  isCorrectAnswer: boolean,
): string {
  const show = selected || (submitted && isCorrectAnswer);
  if (!show) return "scale-90 opacity-0";
  if (!submitted) return "scale-100 bg-white opacity-100";
  if (isCorrectAnswer) return "scale-100 bg-emerald-300 opacity-100 shadow-sm";
  return "scale-100 bg-amber-200 opacity-100 shadow-sm";
}

type Props = {
  videoState: EmeryVideoSurface;
  setVideoState: (v: EmeryVideoSurface) => void;
  checkState: EmeryCheckState;
  setCheckState: (s: EmeryCheckState) => void;
  q1Answer: string | null;
  q2Answer: string | null;
  setQ1Answer: (id: string | null) => void;
  setQ2Answer: (id: string | null) => void;
  onSuccessContinue: () => void;
  onDismissVideoEnd: () => void;
};

/**
 * Main column only — faithful port of Magic Patterns `LessonVideoView.tsx`
 * (top lesson bar, subtitle, video shell, micro-check overlay, progress tick).
 */
export function EmeryLessonVideoColumn({
  videoState,
  setVideoState,
  checkState,
  setCheckState,
  q1Answer,
  q2Answer,
  setQ1Answer,
  setQ2Answer,
  onSuccessContinue,
  onDismissVideoEnd,
}: Props) {
  const isBothAnswered = q1Answer !== null && q2Answer !== null;
  const isSubmitted = checkState !== "unanswered";
  const isQ1Correct = q1Answer === "B";
  const isQ2Correct = q2Answer === "C";

  const isContinueActive =
    videoState === "ended-dismissed" ||
    (videoState === "ended" && checkState === "success");

  const getOptionStyle = (question: 1 | 2, optionId: string, correctId: string) => {
    const selected = question === 1 ? q1Answer : q2Answer;
    const isSelected = selected === optionId;
    const isCorrect = optionId === correctId;
    if (!isSubmitted) {
      /* Visible white outline on idle options vs dark fills */
      return isSelected
        ? "border-white/65 bg-black/35"
        : "border-white/45 bg-black/25 hover:bg-black/40 hover:border-white/55";
    }
    if (isCorrect) return "border-emerald-500/50 bg-emerald-500/10";
    if (isSelected && !isCorrect) return "border-amber-500/50 bg-amber-500/10";
    return "border-white/10 bg-black/20 opacity-70";
  };

  const handleCheck = () => {
    if (!isBothAnswered) return;
    if (isQ1Correct && isQ2Correct) {
      setCheckState("success");
      return;
    }
    setCheckState("recovery");
  };

  /** MP: skip hides overlay and shows “Video ended”; header Continue becomes active. */
  const handleSkip = () => {
    setVideoState("ended-dismissed");
  };

  /** MP: rewatches — then “End clip” returns to micro-check with fresh answers. */
  const handleRewatch = () => {
    setVideoState("playing");
    setCheckState("unanswered");
    setQ1Answer(null);
    setQ2Answer(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center px-4 py-2 bg-matrix-maroon text-white rounded-full text-sm font-bold hover:bg-[#3A2220] transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" />
          Previous
        </button>

        <h2 className="truncate px-2 text-center text-lg font-bold text-gray-900">
          Lesson 1 — Further Trigonometry 1
        </h2>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FileText size={18} />
          </button>
          <button
            type="button"
            onClick={isContinueActive ? onDismissVideoEnd : undefined}
            disabled={!isContinueActive}
            className={`flex items-center px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              isContinueActive
                ? "bg-matrix-maroon text-white hover:bg-[#3A2220]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>

      <h3 className="mb-1.5 shrink-0 text-base font-bold text-gray-900">
        Theory Lesson Video — Lesson 1 — Video 2
      </h3>

      <div className="relative mx-auto w-full aspect-video max-h-[min(460px,calc(100vh-10rem))] min-h-0 overflow-hidden rounded-lg border-4 border-white bg-[#2A1A10] shadow-sm ring-1 ring-gray-100">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />

        {videoState === "playing" && (
          <div className="relative z-10 text-center w-full h-full flex flex-col items-center justify-center px-4">
            <p className="text-white/70 text-sm font-medium mb-4">Year 11 Maths Adv</p>
            <h1 className="text-white text-4xl font-bold mb-2">Further Trigonometry 1</h1>
            <p className="text-white/80 text-xl font-medium mb-12">Review of Trigonometry</p>

            <button
              type="button"
              className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto hover:bg-white/30 transition-colors backdrop-blur-sm"
              aria-label="Play (demo)"
            >
              <Play size={32} className="text-white ml-2" fill="white" />
            </button>

            <button
              type="button"
              onClick={() => setVideoState("ended")}
              className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white/80 text-xs rounded backdrop-blur-sm transition-colors"
            >
              End clip
            </button>
          </div>
        )}

        {videoState === "ended-dismissed" && (
          <div className="relative z-10 text-center w-full h-full flex flex-col items-center justify-center">
            <button
              type="button"
              className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto hover:bg-white/20 transition-colors backdrop-blur-sm mb-4"
              aria-label="Replay"
            >
              <RotateCcw size={24} className="text-white/70" />
            </button>
            <p className="text-white/50 text-sm font-medium">Video ended</p>
          </div>
        )}

        {videoState === "ended" && (
          <div className="pointer-events-auto absolute inset-0 z-20 flex items-stretch justify-center bg-black/55 p-1.5 sm:p-2">
            <div className="flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden rounded-md border border-white/15 bg-[#2A1A10] shadow-2xl pointer-events-auto">
              {checkState === "success" ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-5 text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-matrix-red/10">
                    <CheckCircle2 size={22} className="text-matrix-red" />
                  </div>
                  <h3 className="mb-3 text-base font-bold text-white">Nice — that&apos;s landed well.</h3>
                  <button
                    type="button"
                    onClick={onSuccessContinue}
                    className="inline-flex items-center justify-center rounded-md bg-matrix-red px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                  >
                    Continue lesson
                    <ArrowRight size={16} className="ml-1.5" />
                  </button>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 pb-1.5 pt-2 sm:px-3">
                  <div className="mb-0.5 shrink-0">
                    <p className="mb-0 text-[10px] font-bold uppercase tracking-wider text-white/50">
                      Quick check-in
                    </p>
                    <p className="text-[13px] leading-tight text-white">
                      Before you move on - two quick questions:
                    </p>
                  </div>

                  <div className="mb-1.5 min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-y-contain [scrollbar-width:thin]">
                    {/* Q1 — Magic Patterns */}
                    <div
                      className={`rounded border px-2 py-2 transition-colors ${
                        isSubmitted
                          ? isQ1Correct
                            ? "border-emerald-500/40 bg-emerald-950/40"
                            : "border-amber-500/40 bg-amber-950/30"
                          : "border-white/35 bg-black/20"
                      }`}
                    >
                      <p className="mb-1 text-[13px] font-bold leading-tight text-white">
                        A triangle has sides of 7cm and 9cm with an included angle of 65°. Which
                        rule gives you the third side?
                      </p>
                      <div className="space-y-1" role="radiogroup" aria-label="Understanding check 1">
                        {(
                          [
                            { id: "A", text: "The sine rule" },
                            { id: "B", text: "The cosine rule" },
                            { id: "C", text: "Pythagoras' theorem" },
                          ] as const
                        ).map((option) => {
                          const selected = q1Answer === option.id;
                          const isCorrectAnswer = option.id === "B";
                          return (
                            <label
                              key={option.id}
                              className={`flex w-full cursor-pointer items-center gap-1.5 rounded border px-2 py-1 transition-colors ${
                                isSubmitted ? "cursor-default" : ""
                              } ${getOptionStyle(1, option.id, "B")}`}
                            >
                              <input
                                type="radio"
                                name="emery-microcheck-q1"
                                value={option.id}
                                checked={selected}
                                disabled={isSubmitted}
                                onChange={() => setQ1Answer(option.id)}
                                className="sr-only"
                              />
                              <span
                                aria-hidden
                                className={`${radioRingClass(
                                  isSubmitted,
                                  selected,
                                  isCorrectAnswer,
                                )}`}
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full transition ${radioDotClass(
                                    isSubmitted,
                                    selected,
                                    isCorrectAnswer,
                                  )}`}
                                />
                              </span>
                              <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-white">
                                {option.text}
                              </span>
                              {isSubmitted && option.id === "B" && (
                                <CheckCircle2
                                  size={16}
                                  className="shrink-0 text-emerald-400"
                                  aria-hidden
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Q2 — Magic Patterns */}
                    <div
                      className={`rounded border px-2 py-2 transition-colors ${
                        isSubmitted
                          ? isQ2Correct
                            ? "border-emerald-500/40 bg-emerald-950/40"
                            : "border-amber-500/40 bg-amber-950/30"
                          : "border-white/35 bg-black/20"
                      }`}
                    >
                      <p className="mb-1 text-[13px] font-bold leading-tight text-white">
                        You know two angles and the side opposite one of them. Which rule applies?
                      </p>
                      <div className="space-y-1" role="radiogroup" aria-label="Understanding check 2">
                        {(
                          [
                            { id: "A", text: "The cosine rule" },
                            { id: "B", text: "SOHCAHTOA" },
                            { id: "C", text: "The sine rule" },
                          ] as const
                        ).map((option) => {
                          const selected = q2Answer === option.id;
                          const isCorrectAnswer = option.id === "C";
                          return (
                            <label
                              key={option.id}
                              className={`flex w-full cursor-pointer items-center gap-1.5 rounded border px-2 py-1 transition-colors ${
                                isSubmitted ? "cursor-default" : ""
                              } ${getOptionStyle(2, option.id, "C")}`}
                            >
                              <input
                                type="radio"
                                name="emery-microcheck-q2"
                                value={option.id}
                                checked={selected}
                                disabled={isSubmitted}
                                onChange={() => setQ2Answer(option.id)}
                                className="sr-only"
                              />
                              <span
                                aria-hidden
                                className={`${radioRingClass(
                                  isSubmitted,
                                  selected,
                                  isCorrectAnswer,
                                )}`}
                              >
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full transition ${radioDotClass(
                                    isSubmitted,
                                    selected,
                                    isCorrectAnswer,
                                  )}`}
                                />
                              </span>
                              <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-white">
                                {option.text}
                              </span>
                              {isSubmitted && option.id === "C" && (
                                <CheckCircle2
                                  size={16}
                                  className="shrink-0 text-emerald-400"
                                  aria-hidden
                                />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 border-t border-white/10 pt-1">
                    {checkState === "unanswered" && (
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={handleCheck}
                          disabled={!isBothAnswered}
                          className={`w-full rounded-md py-2 text-sm font-semibold shadow-sm transition-colors ${
                            isBothAnswered
                              ? "bg-white text-gray-900 hover:bg-gray-100"
                              : "cursor-not-allowed border border-white/15 bg-black/40 text-white/50"
                          }`}
                        >
                          Check this
                        </button>
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="appearance-none [-webkit-tap-highlight-color:transparent] cursor-pointer self-center border-0 bg-transparent p-0 text-center text-[13px] font-normal text-sky-300/85 shadow-none outline-none hover:text-sky-200/95 focus-visible:outline-none"
                        >
                          Skip for now →
                        </button>
                      </div>
                    )}

                    {checkState === "recovery" && (
                      <div className="flex flex-col gap-1.5 px-0.5 text-center">
                        <div>
                          <h4 className="mb-0.5 text-sm font-bold text-white">
                            Let&apos;s revisit that bit.
                          </h4>
                          <p className="text-[12px] leading-snug text-white/75">
                            This part of the lesson explains how the cosine rule applies when two sides
                            and the included angle are known — and when the sine rule is the better fit.
                          </p>
                          <p className="mt-1 text-[12px] leading-snug text-white/60">
                            The worked example at{" "}
                            <span className="font-medium text-white/85">2:14</span> walks through it in about 30 seconds.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRewatch}
                          className="flex w-full items-center justify-center rounded-md bg-matrix-red py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                        >
                          <RotateCcw size={15} className="mr-1.5 shrink-0" />
                          Rewatch from 2:14 →
                        </button>
                        <button
                          type="button"
                          onClick={handleSkip}
                          className="appearance-none [-webkit-tap-highlight-color:transparent] cursor-pointer border-0 bg-transparent p-0 text-center text-[13px] font-normal text-sky-300/85 outline-none hover:text-sky-200/95 focus-visible:outline-none"
                        >
                          Continue anyway →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-10 flex justify-center">
          <div className="w-16 h-1.5 bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}
