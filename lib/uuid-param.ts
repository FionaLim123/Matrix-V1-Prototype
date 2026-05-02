/** Hex-with-dashes check for demo roster ids in query strings (seed UUIDs are not RFC-strict). */
export function isUuidParam(s: string | undefined | null): s is string {
  if (s == null) return false;
  const t = s.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t);
}
