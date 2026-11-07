"use client";

import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatGermanDate } from "@/domain/locale";

type CalendarToolbarProps = {
  view: "day" | "week";
  onViewChange: (view: "day" | "week") => void;
};

export function CalendarToolbar({ view, onViewChange }: CalendarToolbarProps) {
  const todayLabel = formatGermanDate(new Date("2026-11-07T12:00:00+01:00"));

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2"
      data-testid="calendar-toolbar"
    >
      <Button type="button" variant="outline" size="sm">
        Heute
      </Button>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Vorheriger Tag">
          <ChevronLeft />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Nächster Tag">
          <ChevronRight />
        </Button>
      </div>
      <p className="px-2 text-sm font-semibold tabular-nums">{todayLabel}</p>

      <div className="ml-1 flex rounded-md border border-border p-0.5">
        <Button
          type="button"
          size="sm"
          variant={view === "day" ? "secondary" : "ghost"}
          onClick={() => onViewChange("day")}
        >
          Tag
        </Button>
        <Button
          type="button"
          size="sm"
          variant={view === "week" ? "secondary" : "ghost"}
          onClick={() => onViewChange("week")}
        >
          Woche
        </Button>
      </div>

      <div className="relative ml-auto min-w-[180px] flex-1 max-w-xs">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm"
          placeholder="Kunde suchen…"
          aria-label="Kunde suchen"
        />
      </div>

      <Button type="button" size="sm" className="gap-1">
        <Plus className="size-4" />
        Termin
      </Button>
    </div>
  );
}
