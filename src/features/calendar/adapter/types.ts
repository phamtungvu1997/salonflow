/** Replaceable calendar UI contract — libraries must not own booking rules. */

export type CalendarStaffColumn = {
  id: string;
  displayName: string;
  color: string;
};

export type CalendarAppointmentView = {
  id: string;
  staffId: string;
  title: string;
  serviceName: string;
  start: Date;
  end: Date;
};

export type CalendarAdapterProps = {
  date: Date;
  staff: CalendarStaffColumn[];
  appointments: CalendarAppointmentView[];
  onSelectSlot?: (input: { staffId: string; start: Date }) => void;
  onSelectAppointment?: (id: string) => void;
};

export type CalendarAdapterComponent = (
  props: CalendarAdapterProps,
) => React.ReactNode;
