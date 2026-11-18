import { z } from "zod";

import { assertSalon, requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { addSupportEntry, listSupportEntries } from "@/server/support";
import { BookingError } from "@/server/time";

const postSchema = z.object({
  salonId: z.string().min(1),
  kind: z.enum(["idea", "message"]),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const salonId = new URL(request.url).searchParams.get("salonId") ?? user.defaultSalonId;
    assertSalon(user, salonId);
    return Response.json({ entries: await listSupportEntries(getSql(), salonId) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) throw new BookingError(422, "invalid", "Die Nachricht ist unvollständig.");
    assertSalon(user, parsed.data.salonId);
    const entries = await addSupportEntry(getSql(), {
      salonId: parsed.data.salonId,
      authorUserId: user.id,
      kind: parsed.data.kind,
      title: parsed.data.title,
      body: parsed.data.body,
    });
    return Response.json({ entries });
  } catch (error) {
    return apiError(error);
  }
}
