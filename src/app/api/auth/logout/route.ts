import { cookies } from "next/headers";

import { getSql } from "@/server/db";
import { hashToken } from "@/server/password";
import { SESSION_COOKIE } from "@/server/auth";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const sql = getSql();
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  jar.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
