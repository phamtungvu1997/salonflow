import type { Db } from "@/server/db";
import { ensureDefaultPublicBookingLink } from "@/server/online-booking";
import { loadWidgets } from "@/server/widgets";

export type OnlineReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type OnlineDesk = {
  salonName: string;
  bookingPath: string;
  sitePath: string;
  description: string;
  googleRequested: boolean;
  instagram: string;
  facebook: string;
  phone: string;
  email: string;
  address: string;
  serviceCount: number;
  onlineBookingCount: number;
  siteTitle: string;
  siteSubtitle: string;
  siteBody: string;
  siteDomain: string;
  reviews: OnlineReview[];
};

async function ensure(sql: Db) {
  await sql`
    CREATE TABLE IF NOT EXISTS salon_online_profiles (
      salon_id text PRIMARY KEY,
      description text NOT NULL DEFAULT '',
      google_requested boolean NOT NULL DEFAULT false
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
}

export async function loadOnlineDesk(sql: Db, salonId: string): Promise<OnlineDesk> {
  await ensure(sql);
  const link = await ensureDefaultPublicBookingLink(sql, salonId);
  const widgets = await loadWidgets(sql, salonId);
  const [salon] = await sql<{ name: string }[]>`
    SELECT name FROM salons WHERE id = ${salonId}
  `;
  const [settings] = await sql<{
    phone: string;
    email: string;
    address_line: string;
    house_number: string;
    postal_code: string;
    city: string;
    instagram_handle: string;
    facebook_handle: string;
  }[]>`
    SELECT phone, notification_email AS email, address_line, house_number, postal_code, city,
           instagram_handle, facebook_handle
    FROM salon_settings
    WHERE salon_id = ${salonId}
  `;
  const [services] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM salon_services
    WHERE salon_id = ${salonId} AND active = true
  `;
  const [bookings] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
    FROM appointments
    WHERE salon_id = ${salonId}
      AND (
        notes ILIKE '%[Online-Buchung]%'
        OR notes ILIKE '%[Online-Anfrage bestätigt]%'
      )
  `;
  await sql`
    INSERT INTO salon_online_profiles (salon_id)
    VALUES (${salonId})
    ON CONFLICT (salon_id) DO NOTHING
  `;
  const [profile] = await sql<{ description: string; google_requested: boolean }[]>`
    SELECT description, google_requested
    FROM salon_online_profiles
    WHERE salon_id = ${salonId}
  `;
  const reviews = await sql<{ id: string; rating: number; comment: string | null; created_at: Date }[]>`
    SELECT id, rating, comment, created_at
    FROM widget_feedback
    WHERE salon_id = ${salonId}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  const address = settings
    ? `${settings.address_line} ${settings.house_number}, ${settings.postal_code} ${settings.city}`.trim()
    : "";
  return {
    salonName: salon?.name ?? "",
    bookingPath: `/b/${link.token}`,
    sitePath: `/widget/seite/${salonId}`,
    description: profile?.description ?? "",
    googleRequested: profile?.google_requested ?? false,
    instagram: settings?.instagram_handle ?? "",
    facebook: settings?.facebook_handle ?? "",
    phone: settings?.phone ?? "",
    email: settings?.email ?? "",
    address,
    serviceCount: services?.count ?? 0,
    onlineBookingCount: bookings?.count ?? 0,
    siteTitle: widgets.site.title,
    siteSubtitle: widgets.site.subtitle,
    siteBody: widgets.site.body,
    siteDomain: widgets.site.domain,
    reviews: reviews.map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment ?? "",
      createdAt: row.created_at.toISOString(),
    })),
  };
}

export async function saveOnlineProfile(
  sql: Db,
  input: { salonId: string; description: string; instagram: string; facebook: string },
) {
  await ensure(sql);
  await sql`
    INSERT INTO salon_online_profiles (salon_id, description)
    VALUES (${input.salonId}, ${input.description})
    ON CONFLICT (salon_id) DO UPDATE SET description = EXCLUDED.description
  `;
  await sql`
    UPDATE salon_settings
    SET instagram_handle = ${input.instagram}, facebook_handle = ${input.facebook}
    WHERE salon_id = ${input.salonId}
  `;
  return loadOnlineDesk(sql, input.salonId);
}

export async function saveGoogleRequest(sql: Db, salonId: string, requested: boolean) {
  await ensure(sql);
  await sql`
    INSERT INTO salon_online_profiles (salon_id, google_requested)
    VALUES (${salonId}, ${requested})
    ON CONFLICT (salon_id) DO UPDATE SET google_requested = EXCLUDED.google_requested
  `;
  return loadOnlineDesk(sql, salonId);
}
