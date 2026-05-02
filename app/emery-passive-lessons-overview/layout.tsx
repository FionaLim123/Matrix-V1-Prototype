import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Emery — Passive — Lessons overview (prototype)",
  description: "Matrix+ UI prototype · step 1",
};

export default function EmeryPassiveLessonsOverviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`mp-emery-prototype-shell ${inter.variable} ${inter.className}`}>{children}</div>
  );
}
