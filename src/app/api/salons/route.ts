import { requireUser } from "@/server/auth";
import { getSql } from "@/server/db";
import { apiError } from "@/server/http";

export async function GET() {
  try {
    const user = await requireUser();
    if (user.salonIds.length === 0) return Response.json({ salons: [] });
    const sql = getSql();
    const salons = await sql<{ id: string; name: string; city: string }[]>`
      SELECT id, name, city FROM salons
      WHERE active AND id IN ${sql(user.salonIds)}
      ORDER BY
        CASE id
          WHEN 'salon_jeannie' THEN 1
          WHEN 'salon_juliet' THEN 2
          WHEN 'salon_heide' THEN 3
          ELSE 4
        END,
        name ASC
    `;
    return Response.json({ salons });
  } catch (error) {
    return apiError(error);
  }
}
