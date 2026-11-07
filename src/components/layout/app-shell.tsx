"use client";

import { useState } from "react";

import { SalonProvider, useSalon } from "@/features/salons/salon-context";

import { AppSidebar } from "./app-sidebar";
import { SalonSelector } from "./salon-selector";

type AppShellProps = {
  children: React.ReactNode;
};

function AppShellInner({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
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
        <header className="flex h-[58px] flex-wrap items-center justify-between gap-3 border-b border-border/80 bg-card/85 px-4 backdrop-blur md:px-5">
          <div className="flex flex-wrap items-end gap-4">
            <SalonSelector />
            <div className="hidden sm:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Internes Terminbuch
              </p>
              <p className="text-sm text-foreground/80">{activeSalon.city}</p>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            M02 · Design-Shell
          </div>
        </header>
        <main className="flex-1 animate-fade-up p-3 md:p-4">{children}</main>
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
