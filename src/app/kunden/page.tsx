import { PageHeader } from "@/components/layout/page-header";
import { CustomerAdmin } from "@/features/customers/customer-admin";

export default function KundenPage() {
  return (
    <div data-testid="page-kunden">
      <PageHeader
        title="Kunden"
        description="Kundinnen werden salonbezogen gespeichert."
      />
      <CustomerAdmin />
    </div>
  );
}
