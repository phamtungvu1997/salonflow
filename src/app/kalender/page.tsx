import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { CalendarPlaceholder } from "@/features/calendar/calendar-placeholder";

export default function KalenderPage() {
  return (
    <div data-testid="page-kalender">
      <PageHeader
        title="Kalender"
        description="Dichte Tagesansicht mit Salon-Umschalter und Toolbar. Persistenz und Bibliotheks-Adapter folgen in M03–M09."
      />
      <PlaceholderNotice>
        Visuelle M02-Shell mit synthetischen Daten. Termine werden nicht gespeichert
        und stellen keine funktionierende Buchung dar.
      </PlaceholderNotice>
      <CalendarPlaceholder />
    </div>
  );
}
