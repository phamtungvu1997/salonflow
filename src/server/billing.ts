import type { Db } from "@/server/db";
import { BookingError } from "@/server/time";

const PLAN_CENTS = 5900;
const INCLUDED_SEATS = 2;
const SEAT_CENTS = 500;

export type BillingInvoice = {
  id: string;
  number: string;
  periodStart: string;
  dueOn: string;
  planCents: number;
  seatCount: number;
  seatCents: number;
  totalCents: number;
  status: "open" | "paid" | "overdue";
  paidAt: string | null;
};

function monthStart(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return `${parts.slice(0, 7)}-01`;
}

function dueOnFor(periodStart: string): string {
  return `${periodStart.slice(0, 7)}-10`;
}

function todayBerlin(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function ensureTables(sql: Db) {
  await sql`
    CREATE TABLE IF NOT EXISTS salon_subscriptions (
      salon_id text PRIMARY KEY,
      plan_name text NOT NULL DEFAULT 'Studio',
      plan_cents integer NOT NULL DEFAULT 5900,
      included_seats integer NOT NULL DEFAULT 2,
      seat_cents integer NOT NULL DEFAULT 500,
      autopay_enabled boolean NOT NULL DEFAULT false
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS salon_subscription_invoices (
      id text PRIMARY KEY,
      salon_id text NOT NULL,
      invoice_number text NOT NULL,
      period_start date NOT NULL,
      due_on date NOT NULL,
      plan_cents integer NOT NULL,
      seat_count integer NOT NULL,
      seat_cents integer NOT NULL,
      total_cents integer NOT NULL,
      status text NOT NULL DEFAULT 'open',
      paid_at timestamptz,
      UNIQUE (salon_id, invoice_number)
    )
  `;
}

export async function loadBilling(sql: Db, salonId: string) {
  await ensureTables(sql);
  await sql`
    INSERT INTO salon_subscriptions (salon_id)
    VALUES (${salonId})
    ON CONFLICT (salon_id) DO NOTHING
  `;
  const [sub] = await sql<{ autopay_enabled: boolean; plan_name: string }[]>`
    SELECT autopay_enabled, plan_name FROM salon_subscriptions WHERE salon_id = ${salonId}
  `;
  const [seatRow] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM staff_salon_assignments
    WHERE salon_id = ${salonId} AND active = true
  `;
  const activeSeats = seatRow?.count ?? 0;
  const extraSeats = Math.max(0, activeSeats - INCLUDED_SEATS);
  const employeeCents = extraSeats * SEAT_CENTS;
  const totalCents = PLAN_CENTS + employeeCents;
  const period = monthStart();
  const number = `SF-${salonId.slice(-4).toUpperCase()}-${period.slice(0, 7).replace("-", "")}`;
  const due = dueOnFor(period);
  const status = due < todayBerlin() ? "overdue" : "open";
  await sql`
    INSERT INTO salon_subscription_invoices (
      id, salon_id, invoice_number, period_start, due_on,
      plan_cents, seat_count, seat_cents, total_cents, status
    ) VALUES (
      ${`sinv_${salonId}_${period}`}, ${salonId}, ${number}, ${period}, ${due},
      ${PLAN_CENTS}, ${extraSeats}, ${employeeCents}, ${totalCents}, ${status}
    )
    ON CONFLICT (salon_id, invoice_number) DO UPDATE SET
      status = CASE
        WHEN salon_subscription_invoices.status = 'paid' THEN 'paid'
        WHEN EXCLUDED.due_on < CURRENT_DATE THEN 'overdue'
        ELSE 'open'
      END
  `;
  const rows = await sql<{
    id: string;
    invoice_number: string;
    period_start: string;
    due_on: string;
    plan_cents: number;
    seat_count: number;
    seat_cents: number;
    total_cents: number;
    status: string;
    paid_at: Date | null;
  }[]>`
    SELECT id, invoice_number, period_start::text, due_on::text, plan_cents, seat_count,
           seat_cents, total_cents, status, paid_at
    FROM salon_subscription_invoices
    WHERE salon_id = ${salonId}
    ORDER BY period_start DESC
  `;
  const invoices: BillingInvoice[] = rows.map((row) => ({
    id: row.id,
    number: row.invoice_number,
    periodStart: row.period_start,
    dueOn: row.due_on,
    planCents: row.plan_cents,
    seatCount: row.seat_count,
    seatCents: row.seat_cents,
    totalCents: row.total_cents,
    status: row.status === "paid" ? "paid" : row.status === "overdue" ? "overdue" : "open",
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
  }));
  return {
    planName: sub?.plan_name ?? "Studio",
    planCents: PLAN_CENTS,
    includedSeats: INCLUDED_SEATS,
    activeSeats,
    extraSeats,
    employeeCents,
    totalCents,
    autopayEnabled: sub?.autopay_enabled ?? false,
    openInvoices: invoices.filter((item) => item.status !== "paid"),
    paidInvoices: invoices.filter((item) => item.status === "paid"),
  };
}

export async function setAutopay(sql: Db, salonId: string, enabled: boolean) {
  await ensureTables(sql);
  await sql`
    INSERT INTO salon_subscriptions (salon_id, autopay_enabled)
    VALUES (${salonId}, ${enabled})
    ON CONFLICT (salon_id) DO UPDATE SET autopay_enabled = ${enabled}
  `;
}

export async function markInvoicePaid(sql: Db, salonId: string, invoiceId: string) {
  await ensureTables(sql);
  const updated = await sql<{ id: string }[]>`
    UPDATE salon_subscription_invoices
    SET status = 'paid', paid_at = now()
    WHERE id = ${invoiceId} AND salon_id = ${salonId} AND status <> 'paid'
    RETURNING id
  `;
  if (!updated[0]) throw new BookingError(404, "missing", "Rechnung nicht gefunden oder schon bezahlt.");
}
