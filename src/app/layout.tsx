import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";

import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Salonflow — Internes Terminbuch",
  description:
    "Internes Buchungssystem für Jeannie, Juliet und Heide. M01 UI-Grundlage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${sourceSans.variable} ${fraunces.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
