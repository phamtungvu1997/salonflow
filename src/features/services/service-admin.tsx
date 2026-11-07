"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/features/booking/api";
import { formatEuro } from "@/domain/locale";
import { useSalon } from "@/features/salons/salon-context";

type StaffMember = { id: string; displayName: string };
type ServiceRow = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number;
  staffIds: string[];
};

export function ServiceAdmin() {
  const { activeSalon } = useSalon();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    if (!activeSalon) return;
    const [staffBody, serviceBody] = await Promise.all([
      api<{ staff: StaffMember[] }>(`/api/staff?salonId=${activeSalon.id}`),
      api<{ services: ServiceRow[] }>(`/api/services?salonId=${activeSalon.id}`),
    ]);
    setStaff(staffBody.staff);
    setServices(serviceBody.services);
  }

  useEffect(() => {
    void reload().catch((error: Error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSalon?.id]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSalon) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const staffIds = staff
      .map((member) => member.id)
      .filter((id) => form.get(`staff-${id}`) === "on");
    try {
      await api("/api/services", {
        method: "POST",
        body: JSON.stringify({
          salonId: activeSalon.id,
          name: form.get("name"),
          durationMinutes: Number(form.get("durationMinutes")),
          priceCents: Math.round(Number(form.get("priceEuro")) * 100),
          staffIds,
        }),
      });
      formElement.reset();
      setMessage("Leistung gespeichert.");
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Leistung konnte nicht gespeichert werden.");
    }
  }

  return (
    <div data-testid="service-admin">
      <form onSubmit={onSubmit} className="mb-4 rounded-xl border border-border bg-card p-4 shadow-panel">
        <div className="grid gap-3 md:grid-cols-3">
          <input name="name" required placeholder="Behandlung" className="h-10 rounded-md border border-input px-3" data-testid="service-name" />
          <input name="durationMinutes" required type="number" min={5} defaultValue={45} className="h-10 rounded-md border border-input px-3" data-testid="service-duration" />
          <input name="priceEuro" required type="number" min={0} step="0.5" defaultValue={35} className="h-10 rounded-md border border-input px-3" data-testid="service-price" />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {staff.map((member) => (
            <label key={member.id} className="flex items-center gap-2">
              <input type="checkbox" name={`staff-${member.id}`} data-testid={`service-staff-${member.id}`} />
              {member.displayName}
            </label>
          ))}
        </div>
        <Button className="mt-3" type="submit" data-testid="service-create">Leistung speichern</Button>
      </form>
      {message ? <p className="mb-3 text-sm" data-testid="service-message">{message}</p> : null}
      <ul className="space-y-2 text-sm" data-testid="service-list">
        {services.map((service) => (
          <li key={service.id} data-testid={`service-row-${service.name}`}>
            {service.name} · {service.durationMinutes} Min. · {formatEuro(service.priceCents)}
          </li>
        ))}
      </ul>
    </div>
  );
}
