"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SalonflowLogo } from "@/components/brand/salonflow-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { primaryNav } from "./nav-items";

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
};

export function AppSidebar({ collapsed, mobileOpen, onToggle, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const iconOnly = collapsed && !narrow;

  return (
    <TooltipProvider delayDuration={80}>
      <aside
        className={cn(
          "relative z-40 flex h-full w-[200px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-150 ease-out",
          "max-md:fixed max-md:inset-y-0 max-md:left-0",
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          "md:translate-x-0",
          collapsed ? "md:w-[72px]" : "md:w-[200px]",
        )}
        data-testid="app-sidebar"
        data-collapsed={collapsed}
      >
        <div
          className={cn(
            "flex flex-col gap-2 px-4 py-4",
            iconOnly && "items-center px-2",
          )}
        >
          <SalonflowLogo
            variant={iconOnly ? "sidebar-collapsed" : "sidebar-expanded"}
            priority
            className={cn(!iconOnly && "overflow-hidden")}
          />
          {!iconOnly && (
            <p className="truncate text-xs text-sidebar-foreground/60">
              Jeannie · Juliet
            </p>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Hauptnavigation">
          {primaryNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const link = (
              <Button
                key={item.href}
                asChild
                variant={active ? "sidebar-active" : "sidebar"}
                size="sidebar-item"
                className={cn(iconOnly && "justify-center px-0")}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${item.href.replace("/", "")}`}
                  onClick={onNavigate}
                >
                  <Icon className="size-4 shrink-0" />
                  {!iconOnly && <span>{item.label}</span>}
                </Link>
              </Button>
            );

            if (!iconOnly) {
              return link;
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="p-3">
          {!iconOnly && (
            <div className="mb-3 rounded-lg bg-sidebar-accent/70 px-3 py-3 text-xs text-sidebar-foreground/70">
              Entwicklungsdaten. Termine werden in PostgreSQL gespeichert.
            </div>
          )}
          <Button
            type="button"
            variant="sidebar"
            size={iconOnly ? "icon" : "sidebar-item"}
            className={cn("hidden w-full md:inline-flex", iconOnly && "mx-auto")}
            onClick={onToggle}
            aria-label={iconOnly ? "Seitenleiste erweitern" : "Seitenleiste einklappen"}
            data-testid="sidebar-toggle"
          >
            {iconOnly ? <ChevronRight /> : <ChevronLeft />}
            {!iconOnly && <span>Einklappen</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
