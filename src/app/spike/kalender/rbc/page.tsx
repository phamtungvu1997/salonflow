import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import { SpikeWorkspace } from "@/features/calendar/spike-workspace";

export default function SpikeRbcPage() {
  return (
    <div data-testid="page-spike-rbc">
      <PageHeader
        title="Spike: React Big Calendar"
        description="Resource day view mit denselben 20×250 Fixtures."
      />
      <PlaceholderNotice>
        Bibliotheks-Spike — keine Server-Buchung. Touch/Drag auf iPad separat bewerten.
      </PlaceholderNotice>
      <SpikeWorkspace kind="rbc" />
    </div>
  );
}
