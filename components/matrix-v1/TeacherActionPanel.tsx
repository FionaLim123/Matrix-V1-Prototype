"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StaffStudentRow, CohortKey } from "@/lib/matrix-v1-staff-model";
import { logIntervention } from "@/lib/intervention-actions";

const BORDER: Record<CohortKey, string> = {
  needs_intervention: "border-matrix-maroon",
  needs_nudge: "border-amber-400",
  on_track: "border-emerald-400",
};

function parseEmailDraft(draft: string): { subject: string; body: string } {
  const nl = draft.indexOf("\n");
  const subjectLine = nl === -1 ? draft : draft.slice(0, nl);
  const subject = subjectLine.startsWith("Subject: ") ? subjectLine.slice(9) : subjectLine;
  const body = nl === -1 ? "" : draft.slice(nl).replace(/^\n+/, "");
  return { subject, body };
}

function rebuildDraft(original: string, newBody: string | null): string {
  if (!newBody) return original;
  const nl = original.indexOf("\n");
  const subjectLine = nl === -1 ? original : original.slice(0, nl);
  return `${subjectLine}\n\n${newBody}`;
}

function EmailPreviewCard({
  label,
  draft,
  onBodyChange,
}: {
  label: string;
  draft: string;
  onBodyChange?: (newBody: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { subject, body } = parseEmailDraft(draft);
  const [editText, setEditText] = useState(body);

  const handleDone = () => {
    onBodyChange?.(editText);
    setEditing(false);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {label}
          </p>
          <p className="truncate text-[13px] font-medium leading-snug text-gray-800">{subject}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (open) setEditing(false);
          }}
          className="shrink-0 text-[12px] font-medium text-matrix-maroon hover:underline"
        >
          {open ? "Hide" : "Preview"}
        </button>
      </div>
      {open && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          {editing ? (
            <>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={8}
                className="w-full rounded border border-gray-300 px-2.5 py-2 font-sans text-[12px] leading-relaxed text-gray-700 focus:border-matrix-maroon focus:outline-none"
              />
              <button
                type="button"
                onClick={handleDone}
                className="mt-1.5 text-[12px] font-medium text-matrix-maroon hover:underline"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-gray-600">
                {editText}
              </pre>
              {onBodyChange && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-2 text-[12px] text-gray-400 hover:text-gray-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

type Props = {
  row: StaffStudentRow;
  alreadyActioned: boolean;
  alreadyEscalated: boolean;
};

export function TeacherActionPanel({ row, alreadyActioned, alreadyEscalated }: Props) {
  const router = useRouter();
  const [added, setAdded] = useState(alreadyActioned);
  const [escalated, setEscalated] = useState(alreadyEscalated);
  const [loading, setLoading] = useState(false);
  const [escalateLoading, setEscalateLoading] = useState(false);
  const [editedStudentBody, setEditedStudentBody] = useState<string | null>(null);
  const [editedParentBody, setEditedParentBody] = useState<string | null>(null);

  const fn = row.label.split(" ")[0] ?? row.label;

  const handleAddToBatch = async () => {
    setLoading(true);
    try {
      const result = await logIntervention({
        studentId: row.studentId,
        actionType: "support",
        cohortTier: row.cohort,
        studentEmailDraft: row.studentEmailDraft
          ? rebuildDraft(row.studentEmailDraft, editedStudentBody)
          : undefined,
        parentEmailDraft: row.parentEmailDraft
          ? rebuildDraft(row.parentEmailDraft, editedParentBody)
          : undefined,
      });
      if (result.ok) {
        setAdded(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setEscalateLoading(true);
    try {
      const result = await logIntervention({
        studentId: row.studentId,
        actionType: "escalated",
        cohortTier: row.cohort,
      });
      if (result.ok) {
        setEscalated(true);
        router.refresh();
      }
    } finally {
      setEscalateLoading(false);
    }
  };

  if (row.cohort === "on_track") {
    return (
      <div className={`mb-4 max-w-[42rem] rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm ${BORDER.on_track}`}>
        <p className="mb-0.5 text-[14px] font-semibold text-gray-800">No action needed this week</p>
        <p className="mb-2 text-[13px] text-gray-500">
          Parent digest sending automatically — nothing else required.
        </p>
        {row.parentEmailDraft && (
          <EmailPreviewCard label="✉ Parent digest" draft={row.parentEmailDraft} />
        )}
      </div>
    );
  }

  if (row.cohort === "needs_nudge") {
    return (
      <div className={`mb-4 max-w-[42rem] rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm ${BORDER.needs_nudge}`}>
        <p className="mb-2 text-[13px] text-gray-600">
          ✉ Automated email sending to {fn} and their parent this week.
        </p>
        <div className="space-y-2">
          {row.studentEmailDraft && (
            <EmailPreviewCard
              label={`✉ Student — ${fn}`}
              draft={row.studentEmailDraft}
              onBodyChange={(body) => setEditedStudentBody(body)}
            />
          )}
          {row.parentEmailDraft && (
            <EmailPreviewCard
              label="✉ Parent"
              draft={row.parentEmailDraft}
              onBodyChange={(body) => setEditedParentBody(body)}
            />
          )}
        </div>
        {!added && (editedStudentBody !== null || editedParentBody !== null) && (
          <div className="mt-2">
            <button
              type="button"
              onClick={handleAddToBatch}
              disabled={loading}
              className="rounded-md border border-amber-400 px-3.5 py-1.5 text-[13px] font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              {loading ? "Adding…" : "Save & add to batch"}
            </button>
          </div>
        )}
        {added && (
          <p className="mt-2 text-[13px] font-semibold text-emerald-600">
            ✓ Custom version added to batch
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-4 max-w-[42rem] rounded-lg border-l-4 bg-white px-4 py-3 shadow-sm ${BORDER.needs_intervention}`}>
      <div className="mb-2 space-y-2">
        {row.studentEmailDraft && (
          <EmailPreviewCard
            label={`✉ Student — ${fn}`}
            draft={row.studentEmailDraft}
            onBodyChange={(body) => setEditedStudentBody(body)}
          />
        )}
        {row.parentEmailDraft && (
          <EmailPreviewCard
            label="✉ Parent"
            draft={row.parentEmailDraft}
            onBodyChange={(body) => setEditedParentBody(body)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {added ? (
          <span className="text-[13px] font-semibold text-emerald-600">✓ Added to batch</span>
        ) : (
          <button
            type="button"
            onClick={handleAddToBatch}
            disabled={loading}
            className="rounded-md bg-matrix-maroon px-3.5 py-1.5 text-[13px] font-semibold text-white hover:bg-red-900 disabled:opacity-50"
          >
            {loading ? "Adding…" : `+ Add ${fn} to batch`}
          </button>
        )}
        {escalated ? (
          <span className="text-[12px] text-gray-400">✓ Teacher notified by email</span>
        ) : (
          <button
            type="button"
            onClick={handleEscalate}
            disabled={escalateLoading}
            className="text-[12px] text-gray-400 hover:text-gray-600 hover:underline disabled:opacity-40"
          >
            {escalateLoading ? "Notifying…" : "Notify teacher directly"}
          </button>
        )}
      </div>
    </div>
  );
}
