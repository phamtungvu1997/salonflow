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
  title: "SalonFlow — Internes Terminbuch",
  description:
    "Internes Buchungssystem für Jeannie, Juliet und Heide. M01 UI-Grundlage.",
  applicationName: "SalonFlow",
  icons: {
    icon: [
      { url: "/branding/salonflow-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/salonflow-favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/branding/salonflow-apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/branding/salonflow-favicon.png"],
  },
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
