import { z } from "zod";

import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import {
  computePublicAvailableSlots,
  resolvePublicBookingCatalog,
  submitPublicBooking,
} from "@/server/online-booking";
import { BookingError } from "@/server/time";

export const dynamic = "force-dynamic";

// Simple in-memory rate bucket per token+IP to deter public abuse/enumeration.
const submitBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_SUBMITS = 25;

function checkSubmitRateLimit(request: Request, token: string) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  const key = `${ip}:${token}`;
  const now = Date.now();
  const bucket = submitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    submitBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX_SUBMITS) {
    throw new BookingError(
      429,
      "rate_limit",
      "Zu viele Buchungsversuche. Bitte versuchen Sie es in einer Minute erneut.",
    );
  }
}

const submitSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  firstName: z.string().trim().min(1, "Vorname erforderlich.").max(80),
  lastName: z.string().trim().min(1, "Nachname erforderlich.").max(80),
  email: z.string().trim().email("Gültige E-Mail-Adresse erforderlich.").max(160),
  phone: z.string().trim().min(4, "Telefonnummer erforderlich.").max(40),
  addressLine: z.string().trim().max(160).optional(),
  postalCode: z.string().trim().max(20).optional(),
  city: z.string().trim().max(80).optional(),
  birthDate: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
  newsletterOptIn: z.boolean().optional(),
  privacyAccepted: z.boolean(),
  idempotencyKey: z.string().max(120).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("serviceId");
    const staffId = url.searchParams.get("staffId");

    const sql = getSql();

    if (date && serviceId) {
      const availability = await computePublicAvailableSlots(sql, {
        token,
        date,
        serviceId,
        staffId,
      });
      return Response.json({ availability });
    }

    const catalog = await resolvePublicBookingCatalog(sql, token);
    // Return only public-safe configuration, services, and bookable staff — no customer/internal calendar rows.
    return Response.json({
      link: {
        token: catalog.link.token,
        name: catalog.link.name,
        shareFormat: catalog.link.shareFormat,
        allServices: catalog.link.allServices,
        allStaff: catalog.link.allStaff,
      },
      rules: catalog.rules,
      services: catalog.services,
      staff: catalog.staff,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    checkSubmitRateLimit(request, token);
    const parsed = submitSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(
        422,
        "invalid",
        parsed.error.issues[0]?.message ?? "Bitte überprüfen Sie Ihre Eingaben.",
      );
    }

    const booking = await submitPublicBooking(getSql(), {
      token,
      ...parsed.data,
    });

    return Response.json({ booking }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
