"use client";

import {
  placeholderAppointments,
  placeholderStaff,
} from "@/features/fixtures/placeholder-data";
import { useSalon } from "@/features/salons/salon-context";

const slots = [
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
  "11:15",
  "11:30",
  "11:45",
  "12:00",
  "12:15",
  "12:30",
  "12:45",
  "13:00",
  "13:15",
  "13:30",
  "13:45",
  "14:00",
  "14:15",
  "14:30",
  "14:45",
  "15:00",
  "15:15",
  "15:30",
  "15:45",
  "16:00",
];

function isHourLabel(slot: string) {
  return slot.endsWith(":00");
}

export function CalendarDayGrid() {
  const { activeSalon } = useSalon();
  const staff = placeholderStaff.filter((s) => s.salonId === activeSalon.id);
  const columns = staff.length > 0 ? staff : placeholderStaff.slice(0, 3);

  return (
    <div className="overflow-x-auto" data-testid="calendar-day-grid">
      <div
        className="min-w-max grid"
        style={{
          gridTemplateColumns: `var(--cal-time-width) repeat(${columns.length}, minmax(var(--cal-staff-min), 1fr))`,
        }}
      >
        <div className="sticky left-0 z-20 border-b border-border bg-muted/70 p-2 text-[10px] text-muted-foreground" />
        {columns.map((member) => (
          <div
            key={member.id}
            className="sticky top-0 z-10 border-b border-l border-border bg-muted/50 px-2 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: member.color }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {member.role}
                </p>
              </div>
            </div>
          </div>
        ))}

        {slots.map((slot) => (
          <div key={slot} className="contents">
            <div
              className="sticky left-0 z-10 border-b border-border bg-card px-1 text-right text-[10px] tabular-nums text-muted-foreground"
              style={{ height: "var(--cal-row-height)", lineHeight: "var(--cal-row-height)" }}
            >
              {isHourLabel(slot) ? slot : ""}
            </div>
            {columns.map((member) => {
              const appt = placeholderAppointments.find(
                (item) =>
                  item.staffId === member.id && item.startLabel === slot,
              );
              const unavailable =
                member.id === "staff_mira" &&
                (slot.startsWith("12") || slot.startsWith("13"));

              return (
                <div
                  key={`${member.id}-${slot}`}
                  className={`relative border-b border-l border-border/80 ${
                    unavailable ? "unavailable-hatch" : ""
                  }`}
                  style={{ height: "var(--cal-row-height)" }}
                >
                  {appt ? (
                    <div
                      className="appointment-chip absolute inset-x-0.5 top-0 z-[1] min-h-[52px]"
                      style={{
                        backgroundColor: `${member.color}66`,
                        borderColor: member.color,
                      }}
                    >
                      <p className="font-medium text-foreground">
                        {appt.customerName}
                      </p>
                      <p className="text-foreground/70">{appt.serviceName}</p>
                      <p className="text-foreground/60">
                        {appt.startLabel}–{appt.endLabel}
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
