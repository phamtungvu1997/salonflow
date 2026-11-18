import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { searchSalon } from "@/server/search";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const salonId = url.searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    const q = url.searchParams.get("q") ?? "";
    return Response.json({ hits: await searchSalon(getSql(), salonId, q) });
  } catch (error) {
    return apiError(error);
  }
}
