"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/features/booking/api";
import { useSalon } from "@/features/salons/salon-context";

type StaffMember = {
  id: string;
  displayName: string;
  color: string;
  shifts: { isoWeekday: number; startMinute: number; endMinute: number }[];
};

const weekdays = [
  [1, "Mo"],
  [2, "Di"],
  [3, "Mi"],
  [4, "Do"],
  [5, "Fr"],
  [6, "Sa"],
] as const;

export function StaffAdmin() {
  const { activeSalon } = useSalon();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  async function reload() {
    if (!activeSalon) return;
    const body = await api<{ staff: StaffMember[] }>(`/api/staff?salonId=${activeSalon.id}`);
    setStaff(body.staff);
    setSelected((current) => current ?? body.staff[0]?.id ?? null);
  }

  useEffect(() => {
    void reload().catch((error: Error) => setMessage(error.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSalon?.id]);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSalon) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api("/api/staff", {
        method: "POST",
        body: JSON.stringify({
          salonId: activeSalon.id,
          displayName: form.get("displayName"),
        }),
      });
      formElement.reset();
      setMessage("Mitarbeiter gespeichert.");
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mitarbeiter konnte nicht gespeichert werden.");
    }
  }

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeSalon || !selected) return;
    const form = new FormData(event.currentTarget);
    const shifts = weekdays.flatMap(([isoWeekday]) => {
      const start = String(form.get(`start-${isoWeekday}`) ?? "");
      const end = String(form.get(`end-${isoWeekday}`) ?? "");
      if (!start || !end) return [];
      return [{ isoWeekday, start, end }];
    });
    try {
      const result = await api<{ conflicts: string[] }>(`/api/staff/${selected}/hours`, {
        method: "PUT",
        body: JSON.stringify({ salonId: activeSalon.id, shifts }),
      });
      setMessage(
        result.conflicts.length
          ? `Arbeitszeiten gespeichert. ${result.conflicts.length} bestehende Termine liegen außerhalb.`
          : "Arbeitszeiten gespeichert.",
      );
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Arbeitszeiten konnten nicht gespeichert werden.");
    }
  }

  const current = staff.find((member) => member.id === selected);

  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="staff-admin">
      <form onSubmit={createStaff} className="rounded-xl border border-border bg-card p-4 shadow-panel">
        <h2 className="font-medium">Neuer Mitarbeiter</h2>
        <input
          name="displayName"
          required
          placeholder="Name"
          className="mt-3 h-10 w-full rounded-md border border-input px-3"
          data-testid="staff-name"
        />
        <Button className="mt-3" type="submit" data-testid="staff-create" disabled={!activeSalon}>Anlegen</Button>
      </form>
      <div className="rounded-xl border border-border bg-card p-4 shadow-panel">
        <h2 className="font-medium">Arbeitszeiten</h2>
        <select
          className="mt-3 h-10 w-full rounded-md border border-input px-2"
          value={selected ?? ""}
          onChange={(event) => setSelected(event.target.value)}
          data-testid="staff-select"
        >
          {staff.map((member) => (
            <option key={member.id} value={member.id}>{member.displayName}</option>
          ))}
        </select>
        <form key={selected ?? "none"} onSubmit={saveHours} className="mt-3 space-y-2">
          {weekdays.map(([isoWeekday, label]) => {
            const shift = current?.shifts.find((item) => item.isoWeekday === isoWeekday);
            const start = shift ? minutesLabel(shift.startMinute) : "";
            const end = shift ? minutesLabel(shift.endMinute) : "";
            return (
              <div key={isoWeekday} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2 text-sm">
                <span>{label}</span>
                <input name={`start-${isoWeekday}`} defaultValue={start} placeholder="09:00" className="h-9 rounded-md border border-input px-2" data-testid={`shift-start-${isoWeekday}`} />
                <input name={`end-${isoWeekday}`} defaultValue={end} placeholder="18:00" className="h-9 rounded-md border border-input px-2" data-testid={`shift-end-${isoWeekday}`} />
              </div>
            );
          })}
          <Button type="submit" data-testid="hours-save" disabled={!selected}>Zeiten speichern</Button>
        </form>
      </div>
      {message ? <p className="text-sm text-muted-foreground lg:col-span-2" data-testid="staff-message">{message}</p> : null}
      <ul className="lg:col-span-2 text-sm" data-testid="staff-list">
        {staff.map((member) => (
          <li key={member.id} data-testid={`staff-row-${member.displayName}`}>{member.displayName}</li>
        ))}
      </ul>
    </div>
  );
}

function minutesLabel(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
