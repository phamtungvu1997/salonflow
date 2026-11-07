"use client";

import { useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type EventProps,
} from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import type { CalendarAdapterProps, CalendarAppointmentView } from "./types";

const locales = { de };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

type RbcEvent = CalendarAppointmentView & {
  resourceId: string;
};

function EventCard({ event }: EventProps<RbcEvent>) {
  return (
    <div className="text-[11px] leading-tight">
      <div className="font-medium">{event.title}</div>
      <div className="opacity-80">{event.serviceName}</div>
    </div>
  );
}

export function ReactBigCalendarAdapter({
  date,
  staff,
  appointments,
  onSelectSlot,
  onSelectAppointment,
}: CalendarAdapterProps) {
  const resources = useMemo(
    () => staff.map((s) => ({ resourceId: s.id, resourceTitle: s.displayName })),
    [staff],
  );

  const events: RbcEvent[] = useMemo(
    () =>
      appointments.map((appt) => ({
        ...appt,
        resourceId: appt.staffId,
      })),
    [appointments],
  );

  return (
    <div className="h-[720px] bg-card p-2" data-testid="adapter-rbc">
      <Calendar
        culture="de"
        localizer={localizer}
        date={date}
        events={events}
        resources={resources}
        resourceIdAccessor="resourceId"
        resourceTitleAccessor="resourceTitle"
        defaultView={Views.DAY}
        views={[Views.DAY, Views.WEEK]}
        step={15}
        timeslots={4}
        min={new Date(2026, 10, 7, 9, 0)}
        max={new Date(2026, 10, 7, 20, 0)}
        selectable
        onSelectSlot={(slot) => {
          const resourceId =
            typeof slot.resourceId === "string"
              ? slot.resourceId
              : staff[0]?.id;
          if (resourceId && slot.start) {
            onSelectSlot?.({ staffId: resourceId, start: slot.start });
          }
        }}
        onSelectEvent={(event) => onSelectAppointment?.(event.id)}
        components={{ event: EventCard }}
        messages={{
          today: "Heute",
          previous: "Zurück",
          next: "Weiter",
          day: "Tag",
          week: "Woche",
          agenda: "Agenda",
          date: "Datum",
          time: "Zeit",
          event: "Termin",
          noEventsInRange: "Keine Termine",
        }}
      />
    </div>
  );
}
