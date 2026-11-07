import { PageHeader } from "@/components/layout/page-header";
import { ServiceAdmin } from "@/features/services/service-admin";

export default function LeistungenPage() {
  return (
    <div data-testid="page-leistungen">
      <PageHeader
        title="Leistungen"
        description="Dauer, Preis und qualifizierte Mitarbeiter für den aktuellen Salon."
      />
      <ServiceAdmin />
    </div>
  );
}
