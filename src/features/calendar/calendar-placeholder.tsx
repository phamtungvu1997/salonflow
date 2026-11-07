import { formatGermanDate } from "@/domain/locale";
import {
  placeholderAppointments,
  placeholderStaff,
} from "@/features/fixtures/placeholder-data";

const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

export function CalendarPlaceholder() {
  const todayLabel = formatGermanDate(new Date("2026-11-07T12:00:00+01:00"));
  const staff = placeholderStaff.filter((s) => s.salonId === "salon_jeannie");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Datum</p>
          <p className="font-medium">{todayLabel}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium">
            Tag
          </span>
          <span className="rounded-md px-3 py-1.5 text-xs text-muted-foreground">
            Woche
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="min-w-[720px] grid"
          style={{ gridTemplateColumns: `64px repeat(${staff.length}, minmax(160px, 1fr))` }}
        >
          <div className="border-b border-border bg-muted/40 p-2 text-xs text-muted-foreground" />
          {staff.map((member) => (
            <div
              key={member.id}
              className="border-b border-l border-border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: member.color }}
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium">{member.displayName}</p>
                  <p className="text-[11px] text-muted-foreground">{member.role}</p>
                </div>
              </div>
            </div>
          ))}

          {hours.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-b border-border px-2 py-6 text-right text-xs text-muted-foreground">
                {hour}
              </div>
              {staff.map((member) => {
                const appt = placeholderAppointments.find(
                  (item) => item.staffId === member.id && item.startLabel === hour,
                );
                return (
                  <div
                    key={`${member.id}-${hour}`}
                    className="relative min-h-20 border-b border-l border-border bg-[linear-gradient(180deg,transparent_0,transparent_49%,rgba(148,163,184,0.18)_50%,transparent_51%)] p-1.5"
                  >
                    {appt ? (
                      <div
                        className="appointment-chip h-full"
                        style={{
                          backgroundColor: `${member.color}55`,
                          borderColor: member.color,
                        }}
                      >
                        <p className="font-medium text-foreground">
                          {appt.customerName}
                        </p>
                        <p className="text-foreground/70">{appt.serviceName}</p>
                        <p className="mt-1 text-foreground/60">
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
    </div>
  );
}
