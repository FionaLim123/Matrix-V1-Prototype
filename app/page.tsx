import type { CSSProperties } from "react";
import Link from "next/link";

const DEMO_STUDENT = "drew";

export default function HomePage() {
  const studentHref = `/student?student=${DEMO_STUDENT}`;
  const staffHref = `/dashboard?student=${DEMO_STUDENT}`;

  const btnStyle: CSSProperties = {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    borderRadius: 10,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontWeight: 600,
    fontSize: "1rem",
    minWidth: "14rem",
    textAlign: "center",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        textAlign: "center",
        gap: "1.25rem",
        padding: "1rem",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Matrix+ Intelligence — Demo
      </h1>
      <p className="lead" style={{ margin: 0, maxWidth: "32rem" }}>
        This prototype captures student behaviour and turns it into clear next steps using simple
        rules — showing the foundation for a more intelligent coaching experience
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.75rem",
          marginTop: "0.5rem",
        }}
      >
        <Link href={studentHref} className="demo-home-btn" style={btnStyle}>
          Student experience
        </Link>
        <Link href={staffHref} className="demo-home-btn" style={btnStyle}>
          Staff view
        </Link>
      </div>
      <p className="muted" style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", maxWidth: "22rem" }}>
        Switch between demo students inside each view
      </p>
    </div>
  );
}
