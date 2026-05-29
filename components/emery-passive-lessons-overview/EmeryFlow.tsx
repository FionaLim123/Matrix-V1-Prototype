"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { PersonaPrototypePack } from "@/lib/matrix-persona-prototype-pack";
import type { PersonaSlug } from "@/lib/demo-persona-student-ids";
import { isUuidParam } from "@/lib/uuid-param";
import { MatrixV1Chrome } from "@/components/matrix-v1/MatrixV1Chrome";
import { markBatchSent } from "@/lib/intervention-actions";

import { DrewPassiveLessonsOverviewScreen } from "./DrewPassiveLessonsOverviewScreen";
import { EmeryPassiveLessonsOverviewScreen } from "./EmeryPassiveLessonsOverviewScreen";
import { EmeryPrototypeNav, type EmerySubPrototypeTab, type PrototypePrimaryTab } from "./EmeryPrototypeNav";
import { JordanPassiveLessonsOverviewScreen } from "./JordanPassiveLessonsOverviewScreen";
import { VideoLessonScreen } from "./VideoLessonScreen";

type PendingBatchStudent = {
  id: string;
  name: string;
  studentSubject: string | null;
  parentSubject: string | null;
};

type EmeryFlowProps = {
  initialPrimaryTab?: PrototypePrimaryTab;
  /** Staff table View (`?student=<uuid>`) — same query key as cohort links; shows staff coaching template, not Lessons. */
  initialStaffFeedbackStudentId?: string | null;
  staffFeedbackBody?: ReactNode | null;
  packsByPersona: Record<PersonaSlug, PersonaPrototypePack | null> | null;
  dashboardError?: string | null;
  pendingBatchCount?: number;
  pendingBatchStudents?: PendingBatchStudent[];
  children: ReactNode;
};

/**
 * Unified prototype: staff cohort + three personas + Emery’s two intervention contexts (lessons vs in-lesson check).
 */
