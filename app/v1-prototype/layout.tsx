import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Matrix+ Intelligence",
  description: "Matrix+ Guidance & Recovery Layer — student coaching and staff intervention demo.",
};

export default function V1PrototypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`mp-emery-prototype-shell ${inter.variable} ${inter.className}`}>{children}</div>
  );
}
