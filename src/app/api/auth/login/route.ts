import { cookies } from "next/headers";
import { z } from "zod";

import { getSql } from "@/server/db";
import { apiError } from "@/server/http";
import { hashToken, newSessionToken, verifyPassword } from "@/server/password";
import { BookingError } from "@/server/time";
import { SESSION_COOKIE } from "@/server/auth";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new BookingError(422, "invalid", "E-Mail oder Passwort fehlt.");
    }
    const sql = getSql();
    const users = await sql<{ id: string; password_hash: string | null }[]>`
      SELECT id, password_hash FROM users WHERE email = ${parsed.data.email} AND status = 'active'
    `;
    const user = users[0];
    if (!user?.password_hash || !verifyPassword(parsed.data.password, user.password_hash)) {
      throw new BookingError(401, "auth", "Anmeldung fehlgeschlagen.");
    }
    const token = newSessionToken();
    const expires = new Date(Date.now() + 12 * 60 * 60 * 1000);
    await sql`
      INSERT INTO sessions (token_hash, user_id, expires_at)
      VALUES (${hashToken(token)}, ${user.id}, ${expires})
    `;
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires,
    });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
