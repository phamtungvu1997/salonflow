import type { Db } from "@/server/db";

export type VatRate = { id: string; name: string; percent: number; isDefault: boolean };
export type LoyaltySettings = {
  mode: "off" | "spend" | "service";
  eurosPerPoint: number;
};
export type InvoiceSettings = {
  autoGenerate: boolean;
  showDate: boolean;
  header: string;
  footer: string;
};
export type SiteSettings = {
  title: string;
  subtitle: string;
  body: string;
  domain: string;
};
export type PriceWidgetSettings = { width: number; height: number; color: string };
export type FeedbackSettings = { prompt: string; color: string };
export type GiftSettings = { amounts: number[]; buttonPosition: "left" | "right" };

export type WidgetBundle = {
  vat: VatRate[];
  loyalty: LoyaltySettings;
  invoice: InvoiceSettings;
  site: SiteSettings;
  priceWidget: PriceWidgetSettings;
  feedback: FeedbackSettings;
  gift: GiftSettings;
};

const DEFAULTS: WidgetBundle = {
  vat: [
    { id: "vat_19", name: "Regelsatz", percent: 19, isDefault: true },
    { id: "vat_7", name: "Ermäßigt", percent: 7, isDefault: false },
  ],
  loyalty: { mode: "service", eurosPerPoint: 25 },
  invoice: {
    autoGenerate: true,
    showDate: true,
    header: "",
    footer: "Zahlung im Salon. Dies ist ein Beleg, keine Kartenzahlung.",
  },
  site: { title: "", subtitle: "", body: "", domain: "" },
  priceWidget: { width: 400, height: 600, color: "#5c345f" },
  feedback: { prompt: "Wie war Ihr Besuch?", color: "#5c345f" },
  gift: { amounts: [25, 50, 100], buttonPosition: "right" },
};

async function ensure(sql: Db) {
  await sql`
    CREATE TABLE IF NOT EXISTS salon_widget_settings (
      salon_id text PRIMARY KEY,
      payload jsonb NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS widget_feedback (
      id text PRIMARY KEY,
      salon_id text NOT NULL,
      rating integer NOT NULL,
      comment text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS widget_gift_requests (
      id text PRIMARY KEY,
      salon_id text NOT NULL,
      amount_cents integer NOT NULL,
      buyer_name text NOT NULL,
      buyer_email text NOT NULL,
      recipient_name text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS loyalty_ledger (
      id text PRIMARY KEY,
      salon_id text NOT NULL,
      customer_id text NOT NULL,
      appointment_id text,
      points integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

function merge(payload: Partial<WidgetBundle> | null): WidgetBundle {
  return {
    vat: payload?.vat?.length ? payload.vat : DEFAULTS.vat,
    loyalty: { ...DEFAULTS.loyalty, ...payload?.loyalty },
    invoice: { ...DEFAULTS.invoice, ...payload?.invoice },
    site: { ...DEFAULTS.site, ...payload?.site },
    priceWidget: { ...DEFAULTS.priceWidget, ...payload?.priceWidget },
    feedback: { ...DEFAULTS.feedback, ...payload?.feedback },
    gift: { ...DEFAULTS.gift, ...payload?.gift },
  };
}

export async function loadWidgets(sql: Db, salonId: string): Promise<WidgetBundle> {
  await ensure(sql);
  const [row] = await sql<{ payload: Partial<WidgetBundle> }[]>`
    SELECT payload FROM salon_widget_settings WHERE salon_id = ${salonId}
  `;
  return merge(row?.payload ?? null);
}

export async function saveWidgets(sql: Db, salonId: string, patch: Partial<WidgetBundle>) {
  const current = await loadWidgets(sql, salonId);
  const next = merge({ ...current, ...patch });
  const json = JSON.stringify(next);
  await sql.unsafe(
    `INSERT INTO salon_widget_settings (salon_id, payload)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (salon_id) DO UPDATE SET payload = EXCLUDED.payload`,
    [salonId, json],
  );
  return next;
}

export async function awardLoyaltyForCompletion(
  sql: Db,
  input: { salonId: string; customerId: string; appointmentId: string; priceCents: number },
) {
  try {
    const settings = await loadWidgets(sql, input.salonId);
    if (settings.loyalty.mode === "off") return;
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM loyalty_ledger
      WHERE appointment_id = ${input.appointmentId}
      LIMIT 1
    `;
    if (existing[0]) return;
    const points =
      settings.loyalty.mode === "spend"
        ? Math.floor(input.priceCents / 100 / Math.max(1, settings.loyalty.eurosPerPoint))
        : 1;
    if (points <= 0) return;
    await sql`
      INSERT INTO loyalty_ledger (id, salon_id, customer_id, appointment_id, points)
      VALUES (${`loy_${crypto.randomUUID()}`}, ${input.salonId}, ${input.customerId}, ${input.appointmentId}, ${points})
    `;
  } catch (error) {
    console.error("loyalty award skipped", error);
  }
}

export async function loyaltyBalance(sql: Db, salonId: string, customerId: string) {
  await ensure(sql);
  const [row] = await sql<{ points: number }[]>`
    SELECT COALESCE(sum(points), 0)::int AS points
    FROM loyalty_ledger
    WHERE salon_id = ${salonId} AND customer_id = ${customerId}
  `;
  return row?.points ?? 0;
}
