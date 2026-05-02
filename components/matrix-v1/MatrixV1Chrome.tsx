"use client";

/** Shared Matrix+ Intelligence shell header + backdrop grid (`matrix-v1-shell`). Imported by `/matrix-v1` layout and the unified prototype Staff tab. */
export function MatrixV1Chrome({
  children,
  showHeader = true,
}: {
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  return (
    <div className="matrix-v1-shell">
      {showHeader ? (
        <header className="matrix-v1-header">
          <div className="matrix-v1-brand">
            <p className="matrix-v1-product">Matrix+ Intelligence</p>
            <p className="matrix-v1-tagline">Guidance &amp; Recovery Layer · V1 demo</p>
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}
