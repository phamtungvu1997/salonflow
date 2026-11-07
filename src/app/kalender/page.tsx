import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { CalendarPlaceholder } from "@/features/calendar/calendar-placeholder";

export default function KalenderPage() {
  return (
    <div data-testid="page-kalender">
      <PageHeader
        title="Kalender"
        description="Multi-Mitarbeiter-Tagesansicht mit synthetischen Beispieldaten. Drag & Persistenz folgen in späteren Meilensteinen."
      />
      <PlaceholderNotice>
        Dies ist eine visuelle Platzhalteransicht. Termine werden nicht gespeichert
        und stellen keine funktionierende Buchung dar.
      </PlaceholderNotice>
      <CalendarPlaceholder />
    </div>
  );
}
