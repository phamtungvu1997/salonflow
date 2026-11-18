import { z } from "zod";

import { assertSalon, canManageSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { loadIntegrations, setChannelSimulator } from "@/server/integrations";
import { BookingError } from "@/server/time";

const putSchema = z.object({
  salonId: z.string().min(1),
  channel: z.string().min(1),
  simulatorEnabled: z.boolean(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    return Response.json(await loadIntegrations(getSql(), salonId));
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const parsed = putSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "Kanal oder Salon fehlt.");
    }
    assertSalon(user, parsed.data.salonId);
    if (!canManageSalon(user, parsed.data.salonId)) {
      throw new BookingError(403, "forbidden", "Keine Berechtigung für Integrationen.");
    }
    const desk = await setChannelSimulator(
      getSql(),
      parsed.data.salonId,
      parsed.data.channel,
      parsed.data.simulatorEnabled,
    );
    return Response.json(desk);
  } catch (error) {
    return apiError(error);
  }
}
