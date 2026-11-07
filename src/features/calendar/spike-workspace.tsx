"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  SPIKE_DAY,
  spikeAppointments,
  spikeStaff,
} from "@/features/fixtures/spike-calendar-data";

const DayPilotLiteAdapter = dynamic(
  () =>
    import("./adapter/daypilot-adapter").then((m) => m.DayPilotLiteAdapter),
  { ssr: false, loading: () => <p className="p-4 text-sm">Lade DayPilot…</p> },
);

const ReactBigCalendarAdapter = dynamic(
  () => import("./adapter/rbc-adapter").then((m) => m.ReactBigCalendarAdapter),
  { ssr: false, loading: () => <p className="p-4 text-sm">Lade RBC…</p> },
);

const NativeDenseAdapter = dynamic(
  () =>
    import("./adapter/native-dense-adapter").then((m) => m.NativeDenseAdapter),
  { ssr: false },
);

type SpikeKind = "daypilot" | "rbc" | "native";

export function SpikeWorkspace({ kind }: { kind: SpikeKind }) {
  const [lastAction, setLastAction] = useState("Noch keine Interaktion");

  const shared = {
    date: SPIKE_DAY,
    staff: spikeStaff,
    appointments: spikeAppointments,
    onSelectSlot: ({ staffId, start }: { staffId: string; start: Date }) => {
      setLastAction(
        `Slot: ${staffId} @ ${start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} (nur UI)`,
      );
    },
    onSelectAppointment: (id: string) => {
      setLastAction(`Termin gewählt: ${id} (nur UI — keine Persistenz)`);
    },
  };

  return (
    <div className="space-y-3">
      <p
        className="rounded-md border border-dashed border-salon-sand/80 bg-salon-sand/10 px-3 py-2 text-sm"
        data-testid="spike-last-action"
      >
        {lastAction}
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
        {kind === "daypilot" ? <DayPilotLiteAdapter {...shared} /> : null}
        {kind === "rbc" ? <ReactBigCalendarAdapter {...shared} /> : null}
        {kind === "native" ? <NativeDenseAdapter {...shared} /> : null}
      </div>
    </div>
  );
}