export function EmeryFlow({
  initialPrimaryTab = "staff",
  initialStaffFeedbackStudentId = null,
  staffFeedbackBody = null,
  packsByPersona,
  dashboardError = null,
  pendingBatchCount = 0,
  pendingBatchStudents = [],
  children,
}: EmeryFlowProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [primaryTab, setPrimaryTab] = useState<PrototypePrimaryTab>(initialPrimaryTab);
  const [staffFeedbackStudentId, setStaffFeedbackStudentId] = useState<string | null>(() =>
    initialStaffFeedbackStudentId != null && isUuidParam(initialStaffFeedbackStudentId)
      ? initialStaffFeedbackStudentId.trim()
      : null,
  );
  const [emerySub, setEmerySub] = useState<EmerySubPrototypeTab>("lessonsView");
  const [videoSession, setVideoSession] = useState(0);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchSending, setBatchSending] = useState(false);
  const [batchSent, setBatchSent] = useState(false);
  const [expandedBatchStudent, setExpandedBatchStudent] = useState<string | null>(null);
  const detailScrollRef = useRef<HTMLDivElement>(null);

  const applyPrimaryToUrl = useCallback(
    (tab: PrototypePrimaryTab) => {
      const q = new URLSearchParams(searchParams.toString());
      q.delete("student");
      q.delete("staffDetail");
      if (tab === "staff") {
        q.delete("persona");
      } else {
        q.set("persona", tab);
      }
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const personaRaw = searchParams.get("persona");
    const studentRaw = searchParams.get("student");
    const qs = searchParams.toString();

    if (personaRaw === "drew" || personaRaw === "jordan" || personaRaw === "emery") {
      setPrimaryTab(personaRaw);
      setStaffFeedbackStudentId(null);
      const q = new URLSearchParams(qs);
      let changed = false;
      if (q.has("student")) {
        q.delete("student");
        changed = true;
      }
      if (q.has("staffDetail")) {
        q.delete("staffDetail");
        changed = true;
      }
      if (changed) {
        const next = q.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
      return;
    }

    const trimmed = studentRaw?.trim() ?? "";
    if (isUuidParam(trimmed)) {
      setStaffFeedbackStudentId(trimmed);
      setPrimaryTab("staff");
      const q = new URLSearchParams(qs);
      let changed = false;
      if (q.has("persona")) {
        q.delete("persona");
        changed = true;
      }
      if (q.has("staffDetail")) {
        q.delete("staffDetail");
        changed = true;
      }
      if (changed) {
        const next = q.toString();
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
      }
      return;
    }

    setStaffFeedbackStudentId(null);
    setPrimaryTab("staff");
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (!staffFeedbackStudentId) return;
    setVideoSession((s) => s + 1);
    setEmerySub("lessonsView");
    detailScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [staffFeedbackStudentId]);

  const handlePrimaryTab = (tab: PrototypePrimaryTab) => {
    const wasEmeryPersona = primaryTab === "emery" && staffFeedbackStudentId === null;

    if (tab === "emery" && (primaryTab !== "emery" || staffFeedbackStudentId !== null)) {
      setEmerySub("lessonsView");
    }

    const leavingEmery = wasEmeryPersona && tab !== "emery";
    if (leavingEmery) {
      setVideoSession((s) => s + 1);
    }

    setStaffFeedbackStudentId(null);
    setPrimaryTab(tab);
    applyPrimaryToUrl(tab);
  };

  const handleSendBatch = async () => {
    setBatchSending(true);
    try {
      const result = await markBatchSent();
      if (result.ok) {
        setBatchSent(true);
        router.refresh();
        setTimeout(() => {
          setBatchModalOpen(false);
          setBatchSent(false);
        }, 2000);
      }
    } finally {
      setBatchSending(false);
    }
  };

  const handleEmerySub = (sub: EmerySubPrototypeTab) => {
    if (sub === "inLessonCheck" && emerySub !== "inLessonCheck") {
      setVideoSession((s) => s + 1);
    }
    setEmerySub(sub);
  };

  const persona = primaryTab === "staff" ? null : primaryTab;
  const pack = persona ? (packsByPersona?.[persona] ?? null) : null;

  const staffTableDrillDownActive =
    staffFeedbackStudentId !== null && !dashboardError;
  const staffFeedbackContentActive =
    Boolean(staffFeedbackStudentId && staffFeedbackBody) && !dashboardError;

  const showingStaffTable =
    primaryTab === "staff" &&
    !staffFeedbackContentActive &&
    !dashboardError;

  const dataMessage =
    dashboardError ??
    (!staffFeedbackContentActive &&
      !showingStaffTable &&
      primaryTab !== "staff" &&
      pack == null
      ? "Live demo couldn’t load this student’s coaching data. Confirm Supabase is running and seeded."
      : null);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-matrix-bg">
      <EmeryPrototypeNav
        primaryTab={primaryTab}
        staffTableDrillDownActive={staffTableDrillDownActive}
        onPrimaryTab={handlePrimaryTab}
        emerySub={emerySub}
        onEmerySub={handleEmerySub}
        pendingBatchCount={pendingBatchCount}
        onReviewBatch={() => setBatchModalOpen(true)}
      />
      <div
        className={
          !showingStaffTable || dashboardError
            ? "relative flex min-h-0 flex-1 flex-col overflow-hidden border-t border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
            : "relative flex min-h-0 flex-1 flex-col overflow-hidden"
        }
      >
        {dashboardError ? (
          <div className="flex flex-1 items-start justify-center overflow-y-auto p-10">
            <p className="max-w-lg text-center text-sm leading-relaxed text-gray-600" role="alert">
              {dashboardError}
            </p>
          </div>
        ) : staffFeedbackContentActive ? (
          <div ref={detailScrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)] text-[var(--text)] [font-family:ui-sans-serif,system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
            <div className="matrix-v1-prototype-staff-mount mx-auto flex w-full max-w-[1100px] min-h-0 flex-1 flex-col px-5 pb-16 pt-8 sm:px-8">
              <MatrixV1Chrome key={staffFeedbackStudentId ?? "coach"} showHeader={false}>
                {staffFeedbackBody}
              </MatrixV1Chrome>
            </div>
          </div>
        ) : showingStaffTable ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg)] text-[var(--text)] [font-family:ui-sans-serif,system-ui,-apple-system,'Segoe_UI',Roboto,Helvetica,Arial,sans-serif]">
            <div className="matrix-v1-prototype-staff-mount mx-auto flex w-full max-w-[1100px] min-h-0 flex-1 flex-col px-5 pb-16 pt-8 sm:px-8">
              <MatrixV1Chrome showHeader={false}>{children}</MatrixV1Chrome>
            </div>
          </div>
        ) : dataMessage ? (
          <div className="flex flex-1 items-start justify-center overflow-y-auto p-10">
            <p className="max-w-lg text-center text-sm leading-relaxed text-gray-600" role="status">
              {dataMessage}
            </p>
          </div>
        ) : (
          <>
            {persona === "drew" && pack && <DrewPassiveLessonsOverviewScreen {...pack} />}
            {persona === "jordan" && pack && <JordanPassiveLessonsOverviewScreen {...pack} />}
            {persona === "emery" && emerySub === "lessonsView" && pack && (
              <EmeryPassiveLessonsOverviewScreen {...pack} />
            )}
            {persona === "emery" && emerySub === "inLessonCheck" && pack && (
              <VideoLessonScreen
                key={videoSession}
                studentDisplayName={pack.studentDisplayName}
                onBackToLessons={() => setEmerySub("lessonsView")}
              />
            )}
          </>
        )}
      </div>
      {batchModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setBatchModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-[15px] font-bold text-gray-900">Ready to send</h2>
            <p className="mb-4 text-[13px] text-gray-500">
              {pendingBatchCount} student{pendingBatchCount !== 1 ? "s" : ""} —{" "}
              {pendingBatchCount * 2} emails queued
            </p>

            <ul className="mb-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
              {pendingBatchStudents.map((s) => {
                const isExpanded = expandedBatchStudent === s.id;
                const hasPreview = s.studentSubject || s.parentSubject;
                return (
                  <li key={s.id} className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[13px] text-gray-700">
                        <span className="text-matrix-maroon">✉</span>
                        <strong>{s.name}</strong>
                        <span className="text-gray-400">— 2 emails</span>
                      </div>
                      {hasPreview && (
                        <button
                          type="button"
                          onClick={() => setExpandedBatchStudent(isExpanded ? null : s.id)}
                          className="text-[11px] text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? "Hide ▲" : "Preview ▼"}
                        </button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="mt-1.5 space-y-1 pl-5">
                        {s.studentSubject && (
                          <p className="text-[11px] text-gray-500">
                            <span className="font-medium text-gray-600">Student:</span> {s.studentSubject}
                          </p>
                        )}
                        {s.parentSubject && (
                          <p className="text-[11px] text-gray-500">
                            <span className="font-medium text-gray-600">Parent:</span> {s.parentSubject}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="mb-4 text-[12px] text-gray-400">
              Nudge emails and parent digests for all other students send automatically.
            </p>

            {batchSent ? (
              <p className="text-center text-[14px] font-semibold text-emerald-600">
                ✓ Sent successfully
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSendBatch}
                  disabled={batchSending}
                  className="flex-1 rounded-lg bg-matrix-maroon px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-900 disabled:opacity-50"
                >
                  {batchSending ? "Sending…" : `Send all ${pendingBatchCount * 2} emails`}
                </button>
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] text-gray-500 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
