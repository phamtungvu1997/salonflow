import QRCode from "qrcode";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { ensureDefaultPublicBookingLink } from "@/server/online-booking";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    const link = await ensureDefaultPublicBookingLink(getSql(), salonId);
    const origin = new URL(request.url).origin;
    const svg = await QRCode.toString(`${origin}/b/${link.token}`, {
      type: "svg",
      margin: 1,
      width: 240,
      color: { dark: "#171614", light: "#fffcf8" },
    });
    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "content-disposition": "inline; filename=buchung.svg",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
