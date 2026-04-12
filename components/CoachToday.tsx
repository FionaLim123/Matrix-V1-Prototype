import type { CoachAction } from "@/lib/coach";

type Props = {
  studentName: string;
  summaries: string[];
  actions: CoachAction[];
};

/**
 * Product-facing coaching block — no system explanation in this card.
 * Shared by staff dashboard and student view.
 */
export function CoachToday({ studentName, summaries, actions }: Props) {
  return (
    <section className="card coach-card" aria-labelledby="coach-heading">
      <h2 id="coach-heading" className="coach-summary-heading">
        Coaching Summary — {studentName}
      </h2>

      {summaries.length === 0 ? (
        <p style={{ margin: "0 0 1.25rem", color: "var(--text)" }}>No summary yet.</p>
      ) : (
        <ul className="coach-summary-list" style={{ margin: "0 0 1.35rem", paddingLeft: "1.1rem" }}>
          {summaries.map((line, i) => (
            <li key={i} style={{ marginBottom: "0.45rem" }}>
              {line}
            </li>
          ))}
        </ul>
      )}

      <h3 className="coach-today-heading">What should I do today?</h3>
      {actions.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text)" }}>Nothing scheduled for today.</p>
      ) : (
        <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
          {actions.map((a) => (
            <li key={a.dedupeKey} style={{ marginBottom: "0.75rem" }}>
              <strong>{a.title}</strong>
              <div className="muted" style={{ marginTop: "0.2rem" }}>
                {a.detail}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
