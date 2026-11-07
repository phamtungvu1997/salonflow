"use client";

import { useEffect, useMemo, useState } from "react";
import { DayPilot, DayPilotCalendar } from "@daypilot/daypilot-lite-react";

import type { CalendarAdapterProps } from "./types";

export function DayPilotLiteAdapter({
  date,
  staff,
  appointments,
  onSelectSlot,
  onSelectAppointment,
}: CalendarAdapterProps) {
  const [control, setControl] = useState<DayPilot.Calendar>();

  const columns = useMemo(
    () =>
      staff.map((member) => ({
        id: member.id,
        name: member.displayName,
      })),
    [staff],
  );

  const events = useMemo(
    () =>
      appointments.map((appt) => ({
        id: appt.id,
        text: `${appt.title}\n${appt.serviceName}`,
        start: new DayPilot.Date(appt.start),
        end: new DayPilot.Date(appt.end),
        resource: appt.staffId,
        backColor: staff.find((s) => s.id === appt.staffId)?.color ?? "#dbe4ee",
      })),
    [appointments, staff],
  );

  useEffect(() => {
    control?.update({ columns, events });
  }, [control, columns, events]);

  return (
    <div className="overflow-x-auto bg-card p-2" data-testid="adapter-daypilot">
      <DayPilotCalendar
        viewType="Resources"
        headerHeight={36}
        cellHeight={22}
        hourWidth={52}
        businessBeginsHour={9}
        businessEndsHour={20}
        timeRangeSelectedHandling="Enabled"
        eventMoveHandling="Update"
        eventResizeHandling="Update"
        startDate={new DayPilot.Date(date)}
        columns={columns}
        events={events}
        controlRef={setControl}
        onTimeRangeSelected={(args: {
          resource: string | number;
          start: DayPilot.Date;
          control: DayPilot.Calendar;
        }) => {
          onSelectSlot?.({
            staffId: String(args.resource),
            start: args.start.toDate(),
          });
          args.control.clearSelection();
        }}
        onEventClick={(args: { e: { id: () => string | number } }) => {
          onSelectAppointment?.(String(args.e.id()));
        }}
      />
    </div>
  );
}
