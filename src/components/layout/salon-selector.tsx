"use client";

import { useSalon } from "@/features/salons/salon-context";

export function SalonSelector() {
  const { salons, activeSalon, setActiveSalonId, ready } = useSalon();

  return (
    <label className="flex flex-col gap-0.5 text-xs text-muted-foreground">
      <span className="uppercase tracking-[0.14em]">Salon</span>
      <select
        className="h-9 min-w-[220px] rounded-md border border-input bg-card px-2 text-sm font-medium text-foreground shadow-sm"
        value={activeSalon?.id ?? ""}
        onChange={(event) => setActiveSalonId(event.target.value)}
        data-testid="salon-selector"
        aria-label="Salon auswählen"
        disabled={!ready || salons.length === 0}
      >
        {salons.length === 0 ? <option value="">Kein Salon</option> : null}
        {salons.map((salon) => (
          <option key={salon.id} value={salon.id}>
            {salon.name}
          </option>
        ))}
      </select>
    </label>
  );
}
