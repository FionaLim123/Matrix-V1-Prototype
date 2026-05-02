"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Preserves ?key=&student= when navigating inside Matrix+ V1. */
export function MatrixV1Nav() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const student = searchParams.get("student");
  const qs = new URLSearchParams();
  if (key) qs.set("key", key);
  if (student) qs.set("student", student);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const linkStyle = { fontWeight: 600 as const, fontSize: "0.82rem" };

  const Item = ({ href, label }: { href: string; label: string }) => (
    <Link href={`${href}${suffix}`} style={linkStyle}>
      {label}
    </Link>
  );

  return (
    <nav className="matrix-v1-nav" aria-label="Matrix+ demo">
      <Item href="/matrix-v1" label="Overview" />
      <span className="matrix-v1-nav-sep" aria-hidden>
        ·
      </span>
      <Item href="/matrix-v1/staff" label="Staff" />
      <span className="matrix-v1-nav-sep" aria-hidden>
        ·
      </span>
      <Item href="/matrix-v1/student" label="Student" />
      <span className="matrix-v1-nav-sep" aria-hidden>
        ·
      </span>
      <Item href="/matrix-v1/lesson" label="Lesson" />
      <span className="matrix-v1-nav-sep" aria-hidden>
        ·
      </span>
      <Item href="/matrix-v1/result" label="Result" />
      <span className="matrix-v1-nav-sep" aria-hidden>
        ·
      </span>
      <Item href="/matrix-v1/reentry" label="Re-entry" />
    </nav>
  );
}
