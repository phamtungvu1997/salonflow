"use client";

import type { CalendarAdapterProps } from "./types";

/** Baseline dense grid used for comparison when libraries struggle with 20 resources. */
export function NativeDenseAdapter({
  staff,
  appointments,
  onSelectSlot,
  onSelectAppointment,
}: CalendarAdapterProps) {
  const hours = Array.from({ length: 11 }, (_, i) => 9 + i);

  return (
    <div className="overflow-x-auto" data-testid="adapter-native">
      <div
        className="min-w-max grid"
        style={{
          gridTemplateColumns: `56px repeat(${staff.length}, minmax(145px, 1fr))`,
        }}
      >
        <div className="border-b bg-muted/50 p-2" />
        {staff.map((member) => (
          <div
            key={member.id}
            className="border-b border-l bg-muted/40 px-2 py-2 text-xs font-medium"
          >
            <span
              className="mr-1 inline-block size-2 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            {member.displayName}
          </div>
        ))}
        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div className="border-b px-1 py-6 text-right text-[10px] text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </div>
            {staff.map((member) => {
              const cellAppts = appointments.filter(
                (a) =>
                  a.staffId === member.id && a.start.getHours() === hour,
              );
              return (
                <button
                  type="button"
                  key={`${member.id}-${hour}`}
                  className="relative min-h-16 border-b border-l p-0.5 text-left"
                  onClick={() =>
                    onSelectSlot?.({
                      staffId: member.id,
                      start: new Date(2026, 10, 7, hour, 0),
                    })
                  }
                >
                  {cellAppts.map((appt) => (
                    <button
                      type="button"
                      key={appt.id}
                      className="appointment-chip mb-0.5 block w-full"
                      style={{ backgroundColor: `${member.color}66` }}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectAppointment?.(appt.id);
                      }}
                    >
                      {appt.title}
                      <span className="block text-[10px] opacity-70">
                        {appt.serviceName}
                      </span>
                    </button>
                  ))}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
