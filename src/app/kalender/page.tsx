import { CalendarBoard } from "@/features/calendar/calendar-board";
import { initialCalendarDate } from "@/features/calendar/calendar-date";

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ datum?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.datum) ? params.datum[0] : params.datum;
  return (
    <div data-testid="page-kalender" className="flex min-h-0 flex-1 flex-col">
      <CalendarBoard initialDate={initialCalendarDate(raw)} />
    </div>
  );
}
