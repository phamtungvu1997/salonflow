"use client";

import { Moon, Search, Sun } from "lucide-react";
import { useState } from "react";

import { SalonProvider, useSalon } from "@/features/salons/salon-context";
import { cn } from "@/lib/utils";

import { AppSidebar } from "./app-sidebar";
import { SalonSelector } from "./salon-selector";

type AppShellProps = {
  children: React.ReactNode;
};

function AppShellInner({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [themeTone, setThemeTone] = useState<"light" | "dim">("light");
  const { activeSalon } = useSalon();

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_#f0e6e9_0%,_transparent_34%),radial-gradient(circle_at_bottom_left,_#e7eee9_0%,_transparent_42%),var(--background)]">
      <div className="sticky top-0 h-screen shrink-0">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-4 backdrop-blur md:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <SalonSelector />
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Internes Terminbuch
              </p>
              <p className="text-xs text-foreground/80">{activeSalon?.city ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/kunden"
              aria-label="Schnellsuche"
              title="Kunden suchen"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#eef0f3] hover:text-[#1c1e21]"
            >
              <Search className="h-4 w-4" />
            </a>
            <div
              className="inline-flex h-8 items-center rounded-lg border border-[#e1e4ea] bg-[#f4f5f7] p-0.5"
              role="group"
              aria-label="Darstellung"
            >
              <button
                type="button"
                aria-label="Helle Darstellung"
                onClick={() => setThemeTone("light")}
                className={cn(
                  "flex h-6 w-7 items-center justify-center rounded-md text-[#6d7480]",
                  themeTone === "light" && "bg-white text-[#1c1e21] shadow-xs",
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Gedämpfte Darstellung"
                onClick={() => setThemeTone("dim")}
                className={cn(
                  "flex h-6 w-7 items-center justify-center rounded-md text-[#6d7480]",
                  themeTone === "dim" && "bg-white text-[#1c1e21] shadow-xs",
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
            <a
              href="/anmelden"
              className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Anmelden
            </a>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111827] text-xs font-semibold text-white"
              title="Angemeldet"
            >
              Vu
            </span>
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col animate-fade-up p-3 md:p-4">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <SalonProvider>
      <AppShellInner>{children}</AppShellInner>
    </SalonProvider>
  );
}
