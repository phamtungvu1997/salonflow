import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { CalendarBoard } from "@/features/calendar/calendar-board";

export default function KalenderPage() {
  return (
    <div data-testid="page-kalender">
      <PageHeader
        title="Kalender"
        description="Termine werden in PostgreSQL gespeichert. Nur der eigene Salon ist sichtbar."
      />
      <PlaceholderNotice>
        Entwicklungsdaten mit synthetischen Zugängen. Keine echten Kundendaten.
      </PlaceholderNotice>
      <CalendarBoard />
    </div>
  );
}
