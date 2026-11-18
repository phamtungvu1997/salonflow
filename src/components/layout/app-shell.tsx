"use client";

import { Menu, Moon, Search, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { CommandPalette } from "@/features/search/command-palette";
import { SalonProvider, useSalon } from "@/features/salons/salon-context";
import { cn } from "@/lib/utils";

import { AppSidebar } from "./app-sidebar";
import { SalonSelector } from "./salon-selector";

type AppShellProps = {
  children: React.ReactNode;
};

function isPublicBookingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/b" ||
    pathname.startsWith("/b/") ||
    pathname === "/embed" ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/widget/")
  );
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [themeTone, setThemeTone] = useState<"light" | "dim">("light");
  const { activeSalon } = useSalon();

  useEffect(() => {
    const saved = window.localStorage.getItem("salonflow-theme");
    if (saved === "dim" || saved === "light") setThemeTone(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeTone === "dim");
    window.localStorage.setItem("salonflow-theme", themeTone);
  }, [themeTone]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      } else if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-background">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Menü schließen"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <div className="sticky top-0 z-40 h-screen w-0 shrink-0 md:w-auto">
        <AppSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed((value) => !value)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 md:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-foreground md:hidden"
              aria-label="Menü öffnen"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <SalonSelector />
            <div className="hidden min-w-0 lg:block">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Internes Terminbuch
              </p>
              <p className="truncate text-xs text-foreground/80">{activeSalon?.city ?? "—"}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Schnellsuche"
              title="Kunden, Seiten und Einstellungen suchen"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6d7480] hover:bg-[#eef0f3] hover:text-[#1c1e21]"
              data-testid="open-search"
            >
              <Search className="h-4 w-4" />
            </button>
            <div
              className="inline-flex h-8 items-center rounded-lg border border-border bg-muted p-0.5"
              role="group"
              aria-label="Darstellung"
            >
              <button
                type="button"
                aria-label="Helle Darstellung"
                aria-pressed={themeTone === "light"}
                onClick={() => setThemeTone("light")}
                className={cn(
                  "flex h-6 w-7 items-center justify-center rounded-md text-muted-foreground",
                  themeTone === "light" && "bg-card text-foreground shadow-xs",
                )}
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Dunkle Darstellung"
                aria-pressed={themeTone === "dim"}
                onClick={() => setThemeTone("dim")}
                className={cn(
                  "flex h-6 w-7 items-center justify-center rounded-md text-muted-foreground",
                  themeTone === "dim" && "bg-card text-foreground shadow-xs",
                )}
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
            <a
              href="/anmelden"
              aria-label="Anmelden"
              className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="hidden sm:inline">Anmelden</span>
              <span className="sm:hidden">Login</span>
            </a>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground"
              title="Angemeldet"
            >
              Vu
            </span>
          </div>
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto p-3 md:p-4">
          <div key={pathname} className="page-enter flex min-h-0 flex-1 flex-col">
            {children}
          </div>
        </main>
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  if (isPublicBookingPath(pathname)) {
    return <>{children}</>;
  }
  return (
    <SalonProvider>
      <AppShellInner>{children}</AppShellInner>
    </SalonProvider>
  );
}
