"use client";

import { ExternalLink } from "lucide-react";

import {
  CustomerRecord,
  formatCustomerDate,
} from "@/features/customers/customer-types";

type CustomerGroupsPanelProps = {
  customers: CustomerRecord[];
  groupSegment: "first_visit" | "lapsing";
  segments: { firstVisitCount: number; lapsingCount: number };
  onSelectSegment: (segment: "first_visit" | "lapsing") => void;
  onOpenProfile: (id: string) => void;
  onBookCustomer: (customer: CustomerRecord) => void;
};

export function CustomerGroupsPanel({
  customers,
  groupSegment,
  segments,
  onSelectSegment,
  onOpenProfile,
  onBookCustomer,
}: CustomerGroupsPanelProps) {
  return (
    <div data-testid="customer-groups-panel" className="p-6">
      <p className="text-[13px] text-[#4b5057]">
        Bestandskundinnen zu halten ist nachhaltiger als Neukundinnen zu gewinnen. Identifizieren
        Sie mühelos wichtige Kundengruppen für Folgebuchungen.{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-[#2563eb]">
          <ExternalLink className="h-3.5 w-3.5" />
          Mehr erfahren
        </span>
      </p>

      {/* Segment Switcher Pills */}
      <div className="mt-4 inline-flex rounded-lg border border-[#d5d9e0] bg-[#f3f4f6] p-1">
        <button
          type="button"
          data-testid="segment-first-visit"
          onClick={() => onSelectSegment("first_visit")}
          className={`rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
            groupSegment === "first_visit"
              ? "bg-white text-[#1c1e21] shadow-2xs"
              : "text-[#5a6068] hover:text-[#1c1e21]"
          }`}
        >
          Erstbesuch-Follow-ups ({segments.firstVisitCount})
        </button>
        <button
          type="button"
          data-testid="segment-lapsing"
          onClick={() => onSelectSegment("lapsing")}
          className={`rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
            groupSegment === "lapsing"
              ? "bg-white text-[#1c1e21] shadow-2xs"
              : "text-[#5a6068] hover:text-[#1c1e21]"
          }`}
        >
          Ausbleibende Stammkundinnen ({segments.lapsingCount})
        </button>
      </div>

      <div className="mt-5">
        <h2 className="text-[16px] font-bold text-[#1c1e21]">
          {groupSegment === "first_visit"
            ? "Erstbesuch-Follow-ups"
            : "Ausbleibende Stammkundinnen"}
        </h2>
        <p className="mt-1 text-[13px] text-[#5a6068]">
          {groupSegment === "first_visit"
            ? "Kundinnen mit genau einem bisherigen Termin. Sorgen Sie dafür, dass sie für ihren zweiten Termin wiederkommen!"
            : "Stammkundinnen mit mehreren bisherigen Besuchen ohne zukünftige Folgebuchung."}
        </p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-[#e5e7eb]">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f9fafb] text-[11px] font-bold uppercase tracking-wider text-[#6a6f76]">
            <tr className="border-b border-[#e5e7eb]">
              <th className="px-4 py-2.5">NAME</th>
              <th className="px-4 py-2.5">E-MAIL</th>
              <th className="px-4 py-2.5">MOBIL</th>
              <th className="px-4 py-2.5">TERMINE</th>
              <th className="px-4 py-2.5">LETZTER TERMIN</th>
              <th className="px-4 py-2.5 text-right">AKTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f6]">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#6a6f76]">
                  Aktuell keine Kundinnen in diesem Segment.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-2.5 font-semibold text-[#1c1e21]">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(customer.id)}
                      className="hover:text-[#2563eb] hover:underline"
                    >
                      {customer.displayName}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[#4b5057]">{customer.email ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[#4b5057]">{customer.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[#1c1e21]">{customer.appointmentCount}</td>
                  <td className="px-4 py-2.5 text-[#5a6068]">
                    {formatCustomerDate(customer.lastAppointmentAt)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onBookCustomer(customer)}
                      className="rounded-md border border-[#cfd4dc] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#1c1e21] hover:bg-[#f3f4f6]"
                    >
                      Termin erstellen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
