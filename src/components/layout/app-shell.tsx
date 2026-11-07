"use client";

import { useState } from "react";

import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_#e7eee9_0%,_transparent_36%),radial-gradient(circle_at_bottom_left,_#ebe4dc_0%,_transparent_40%),var(--background)]">
      <div className="sticky top-0 h-screen shrink-0">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border/80 bg-card/70 px-4 backdrop-blur md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Internes Terminbuch
            </p>
            <p className="text-sm font-medium text-foreground">
              Salon: Jeannie Nagelstudio
            </p>
          </div>
          <div className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            M01 · UI-Grundlage
          </div>
        </header>
        <main className="flex-1 animate-fade-up p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
