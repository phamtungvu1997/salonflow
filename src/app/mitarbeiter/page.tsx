import { PageHeader } from "@/components/layout/page-header";
import { StaffAdmin } from "@/features/staff/staff-admin";

export default function MitarbeiterPage() {
  return (
    <div data-testid="page-mitarbeiter">
      <PageHeader
        title="Mitarbeiter"
        description="Anlegen, dem aktuellen Salon zuordnen und Arbeitszeiten setzen."
      />
      <StaffAdmin />
    </div>
  );
}
