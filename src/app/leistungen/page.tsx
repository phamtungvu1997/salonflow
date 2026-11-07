import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { formatEuro } from "@/domain/locale";
import { placeholderServices } from "@/features/fixtures/placeholder-data";

export default function LeistungenPage() {
  return (
    <div data-testid="page-leistungen">
      <PageHeader
        title="Leistungen"
        description="Kategorien, Dauer und Preise. Historische Buchungen werden später Snapshots behalten."
      />
      <PlaceholderNotice>
        Preisanzeigen sind informativ und stellen keine Zahlung oder Kasse dar.
      </PlaceholderNotice>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-panel">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Leistung</th>
              <th className="px-4 py-3 font-medium">Kategorie</th>
              <th className="px-4 py-3 font-medium">Dauer</th>
              <th className="px-4 py-3 font-medium">Preis</th>
            </tr>
          </thead>
          <tbody>
            {placeholderServices.map((service) => (
              <tr key={service.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{service.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {service.category}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {service.durationMinutes} Min.
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatEuro(service.priceCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
