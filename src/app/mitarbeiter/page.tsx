import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import {
  placeholderSalons,
  placeholderStaff,
} from "@/features/fixtures/placeholder-data";

export default function MitarbeiterPage() {
  return (
    <div data-testid="page-mitarbeiter">
      <PageHeader
        title="Mitarbeiter"
        description="Teammitglieder und Salonzuordnung. Buchbare Ressourcen sind später von Login-Identitäten getrennt."
      />
      <PlaceholderNotice>
        Mitarbeiterverwaltung ist noch nicht an PostgreSQL angebunden.
      </PlaceholderNotice>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {placeholderStaff.map((member) => {
          const salon = placeholderSalons.find((s) => s.id === member.salonId);
          return (
            <article
              key={member.id}
              className="rounded-xl border border-border bg-card p-4 shadow-panel"
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="size-10 rounded-full"
                  style={{ backgroundColor: member.color }}
                  aria-hidden
                />
                <div>
                  <h2 className="font-medium">{member.displayName}</h2>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Salon: {salon?.name ?? "—"}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
