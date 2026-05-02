import type { DbEvent, DbProgress } from "@/lib/recommendations";

function timeMs(v: unknown): number {
  if (v == null) return NaN;
  const t = new Date(String(v)).getTime();
  return Number.isNaN(t) ? NaN : t;
}

/**
 * The latest timestamp across all loaded events and progress rows.
 * When used as the coach’s “now”, a 7-day inactivity check stays correct even if seed
 * data is weeks old in wall-clock time.
 */
export function datasetActivityAnchor(events: DbEvent[], progress: DbProgress[]): Date {
  const times: number[] = [];
  for (const e of events) {
    const t = timeMs(e.created_at);
    if (t > 0) times.push(t);
  }
  for (const p of progress) {
    const t = timeMs(p.updated_at);
    if (t > 0) times.push(t);
  }
  if (times.length === 0) return new Date();
  return new Date(Math.max(...times));
}

/**
 * "Now" for 7-day inactive rules. Default: anchor to the dataset (good for long-lived demo seed).
 * Set `COACH_TIME_ANCHOR=wall` in .env to use the real current date (production-style).
 */
export function referenceNowForCoachingRules(events: DbEvent[], progress: DbProgress[]): Date {
  if (process.env.COACH_TIME_ANCHOR === "wall") {
    return new Date();
  }
  return datasetActivityAnchor(events, progress);
}
