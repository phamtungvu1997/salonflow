import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { SpikeWorkspace } from "@/features/calendar/spike-workspace";

export default function SpikeDayPilotPage() {
  return (
    <div data-testid="page-spike-daypilot">
      <PageHeader
        title="Spike: DayPilot Lite"
        description="Ressourcen-Tagesansicht mit synthetischen Daten."
      />
      <PlaceholderNotice>
        Bibliotheks-Spike — keine Server-Buchung. Lizenz/Terms vor Produktion prüfen.
      </PlaceholderNotice>
      <SpikeWorkspace kind="daypilot" />
    </div>
  );
}
