"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { formatPrice } from "@/features/calendar/calendar-date";

import { ListboxField } from "./listbox-field";
import type { ModalService, ModalStaff } from "./types";

export type ServiceLine = {
  key: string;
  serviceId: string;
  staffId: string;
  durationMinutes: number;
};

const durationOptions = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 105, 120].map(
  (mins) => ({
    id: String(mins),
    label: `${mins} Min.`,
  }),
);

export function AppointmentServiceRow({
  services,
  staff,
  serviceId,
  staffId,
  durationMinutes,
  extraLines,
  openList,
  onOpenList,
  onService,
  onDuration,
  onStaff,
  onAddServiceLine,
  onUpdateExtraLine,
  onRemoveExtraLine,
}: {
  services: ModalService[];
  staff: ModalStaff[];
  serviceId: string;
  staffId: string;
  durationMinutes: number;
  extraLines: ServiceLine[];
  openList: string | null;
  onOpenList: (list: string | null) => void;
  onService: (id: string) => void;
  onDuration: (minutes: number) => void;
  onStaff: (id: string) => void;
  onAddServiceLine: () => void;
  onUpdateExtraLine: (key: string, patch: Partial<ServiceLine>) => void;
  onRemoveExtraLine: (key: string) => void;
}) {
  const service = services.find((item) => item.id === serviceId);
  const eligible = service ? staff.filter((member) => service.staffIds.includes(member.id)) : staff;
  const shownDuration = durationMinutes || service?.durationMinutes || 0;
  const [extraOpenKey, setExtraOpenKey] = useState<string | null>(null);

  const serviceOptions = services.map((item) => ({
    id: item.id,
    label: item.name,
    hint: `${item.durationMinutes} Min.`,
    secondaryHint: formatPrice(item.priceCents),
    groupLabel: item.categoryName ?? undefined,
    groupColor: item.categoryColor ?? undefined,
  }));

  return (
    <section className="rounded-[10px] border border-[#e6e8ee] bg-white p-4">
      <h3 className="text-[15px] font-semibold text-[#1c1e21]">Leistungen</h3>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[900px]:grid-cols-[minmax(0,1.4fr)_104px_minmax(0,1fr)]">
        <ListboxField
          label="Leistung"
          required
          placeholder="Auswählen"
          valueLabel={service?.name}
          options={serviceOptions}
          open={openList === "service"}
          onOpenChange={(open) => onOpenList(open ? "service" : null)}
          onSelect={onService}
          testId="booking-service"
          searchable
        />
        <div>
          <ListboxField
            label="Dauer"
            placeholder="—"
            valueLabel={shownDuration ? `${shownDuration} Min.` : undefined}
            options={durationOptions}
            open={openList === "duration"}
            onOpenChange={(open) => onOpenList(open ? "duration" : null)}
            onSelect={(val) => onDuration(Number(val))}
            testId="booking-duration-select"
          />
          <input
            type="hidden"
            readOnly
            value={shownDuration ? `${shownDuration} Min.` : ""}
            data-testid="booking-duration"
          />
        </div>
        <ListboxField
          label="Mitarbeiter"
          required
          placeholder="Auswählen"
          valueLabel={eligible.find((member) => member.id === staffId)?.displayName}
          options={eligible.map((member) => ({ id: member.id, label: member.displayName }))}
          open={openList === "employee"}
          onOpenChange={(open) => onOpenList(open ? "employee" : null)}
          onSelect={onStaff}
          testId="booking-employee"
          searchable
        />
      </div>

      {extraLines.map((line, index) => {
        const lineService = services.find((item) => item.id === line.serviceId);
        const lineEligible = lineService
          ? staff.filter((member) => lineService.staffIds.includes(member.id))
          : staff;
        return (
          <div
            key={line.key}
            data-testid={`extra-service-row-${index}`}
            className="mt-2 grid grid-cols-1 items-end gap-2 border-t border-[#f0f2f5] pt-2 min-[900px]:grid-cols-[minmax(0,1.4fr)_104px_minmax(0,1fr)_32px]"
          >
            <ListboxField
              label="Weitere Leistung"
              placeholder="Auswählen"
              valueLabel={lineService?.name}
              options={serviceOptions}
              open={extraOpenKey === `${line.key}-service`}
              onOpenChange={(open) => setExtraOpenKey(open ? `${line.key}-service` : null)}
              onSelect={(id) => {
                const picked = services.find((item) => item.id === id);
                onUpdateExtraLine(line.key, {
                  serviceId: id,
                  durationMinutes: picked?.durationMinutes ?? line.durationMinutes,
                });
              }}
              testId={`booking-extra-service-${index}`}
              searchable
            />
            <ListboxField
              label="Dauer"
              placeholder="—"
              valueLabel={`${line.durationMinutes} Min.`}
              options={durationOptions}
              open={extraOpenKey === `${line.key}-duration`}
              onOpenChange={(open) => setExtraOpenKey(open ? `${line.key}-duration` : null)}
              onSelect={(val) => onUpdateExtraLine(line.key, { durationMinutes: Number(val) })}
              testId={`booking-extra-duration-${index}`}
            />
            <ListboxField
              label="Mitarbeiter"
              placeholder="Auswählen"
              valueLabel={lineEligible.find((member) => member.id === line.staffId)?.displayName}
              options={lineEligible.map((member) => ({ id: member.id, label: member.displayName }))}
              open={extraOpenKey === `${line.key}-staff`}
              onOpenChange={(open) => setExtraOpenKey(open ? `${line.key}-staff` : null)}
              onSelect={(id) => onUpdateExtraLine(line.key, { staffId: id })}
              testId={`booking-extra-employee-${index}`}
              searchable
            />
            <button
              type="button"
              aria-label="Weitere Leistung entfernen"
              onClick={() => onRemoveExtraLine(line.key)}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-[#8b919a] hover:bg-[#f4f5f7] hover:text-[#b42318]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.04em] text-[#8b919a]">
        Häufig gebucht
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {services.slice(0, 4).map((item) => (
          <button
            key={item.id}
            type="button"
            className="inline-flex h-7 max-w-full items-center rounded-full bg-accent px-2.5 text-xs text-accent-foreground hover:bg-[#edd3db] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)]"
            onClick={() => onService(item.id)}
          >
            <span className="truncate">+ {item.name}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        data-testid="booking-add-service"
        className="mt-3 text-sm font-medium text-[var(--brand-purple)] hover:underline"
        onClick={onAddServiceLine}
      >
        + Weitere Leistung
      </button>
    </section>
  );
}
