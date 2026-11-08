"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  onToggle: () => void;
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "relative flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out",
          collapsed ? "w-[72px]" : "w-[200px]",
        )}
        data-testid="app-sidebar"
        data-collapsed={collapsed}
      >
        <div
          className={cn(
            "flex flex-col gap-2 px-4 py-4",
            collapsed && "items-center px-2",
          )}
        >
          <SalonflowLogo
            variant={collapsed ? "sidebar-collapsed" : "sidebar-expanded"}
            priority
            className={cn(!collapsed && "animate-sidebar-slide")}
          />
          {!collapsed && (
            <p className="truncate text-xs text-sidebar-foreground/60 animate-sidebar-slide">
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
                className={cn(collapsed && "justify-center px-0")}
              >
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`nav-${item.href.replace("/", "")}`}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </Button>
            );

            if (!collapsed) {
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
          {!collapsed && (
            <div className="mb-3 rounded-lg bg-sidebar-accent/70 px-3 py-3 text-xs text-sidebar-foreground/70 animate-sidebar-slide">
              Entwicklungsdaten. Termine werden in PostgreSQL gespeichert.
            </div>
          )}
          <Button
            type="button"
            variant="sidebar"
            size={collapsed ? "icon" : "sidebar-item"}
            className={cn("w-full", collapsed && "mx-auto")}
            onClick={onToggle}
            aria-label={collapsed ? "Seitenleiste erweitern" : "Seitenleiste einklappen"}
            data-testid="sidebar-toggle"
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
            {!collapsed && <span>Einklappen</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
