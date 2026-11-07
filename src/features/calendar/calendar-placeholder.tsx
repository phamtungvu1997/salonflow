"use client";

import { useState } from "react";

import { CalendarDayGrid } from "./calendar-day-grid";
import { CalendarToolbar } from "./calendar-toolbar";

export function CalendarPlaceholder() {
  const [view, setView] = useState<"day" | "week">("day");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
      <CalendarToolbar view={view} onViewChange={setView} />
      {view === "day" ? (
        <CalendarDayGrid />
      ) : (
        <div className="px-4 py-10 text-sm text-muted-foreground" data-testid="calendar-week-placeholder">
          Wochenansicht (ein Mitarbeiter, sieben Tage) folgt mit dem
          Kalender-Adapter in M03 — aktuell nur Umschalter-Mock.
        </div>
      )}
    </div>
  );
}
