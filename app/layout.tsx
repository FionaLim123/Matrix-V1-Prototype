import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning spine demo — staff dashboard",
  description: "Internal demo: student progress, events, and rule-based recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
