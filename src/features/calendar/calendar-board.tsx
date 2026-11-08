"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/features/booking/api";
import { useSalon } from "@/features/salons/salon-context";

type Shift = { isoWeekday: number; startMinute: number; endMinute: number };
type StaffColumn = { id: string; displayName: string; color: string; shifts: Shift[] };
type Appointment = {
  id: string;
  staffId: string;
  customerName: string;
  serviceName: string;
  startMinute: number;
  endMinute: number;
  version: number;
};
type ServiceOption = { id: string; name: string; durationMinutes: number; staffIds: string[] };
type CustomerOption = { id: string; displayName: string };

const startHour = 8;
const endHour = 20;
const slots = Array.from({ length: ((endHour - startHour) * 60) / 15 }, (_, index) => {
  const minute = startHour * 60 + index * 15;
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
});

function todayIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function readDateFromLocation() {
  if (typeof window === "undefined") return todayIso();
  const fromUrl = new URLSearchParams(window.location.search).get("datum");
  return fromUrl && /^\d{4}-\d{2}-\d{2}$/.test(fromUrl) ? fromUrl : todayIso();
}

export function CalendarBoard() {
  const { activeSalon } = useSalon();
  const [date, setDate] = useState(readDateFromLocation);
  const [staff, setStaff] = useState<StaffColumn[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [slot, setSlot] = useState<{ staffId: string; start: string } | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("new");

  async function reload() {
    if (!activeSalon) return;
    const [calendar, serviceBody, customerBody] = await Promise.all([
      api<{ staff: StaffColumn[]; appointments: Appointment[] }>(
        `/api/calendar?salonId=${activeSalon.id}&date=${date}`,
      ),
      api<{ services: ServiceOption[] }>(`/api/services?salonId=${activeSalon.id}`),
      api<{ customers: CustomerOption[] }>(`/api/customers?salonId=${activeSalon.id}`),
    ]);
    setStaff(calendar.staff);
    setAppointments(calendar.appointments);
    setServices(serviceBody.services);
    setCustomers(customerBody.customers);
  }

  useEffect(() => {
    const fromUrl = readDateFromLocation();
    setDate((current) => (current === fromUrl ? current : fromUrl));
  }, []);

  useEffect(() => {
    void reload().catch((error: Error) => setMessage(error.message));
    // reload closes over the current salon and date, which are the effect deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSalon?.id, date]);

  const weekday = isoWeekdayFromDate(date);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSalon || !slot) return;
    const form = new FormData(event.currentTarget);
    let customerId = String(form.get("customerId") ?? "");
    const serviceId = form.get("serviceId");
    const newCustomer = form.get("newCustomer");
    try {
      if (customerMode === "new") {
        const created = await api<{ customerId: string }>("/api/customers", {
          method: "POST",
          body: JSON.stringify({
            salonId: activeSalon.id,
            displayName: newCustomer,
          }),
        });
        customerId = created.customerId;
      }
      await api("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          salonId: activeSalon.id,
          staffId: slot.staffId,
          customerId,
          serviceId,
          date,
          start: slot.start,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      setSlot(null);
      setMessage("Termin gespeichert.");
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Termin konnte nicht gespeichert werden.");
    }
  }

  async function move(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    await api(`/api/appointments/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        expectedVersion: selected.version,
        date,
        start: form.get("start"),
      }),
    });
    setSelected(null);
    setMessage("Termin verschoben.");
    await reload();
  }

  async function cancel() {
    if (!selected) return;
    await api(`/api/appointments/${selected.id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ expectedVersion: selected.version }),
    });
    setSelected(null);
    setMessage("Termin storniert.");
    await reload();
  }

  return (
    <div data-testid="calendar-board">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Datum
          <input
            type="date"
            value={date}
            onChange={(event) => {
              const next = event.target.value;
              setDate(next);
              const url = new URL(window.location.href);
              url.searchParams.set("datum", next);
              window.history.replaceState(null, "", url);
            }}
            className="ml-2 h-9 rounded-md border border-input px-2"
            data-testid="calendar-date"
          />
        </label>
        {message ? <p className="text-sm" data-testid="calendar-message">{message}</p> : null}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card" data-testid="calendar-day-grid">
        <div
          className="min-w-max grid"
          style={{ gridTemplateColumns: `64px repeat(${Math.max(staff.length, 1)}, minmax(150px, 1fr))` }}
        >
          <div className="border-b bg-muted/40" style={{ gridColumn: 1, gridRow: 1 }} />
          {staff.map((member, staffIndex) => (
            <div key={member.id} className="border-b border-l px-2 py-2 text-sm font-medium" style={{ gridColumn: staffIndex + 2, gridRow: 1 }} data-testid={`column-${member.id}`}>
              {member.displayName}
            </div>
          ))}
          {slots.map((time) => {
            const row = slots.indexOf(time) + 2;
            return (
            <div key={time} className="contents">
              <div className="h-7 border-b px-1 text-right text-[10px] text-muted-foreground" style={{ gridColumn: 1, gridRow: row }}>{time.endsWith("00") ? time : ""}</div>
              {staff.map((member, staffIndex) => {
                const minute = toMinute(time);
                const covering = appointments.find(
                  (item) =>
                    item.staffId === member.id &&
                    minute >= item.startMinute &&
                    minute < item.endMinute,
                );
                if (covering && covering.startMinute !== minute) return null;
                const span = covering ? Math.max(1, (covering.endMinute - covering.startMinute) / 15) : 1;
                const shiftOk = member.shifts.some(
                  (shift) => shift.isoWeekday === weekday && minute >= shift.startMinute && minute < shift.endMinute,
                );
                return (
                  <div
                    key={`${member.id}-${time}`}
                    className={`relative border-b border-l ${shiftOk ? "" : "unavailable-hatch"} ${covering ? "" : "h-7"}`}
                    style={{ gridColumn: staffIndex + 2, gridRow: covering ? `${row} / span ${span}` : row }}
                  >
                    {covering ? (
                      <button
                        type="button"
                        className="h-full w-full overflow-hidden px-1 text-left text-[10px]"
                        style={{ backgroundColor: `${member.color}88` }}
                        data-testid={`appointment-${covering.id}`}
                        onClick={() => setSelected(covering)}
                      >
                        {covering.customerName}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="h-full w-full"
                        aria-label={`${member.displayName} ${time}`}
                        data-testid={`slot-${member.id}-${time}`}
                        onClick={() => setSlot({ staffId: member.id, start: time })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
      </div>

      {slot ? (
        <form onSubmit={book} className="mt-4 rounded-xl border border-border bg-card p-4" data-testid="booking-form">
          <h2 className="font-medium">Termin {slot.start}</h2>
          <div className="mt-2 flex gap-3 text-sm">
            <label><input type="radio" checked={customerMode === "new"} onChange={() => setCustomerMode("new")} /> Neue Kundin</label>
            <label><input type="radio" checked={customerMode === "existing"} onChange={() => setCustomerMode("existing")} /> Vorhanden</label>
          </div>
          {customerMode === "new" ? (
            <input name="newCustomer" required placeholder="Name" className="mt-2 h-10 w-full rounded-md border px-3" data-testid="booking-customer-name" />
          ) : (
            <select name="customerId" className="mt-2 h-10 w-full rounded-md border px-2" data-testid="booking-customer-select">
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.displayName}</option>
              ))}
            </select>
          )}
          <select name="serviceId" required className="mt-2 h-10 w-full rounded-md border px-2" data-testid="booking-service">
            {services
              .filter((service) => service.staffIds.includes(slot.staffId))
              .map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {service.durationMinutes} Min.
                </option>
              ))}
          </select>
          <div className="mt-3 flex gap-2">
            <Button type="submit" data-testid="booking-save">Speichern</Button>
            <Button type="button" variant="outline" onClick={() => setSlot(null)}>Abbrechen</Button>
          </div>
        </form>
      ) : null}

      {selected ? (
        <form onSubmit={move} className="mt-4 rounded-xl border border-border bg-card p-4" data-testid="appointment-dialog">
          <h2 className="font-medium">{selected.customerName}</h2>
          <p className="text-sm text-muted-foreground">{selected.serviceName}</p>
          <label className="mt-2 block text-sm">
            Neue Startzeit
            <input name="start" required defaultValue={minutesLabel(selected.startMinute)} className="mt-1 h-10 w-full rounded-md border px-3" data-testid="appointment-start" />
          </label>
          <div className="mt-3 flex gap-2">
            <Button type="submit" data-testid="appointment-save">Verschieben</Button>
            <Button type="button" variant="outline" onClick={() => void cancel()} data-testid="appointment-cancel">Stornieren</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function toMinute(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesLabel(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function isoWeekdayFromDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(utc);
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[label] ?? 1;
}
