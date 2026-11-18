import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { loadBilling, markInvoicePaid, setAutopay } from "@/server/billing";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { BookingError } from "@/server/time";

const actionSchema = z.object({
  salonId: z.string().min(1),
  action: z.enum(["pay", "autopay"]),
  invoiceId: z.string().optional(),
  enabled: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    return Response.json(await loadBilling(getSql(), salonId));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Abrechnung konnte nicht geändert werden.");
    assertSalon(user, parsed.data.salonId);
    if (!canManageSalon(user, parsed.data.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für die Abrechnung.");
    }
    const sql = getSql();
    if (parsed.data.action === "autopay") {
      await setAutopay(sql, parsed.data.salonId, Boolean(parsed.data.enabled));
    } else {
      if (!parsed.data.invoiceId) throw new BookingError(422, "invalid", "Rechnung fehlt.");
      await markInvoicePaid(sql, parsed.data.salonId, parsed.data.invoiceId);
    }
    return Response.json(await loadBilling(sql, parsed.data.salonId));
  } catch (error) {
    return apiError(error);
  }
}
