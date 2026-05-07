"use client";

import type { PersonaSlug } from "@/lib/demo-persona-student-ids";

export type PrototypePrimaryTab = "staff" | PersonaSlug;
/** @deprecated Use `PrototypePrimaryTab` — kept for imports that meant persona-only. */
export type PersonaPrototypeTab = PersonaSlug;
export type EmerySubPrototypeTab = "lessonsView" | "inLessonCheck";

type Props = {
  primaryTab: PrototypePrimaryTab;
  /** Staff table View (`?student=` roster id) — Staff tab stays selected; persona tabs inactive. */
  staffTableDrillDownActive: boolean;
  onPrimaryTab: (tab: PrototypePrimaryTab) => void;
  emerySub: EmerySubPrototypeTab;
  onEmerySub: (sub: EmerySubPrototypeTab) => void;
};

function labelPrimary(text: string) {
  return (
    <span className="select-none whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
      {text}
    </span>
  );
}

function labelSecondary(text: string) {
  return (
    <span className="select-none whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.1em] text-slate-600">
      {text}
    </span>
  );
}

const segPrimary =
  "inline-flex items-center gap-0.5 rounded-xl bg-slate-800/60 p-1 ring-1 ring-white/10";
const segSecondary =
  "inline-flex items-center gap-0.5 rounded-lg bg-slate-800/35 p-0.5 ring-1 ring-white/[0.06]";

const btnBase =
  "appearance-none border-0 bg-transparent whitespace-nowrap rounded-lg font-medium transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] focus-visible:ring-cyan-400/35";

/** Centered prototype chrome — soft segments, readable inactives, secondary de-emphasized. */
export function EmeryPrototypeNav({
  primaryTab,
  staffTableDrillDownActive,
  onPrimaryTab,
  emerySub,
  onEmerySub,
}: Props) {
  return (
    <nav
      className="relative z-[100] w-full shrink-0 border-b border-white/[0.06] bg-[#0f172a]"
      aria-label="Prototype demos"
    >
      <div className="px-6 py-3 sm:px-10">
        <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between gap-x-8 gap-y-3">
          <div className="min-w-0 shrink-0">
            <p className="matrix-v1-product text-sm font-semibold leading-tight text-slate-100">
              Matrix+ Intelligence
            </p>
            <p className="matrix-v1-tagline text-xs leading-tight text-slate-400">
              Guidance &amp; Recovery Layer
            </p>
          </div>

          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-8 gap-y-3">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
            {labelPrimary("Prototype state:")}
            <div role="tablist" aria-label="Persona prototype" className={segPrimary}>
              <button
                type="button"
                role="tab"
                aria-selected={primaryTab === "staff"}
                className={`${btnBase} px-3.5 py-1.5 text-[13px] leading-snug text-slate-200 hover:bg-white/5 hover:text-white ${
                  primaryTab === "staff"
                    ? "!bg-matrix-maroon !text-white shadow-[0_1px_2px_rgba(0,0,0,0.22)] hover:!bg-matrix-maroon"
                    : ""
                }`}
                onClick={() => onPrimaryTab("staff")}
              >
                Staff view
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!staffTableDrillDownActive && primaryTab === "drew"}
                className={`${btnBase} px-3.5 py-1.5 text-[13px] leading-snug text-slate-200 hover:bg-white/5 hover:text-white ${
                  !staffTableDrillDownActive && primaryTab === "drew"
                    ? "!bg-matrix-maroon !text-white shadow-[0_1px_2px_rgba(0,0,0,0.22)] hover:!bg-matrix-maroon"
                    : ""
                }`}
                onClick={() => onPrimaryTab("drew")}
              >
                Returning (Drew)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!staffTableDrillDownActive && primaryTab === "jordan"}
                className={`${btnBase} px-3.5 py-1.5 text-[13px] leading-snug text-slate-200 hover:bg-white/5 hover:text-white ${
                  !staffTableDrillDownActive && primaryTab === "jordan"
                    ? "!bg-matrix-maroon !text-white shadow-[0_1px_2px_rgba(0,0,0,0.22)] hover:!bg-matrix-maroon"
                    : ""
                }`}
                onClick={() => onPrimaryTab("jordan")}
              >
                Struggling (Jordan)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!staffTableDrillDownActive && primaryTab === "emery"}
                className={`${btnBase} px-3.5 py-1.5 text-[13px] leading-snug text-slate-200 hover:bg-white/5 hover:text-white ${
                  !staffTableDrillDownActive && primaryTab === "emery"
                    ? "!bg-matrix-maroon !text-white shadow-[0_1px_2px_rgba(0,0,0,0.22)] hover:!bg-matrix-maroon"
                    : ""
                }`}
                onClick={() => onPrimaryTab("emery")}
              >
                Passive (Emery)
              </button>
            </div>
          </div>

            {!staffTableDrillDownActive && primaryTab === "emery" ? (
              <>
                <div className="h-5 w-px shrink-0 bg-white/[0.08]" aria-hidden />

                <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
                  {labelSecondary("Screen:")}
                  <div role="tablist" aria-label="Passive prototype screen" className={segSecondary}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={emerySub === "lessonsView"}
                      className={`${btnBase} px-3 py-1 text-[12px] leading-snug text-slate-300 hover:bg-white/5 hover:text-slate-100 ${
                        emerySub === "lessonsView"
                          ? "!bg-matrix-maroon/95 !text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] hover:!bg-matrix-maroon"
                          : ""
                      }`}
                      onClick={() => onEmerySub("lessonsView")}
                    >
                      Lessons Overview
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={emerySub === "inLessonCheck"}
                      className={`${btnBase} px-3 py-1 text-[12px] leading-snug text-slate-300 hover:bg-white/5 hover:text-slate-100 ${
                        emerySub === "inLessonCheck"
                          ? "!bg-matrix-maroon/95 !text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] hover:!bg-matrix-maroon"
                          : ""
                      }`}
                      onClick={() => onEmerySub("inLessonCheck")}
                    >
                      Video + Micro-check
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
