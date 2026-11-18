import type { Db } from "@/server/db";
import { APP_TIME_ZONE } from "@/server/time";

export type SearchHit = {
  id: string;
  kind: "customer" | "appointment" | "service";
  title: string;
  detail: string;
  href: string;
};

function likeOf(query: string): string {
  return `%${query.replace(/[%_\\]/g, "\\$&")}%`;
}

function berlinDate(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function berlinTime(instant: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

export async function searchSalon(sql: Db, salonId: string, query: string): Promise<SearchHit[]> {
  const needle = query.trim();
  if (needle.length < 1) return [];
  const like = likeOf(needle);

  const customers = await sql<{ id: string; display_name: string; phone: string | null; email: string | null }[]>`
    SELECT id, display_name, phone_normalized AS phone, email
    FROM customers
    WHERE home_salon_id = ${salonId}
      AND archived_at IS NULL
      AND (
        display_name ILIKE ${like}
        OR coalesce(phone_normalized, '') ILIKE ${like}
        OR coalesce(email, '') ILIKE ${like}
      )
    ORDER BY display_name
    LIMIT 6
  `;

  const services = await sql<{ id: string; name: string; price_cents: number }[]>`
    SELECT sv.id, sv.name, ss.price_cents
    FROM services sv
    JOIN salon_services ss ON ss.service_id = sv.id AND ss.salon_id = ${salonId} AND ss.active
    WHERE sv.active AND sv.name ILIKE ${like}
    ORDER BY sv.name
    LIMIT 6
  `;

  const appointments = await sql<{
    id: string;
    start_at: Date;
    customer_name: string;
    title_snapshot: string;
  }[]>`
    SELECT a.id, a.start_at, c.display_name AS customer_name, i.title_snapshot
    FROM appointments a
    JOIN customers c ON c.id = a.customer_id
    JOIN appointment_services i ON i.appointment_id = a.id AND i.sequence = 1
    WHERE a.salon_id = ${salonId}
      AND a.status <> 'cancelled'
      AND (
        c.display_name ILIKE ${like}
        OR i.title_snapshot ILIKE ${like}
      )
    ORDER BY a.start_at DESC
    LIMIT 6
  `;

  return [
    ...customers.map((row) => ({
      id: `customer-${row.id}`,
      kind: "customer" as const,
      title: row.display_name,
      detail: [row.phone, row.email].filter(Boolean).join(" · ") || "Kundin",
      href: `/kunden?kunde=${encodeURIComponent(row.id)}`,
    })),
    ...appointments.map((row) => ({
      id: `appointment-${row.id}`,
      kind: "appointment" as const,
      title: `${row.customer_name} · ${row.title_snapshot}`,
      detail: `${berlinDate(row.start_at).split("-").reverse().join(".")} · ${berlinTime(row.start_at)}`,
      href: `/kalender?datum=${berlinDate(row.start_at)}`,
    })),
    ...services.map((row) => ({
      id: `service-${row.id}`,
      kind: "service" as const,
      title: row.name,
      detail: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(row.price_cents / 100),
      href: "/einstellungen?section=services",
    })),
  ];
}
