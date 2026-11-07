import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderNotice } from "@/components/layout/placeholder-notice";
import {
  spikeAppointments,
  spikeStaff,
} from "@/features/fixtures/spike-calendar-data";

export default function SpikeKalenderIndexPage() {
  return (
    <div data-testid="page-spike-kalender">
      <PageHeader
        title="Kalender-Spike (M03)"
        description="A/B-Vergleich mit identischen synthetischen Daten. Keine Buchungspersistenz."
      />
      <PlaceholderNotice>
        {spikeStaff.length} Mitarbeiter · {spikeAppointments.length} Termine ·
        Entscheidung: ADR-004 (noch pending Owner/iPad-Test).
      </PlaceholderNotice>
      <ul className="space-y-3 text-sm">
        <li>
          <Link className="text-primary underline" href="/spike/kalender/daypilot">
            DayPilot Lite Adapter
          </Link>
        </li>
        <li>
          <Link className="text-primary underline" href="/spike/kalender/rbc">
            React Big Calendar Adapter
          </Link>
        </li>
        <li>
          <Link className="text-primary underline" href="/spike/kalender/native">
            Native Dense Baseline
          </Link>
        </li>
      </ul>
    </div>
  );
}
