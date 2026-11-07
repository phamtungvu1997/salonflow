import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { SpikeWorkspace } from "@/features/calendar/spike-workspace";

export default function SpikeNativePage() {
  return (
    <div data-testid="page-spike-native">
      <PageHeader
        title="Spike: Native Dense Baseline"
        description="Eigene CSS-Grid-Baseline als Fallback-Maßstab."
      />
      <PlaceholderNotice>
        Keine Drittanbieter-Kalenderbibliothek. Dient dem Scorecard-Vergleich.
      </PlaceholderNotice>
      <SpikeWorkspace kind="native" />
    </div>
  );
}
