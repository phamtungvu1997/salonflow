import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { APP_LOCALE, APP_TIME_ZONE } from "@/domain/locale";

const settingsGroups = [
  {
    title: "Allgemein",
    items: ["Sprache (Deutsch)", "Zeitzone Europe/Berlin", "Währung EUR"],
  },
  {
    title: "Unternehmen",
    items: ["Jeannie Nagelstudio", "Juliet – Salon de Beauté", "Heide (geplant)"],
  },
  {
    title: "Kalender",
    items: ["Slot 15 Minuten", "Wochenstart Montag", "Ansicht Tag/Woche"],
  },
  {
    title: "Kunden",
    items: ["Salonbezogene Sicht", "Walk-in ohne Telefon erlaubt", "Keine Exporte in M01"],
  },
];

export default function EinstellungenPage() {
  return (
    <div data-testid="page-einstellungen">
      <PageHeader
        title="Einstellungen"
        description="Gruppierte Salon-Einstellungen. Abrechnung, Kasse und Loyalty sind bewusst ausgeschlossen."
      />
      <PlaceholderNotice>
        Locale-Standard: {APP_LOCALE} · {APP_TIME_ZONE}. Persistente Einstellungen folgen später.
      </PlaceholderNotice>
      <div className="grid gap-4 md:grid-cols-2">
        {settingsGroups.map((group) => (
          <section
            key={group.title}
            className="rounded-xl border border-border bg-card p-5 shadow-panel"
          >
            <h2 className="font-display text-xl tracking-tight">{group.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {group.items.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-salon-sage" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
