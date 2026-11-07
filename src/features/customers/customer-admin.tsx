"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/features/booking/api";
import { useSalon } from "@/features/salons/salon-context";

type Customer = { id: string; displayName: string; phone: string | null };

export function CustomerAdmin() {
  const { activeSalon } = useSalon();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    if (!activeSalon) return;
    const body = await api<{ customers: Customer[] }>(`/api/customers?salonId=${activeSalon.id}`);
    setCustomers(body.customers);
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
    try {
      await api("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          salonId: activeSalon.id,
          displayName: form.get("displayName"),
          phone: form.get("phone") || undefined,
        }),
      });
      formElement.reset();
      setMessage("Kunde gespeichert.");
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunde konnte nicht gespeichert werden.");
    }
  }

  return (
    <div data-testid="customer-admin">
      <form onSubmit={onSubmit} className="mb-4 flex flex-wrap gap-2">
        <input name="displayName" required placeholder="Name" className="h-10 rounded-md border border-input px-3" data-testid="customer-name" />
        <input name="phone" placeholder="Telefon" className="h-10 rounded-md border border-input px-3" />
        <Button type="submit" data-testid="customer-create">Kunde anlegen</Button>
      </form>
      {message ? <p className="mb-2 text-sm" data-testid="customer-message">{message}</p> : null}
      <ul className="text-sm" data-testid="customer-list">
        {customers.map((customer) => (
          <li key={customer.id}>{customer.displayName}</li>
        ))}
      </ul>
    </div>
  );
}
