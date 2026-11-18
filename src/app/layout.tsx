import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";

import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('salonflow-theme')==='dim')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className={instrument.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
