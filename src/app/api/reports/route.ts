import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { loadSalonReport, type ReportPreset } from "@/server/reports";
import { BookingError } from "@/server/time";

const presets = ["today", "week", "month", "year"] as const;

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    const parsed = z.enum(presets).safeParse(url.searchParams.get("preset") ?? "month");
    if (!parsed.success) throw new BookingError(422, "invalid", "Der Zeitraum ist ungültig.");
    assertSalon(user, salonId);
    return Response.json(await loadSalonReport(getSql(), salonId, parsed.data as ReportPreset));
  } catch (error) {
    return apiError(error);
  }
}
