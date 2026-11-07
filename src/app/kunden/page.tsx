import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { placeholderCustomers } from "@/features/fixtures/placeholder-data";

export default function KundenPage() {
  return (
    <div data-testid="page-kunden">
      <PageHeader
        title="Kunden"
        description="Kundensuche, Profile und Historie — aktuell nur fiktive Platzhalter."
      />
      <PlaceholderNotice>
        Keine Kundendatenbank angebunden. Alle Einträge sind synthetisch.
      </PlaceholderNotice>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Letzter Besuch</th>
            </tr>
          </thead>
          <tbody>
            {placeholderCustomers.map((customer) => (
              <tr key={customer.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{customer.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.phone}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {customer.lastVisitLabel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
